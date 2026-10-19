import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import WebSocket from "ws";
import { decodeFrame, encodeFrame, formatParams, OPCODES } from "wire-axi";
import { serve } from "../src/server.js";

async function setupServer() {
  const dir = await mkdtemp(path.join(tmpdir(), "lavish-wire-test-"));
  const artifact = path.join(dir, "artifact.html");
  await writeFile(artifact, "<!doctype html><html><body><h1>Test</h1></body></html>");
  const server = await serve({ port: 0, stateFile: path.join(dir, "state.json"), version: "9.9.9-test" });
  const base = `http://127.0.0.1:${server.port}`;
  const res = await fetch(`${base}/api/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ file: artifact }),
  });
  const { key } = await res.json();
  return {
    dir,
    artifact,
    server,
    base,
    key,
    async close() {
      await server.close();
      await rm(dir, { recursive: true, force: true });
    },
    async submitPrompt(text) {
      const resp = await fetch(`${base}/api/${key}/prompts`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: base },
        body: JSON.stringify({ prompts: [{ prompt: text, tag: "message" }] }),
      });
      assert.equal(resp.status, 200);
    },
  };
}

/**
 * @param {number} port
 * @param {string} key
 * @param {{ lastSeenSeq?: number, hasReply?: boolean }} [options]
 */
function connectWireClient(port, key, { lastSeenSeq, hasReply = false } = {}) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/wire/${encodeURIComponent(key)}`);
  const frames = [];
  const openPromise = new Promise((resolve, reject) => {
    ws.on("error", reject);
    ws.on("open", () => {
      const payloadObj = {
        session: key,
        role: "agent",
        client: "test-client",
      };
      if (lastSeenSeq !== undefined) {
        payloadObj.last_seen_seq = lastSeenSeq;
      }
      if (hasReply) {
        payloadObj.has_reply = "1";
      }
      const openFrame = encodeFrame({
        type: OPCODES.OPEN,
        seqId: typeof lastSeenSeq === "number" ? lastSeenSeq : 0,
        channel: key,
        flags: "-",
        payload: formatParams(payloadObj),
      });
      ws.send(openFrame);
    });

    ws.on("message", (data) => {
      const frame = decodeFrame(data.toString());
      frames.push(frame);
      if (frame.type === OPCODES.OPEN) {
        resolve(frame);
      }
    });
  });

  return {
    ws,
    frames,
    openPromise,
    async waitForMessage(timeoutMs = 1000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const msg = frames.find((f) => f.type === OPCODES.MESSAGE);
        if (msg) return msg;
        await new Promise((r) => setTimeout(r, 20));
      }
      return null;
    },
    async close() {
      ws.close();
      await new Promise((r) => ws.once("close", r));
    },
  };
}

test("fresh wire listener connecting with last_seen_seq=0 or omitted does not replay historical messages", async () => {
  const fixture = await setupServer();
  try {
    // 1. First client connects and receives prompt 1
    const c1 = connectWireClient(fixture.server.port, fixture.key, { lastSeenSeq: 0 });
    await c1.openPromise;

    await fixture.submitPrompt("First historical prompt");
    const msg1 = await c1.waitForMessage(2000);
    assert.ok(msg1, "c1 must receive the prompt");
    assert.equal(msg1.seqId, 1);
    await c1.close();

    // 2. Second client connects fresh with last_seen_seq=0 (standard wire-axi client default)
    const c2 = connectWireClient(fixture.server.port, fixture.key, { lastSeenSeq: 0 });
    const openFrame2 = await c2.openPromise;
    assert.equal(openFrame2.seqId, 1, "OPEN frame carries current channel head seq (1)");

    // Wait 150ms to verify zero historical replay frames arrive
    await new Promise((r) => setTimeout(r, 150));
    const replayed = c2.frames.filter((f) => f.type === OPCODES.MESSAGE);
    assert.equal(replayed.length, 0, "fresh client connecting with last_seen_seq=0 must not receive historical replay");
    await c2.close();

    // 3. Third client connects omitting last_seen_seq entirely
    const c3 = connectWireClient(fixture.server.port, fixture.key);
    const openFrame3 = await c3.openPromise;
    assert.equal(openFrame3.seqId, 1);

    await new Promise((r) => setTimeout(r, 150));
    const replayed3 = c3.frames.filter((f) => f.type === OPCODES.MESSAGE);
    assert.equal(replayed3.length, 0, "client omitting last_seen_seq must not receive historical replay");
    await c3.close();
  } finally {
    await fixture.close();
  }
});

test("reconnecting wire listener with explicit last_seen_seq > 0 replays only newer messages", async () => {
  const fixture = await setupServer();
  try {
    const c1 = connectWireClient(fixture.server.port, fixture.key, { lastSeenSeq: 0 });
    await c1.openPromise;

    await fixture.submitPrompt("Prompt 1");
    const m1 = await c1.waitForMessage(2000);
    assert.equal(m1?.seqId, 1);

    await fixture.submitPrompt("Prompt 2");
    // wait for sequence 2 to be published
    const startWait = Date.now();
    while (Date.now() - startWait < 2000) {
      if (c1.frames.some((f) => f.seqId === 2)) break;
      await new Promise((r) => setTimeout(r, 20));
    }
    const m2 = c1.frames.find((f) => f.seqId === 2);
    assert.ok(m2, "c1 must receive prompt 2");
    await c1.close();

    // Reconnecting client with last_seen_seq = 1 (missed prompt 2)
    const c2 = connectWireClient(fixture.server.port, fixture.key, { lastSeenSeq: 1 });
    await c2.openPromise;

    // Give replay time to arrive
    await new Promise((r) => setTimeout(r, 100));
    const replayed = c2.frames.filter((f) => f.type === OPCODES.MESSAGE);
    assert.equal(replayed.length, 1, "must replay exactly one message");
    assert.equal(replayed[0].seqId, 2, "replayed message must be seqId 2");
    assert.ok(replayed[0].payload.includes("Prompt 2"), "replayed payload must contain Prompt 2");
    await c2.close();
  } finally {
    await fixture.close();
  }
});

test("live message is dispatched to active connected listener in real time", async () => {
  const fixture = await setupServer();
  try {
    const c1 = connectWireClient(fixture.server.port, fixture.key, { lastSeenSeq: 0 });
    await c1.openPromise;

    await fixture.submitPrompt("Realtime prompt test");
    const msg = await c1.waitForMessage(2000);
    assert.ok(msg, "active listener must receive real-time prompt message");
    assert.equal(msg.seqId, 1);
    assert.ok(msg.payload.includes("Realtime prompt test"));
    await c1.close();
  } finally {
    await fixture.close();
  }
});
