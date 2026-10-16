import test from "node:test";
import assert from "node:assert/strict";
import { Channel, SessionManager } from "wire-axi";
import { WireChannel, WireFrameError, WireSessionManager } from "../src/wire-adapter.js";

test("WireFrameError inherits from Error and sets name", () => {
  const err = new WireFrameError("malformed frame");
  assert.ok(err instanceof Error);
  assert.equal(err.name, "WireFrameError");
  assert.equal(err.message, "malformed frame");
});

test("WireChannel extends wire-axi Channel", () => {
  const channel = new WireChannel("test-key");
  assert.ok(channel instanceof Channel);
  assert.equal(channel.id, "test-key");
});

test("WireSessionManager extends wire-axi SessionManager", () => {
  const manager = new WireSessionManager();
  assert.ok(manager instanceof SessionManager);
  const channel = manager.getOrCreateChannel("sess-1");
  assert.ok(channel instanceof Channel);
});
