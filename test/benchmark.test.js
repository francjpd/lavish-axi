import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  BENCHMARK_PROBE_TAG,
  generateLoremIpsumProbe,
  isBenchmarkProbe,
  estimateTokens,
  runSideBySideTurn,
  renderBenchmarkReport,
} from "../src/benchmark.js";
import { serve } from "../src/server.js";
import { VERSION } from "../src/cli.js";

test("generateLoremIpsumProbe generates exact length string tagged with probe marker", () => {
  const probe50 = generateLoremIpsumProbe(50);
  assert.equal(probe50.length, 50);
  assert.ok(probe50.startsWith(BENCHMARK_PROBE_TAG));

  const probe200 = generateLoremIpsumProbe(200);
  assert.equal(probe200.length, 200);
  assert.ok(probe200.startsWith(BENCHMARK_PROBE_TAG));
  assert.ok(isBenchmarkProbe(probe200));

  assert.equal(isBenchmarkProbe("Real user prompt"), false);
});

test("estimateTokens calculates proportional LLM tokens", () => {
  assert.equal(estimateTokens(""), 0);
  assert.equal(estimateTokens("test"), 1);
  const text100 = "a".repeat(100);
  assert.equal(estimateTokens(text100), 25);
});

test("runSideBySideTurn executes wire and legacy shadow cycles with probe interception", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lavish-bench-unit-"));
  const stateDir = path.join(dir, "state");
  const dataDir = path.join(dir, "bench-data");
  await mkdir(stateDir);
  await mkdir(dataDir);

  const wireFile = path.join(dir, "wire.html");
  const shadowFile = path.join(dir, "shadow.html");
  const html = "<!doctype html><html><body>Test</body></html>";
  await writeFile(wireFile, html, "utf8");
  await writeFile(shadowFile, html, "utf8");

  const server = await serve({
    port: 0,
    host: "127.0.0.1",
    stateFile: path.join(stateDir, "state.json"),
    version: VERSION,
  });

  const baseUrl = `http://127.0.0.1:${server.port}`;

  try {
    const wireRes = await fetch(`${baseUrl}/api/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ file: wireFile, noGate: true }),
    }).then((r) => r.json());

    const shadowRes = await fetch(`${baseUrl}/api/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ file: shadowFile, noGate: true }),
    }).then((r) => r.json());

    const measurement = await runSideBySideTurn({
      baseUrl,
      wireKey: wireRes.key,
      wireFile,
      shadowKey: shadowRes.key,
      shadowFile,
      promptText: "Please make the primary button green",
      replyText: "Changed primary button color to green",
      modelTurnMs: 30,
      round: 1,
      dataDir,
    });

    assert.ok(measurement);
    assert.equal(measurement.round, 1);

    // Verify wire metrics
    assert.ok(measurement.wire.rawTransportMs > 0);
    assert.ok(measurement.wire.totalTurnMs >= measurement.wire.modelTurnMs);
    assert.ok(measurement.wire.estTokens > 0);

    // Verify legacy metrics
    assert.ok(measurement.legacy.rawTransportMs > 0);
    assert.ok(measurement.legacy.totalTurnMs >= measurement.legacy.modelTurnMs);
    assert.equal(measurement.legacy.probeIntercepted, true);
    assert.ok(measurement.legacy.instructionBlockTokens > 0);

    // Legacy turn borrowed wire model turn time
    assert.equal(measurement.legacy.modelTurnMs, measurement.wire.modelTurnMs);

    // Verify measurements recorded to disk
    const jsonlContent = await readFile(path.join(dataDir, "benchmark-measurements.jsonl"), "utf8");
    assert.ok(jsonlContent.includes('"round":1'));

    const txtContent = await readFile(path.join(dataDir, "benchmark.txt"), "utf8");
    assert.ok(txtContent.includes("# Wire-AXI vs Legacy HTTP Polling Benchmark"));
    assert.ok(txtContent.includes("Executive Summary"));
  } finally {
    await server.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("renderBenchmarkReport generates clean Markdown summary", () => {
  const sampleRecords = [
    {
      round: 1,
      wire: { rawTransportMs: 10, modelTurnMs: 40, totalTurnMs: 50, outputBytes: 300, estTokens: 75 },
      legacy: { pollMs: 15, replyMs: 15, rearmMs: 20, totalTurnMs: 90, outputBytes: 2000, estTokens: 500 },
    },
  ];

  const report = renderBenchmarkReport(sampleRecords);
  assert.ok(report.includes("Executive Summary"));
  assert.ok(report.includes("Wire-AXI Atomic Single-Turn Wait"));
  assert.ok(report.includes("Legacy HTTP Long-Polling Turn"));
});
