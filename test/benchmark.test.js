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
  isBenchmarkEnabled,
  isComparativeModeEnabled,
  recordTurnMetrics,
  renderRealUsageReport,
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
  assert.ok(report.includes("Wire-AXI Single-Turn Poll"));
  assert.ok(report.includes("Legacy HTTP Long-Polling Turn"));
});

test("isBenchmarkEnabled and isComparativeModeEnabled detect flags and environment", () => {
  assert.equal(isBenchmarkEnabled([], {}), false);
  assert.equal(isBenchmarkEnabled(["--benchmark"], {}), true);
  assert.equal(isBenchmarkEnabled(["--dual-transport"], {}), true);
  assert.equal(isBenchmarkEnabled([], { LAVISH_AXI_BENCHMARK: "1" }), true);
  assert.equal(isBenchmarkEnabled([], { LAVISH_AXI_DUAL_TRANSPORT: "1" }), true);

  assert.equal(isComparativeModeEnabled([], {}), false);
  assert.equal(isComparativeModeEnabled(["--comparative"], {}), true);
  assert.equal(isComparativeModeEnabled(["--dual-transport"], {}), true);
  assert.equal(isComparativeModeEnabled([], { LAVISH_AXI_DUAL_TRANSPORT: "1" }), true);
  assert.equal(isComparativeModeEnabled(["--benchmark"], {}), true);
  assert.equal(isComparativeModeEnabled(["--benchmark"], { LAVISH_AXI_COMPARATIVE: "0" }), false);
});

test("recordTurnMetrics logs standalone turns to real-usage-benchmark.jsonl", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lavish-turn-metrics-"));
  try {
    const record1 = await recordTurnMetrics({
      file: "/path/to/board.html",
      transport: "wire-axi",
      rawTransportMs: 25.5,
      waitMs: 20.0,
      replyMs: 5.5,
      totalTurnMs: 45.0,
      output: { session: { file: "board.html" }, next_step: "apply changes" },
      prompts: [{ prompt: "Update navigation links to point to new routes" }],
      replyText: "Links updated",
      seq: 1,
      comparative: false,
      dataDir: dir,
    });

    assert.ok(record1);
    assert.equal(record1.turn, 1);
    assert.equal(record1.transport, "wire-axi");
    assert.equal(record1.commandCalls, 1);
    assert.ok(record1.payloadBytes > 0);
    assert.ok(record1.payloadEstTokens > 0);

    const record2 = await recordTurnMetrics({
      file: "/path/to/board.html",
      transport: "poll-fallback",
      rawTransportMs: 65.0,
      waitMs: 50.0,
      replyMs: 15.0,
      totalTurnMs: 70.0,
      output: { session: { file: "board.html" }, next_step: "legacy step" },
      prompts: [{ prompt: "Add border styling to hero section" }],
      replyText: "Border styled",
      seq: 2,
      comparative: false,
      dataDir: dir,
    });

    assert.ok(record2);
    assert.equal(record2.turn, 2);
    assert.equal(record2.transport, "poll-fallback");
    assert.equal(record2.commandCalls, 2);

    const jsonlContent = await readFile(path.join(dir, "real-usage-benchmark.jsonl"), "utf8");
    const lines = jsonlContent.trim().split("\n");
    assert.equal(lines.length, 2);

    const reportContent = await readFile(path.join(dir, "real-usage-benchmark-report.md"), "utf8");
    assert.ok(reportContent.includes("Total Real Turns: 2"));
    assert.ok(reportContent.includes("wire-axi"));
    assert.ok(reportContent.includes("poll-fallback"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("recordTurnMetrics in comparative mode measures legacy shadow cycle alongside wire turn", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lavish-turn-comp-"));
  const stateDir = path.join(dir, "state");
  const dataDir = path.join(dir, "data");
  await mkdir(stateDir);
  await mkdir(dataDir);

  const server = await serve({
    port: 0,
    host: "127.0.0.1",
    stateFile: path.join(stateDir, "state.json"),
    version: VERSION,
  });
  const baseUrl = `http://127.0.0.1:${server.port}`;

  try {
    const record = await recordTurnMetrics({
      file: "/path/to/app.html",
      transport: "wire-axi",
      rawTransportMs: 30.0,
      waitMs: 25.0,
      replyMs: 5.0,
      totalTurnMs: 30.0,
      output: { session: { file: "app.html" }, next_step: "Done" },
      prompts: [{ prompt: "Make header sticky on scroll" }],
      replyText: "Header is now sticky",
      seq: 1,
      comparative: true,
      baseUrl,
      dataDir,
    });

    assert.ok(record);
    assert.ok(record.comparison);
    assert.equal(record.comparison.wire.commandCalls, 1);
    assert.equal(record.comparison.legacy.commandCalls, 3);
    assert.ok(record.comparison.legacy.transportMs > 0);
    assert.ok(record.comparison.legacy.estTokens > record.comparison.wire.estTokens);
    assert.ok(record.comparison.speedup > 0);
    assert.ok(record.comparison.tokenReductionPct > 0);

    // Verify measurements written to both jsonl files and markdown report
    const realJsonl = await readFile(path.join(dataDir, "real-usage-benchmark.jsonl"), "utf8");
    assert.ok(realJsonl.includes('"transport":"wire-axi"'));
    assert.ok(realJsonl.includes('"comparison"'));

    const benchJsonl = await readFile(path.join(dataDir, "benchmark-measurements.jsonl"), "utf8");
    assert.ok(benchJsonl.includes('"round":1'));

    const report = await readFile(path.join(dataDir, "real-usage-benchmark-report.md"), "utf8");
    assert.ok(report.includes("Dual-Transport Comparative Measurements"));
    assert.ok(report.includes("Token Reduction"));
  } finally {
    await server.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("renderRealUsageReport formats empty and populated reports cleanly", () => {
  const emptyReport = renderRealUsageReport([]);
  assert.ok(emptyReport.includes("No turns recorded yet."));

  const populated = renderRealUsageReport([
    {
      turn: 1,
      at: "2026-10-18T22:00:00Z",
      board: "demo",
      transport: "wire-axi",
      latencyMs: 28.5,
      payloadBytes: 400,
      payloadEstTokens: 100,
      commandCalls: 1,
      comparison: {
        wire: { transportMs: 28.5, payloadBytes: 400, estTokens: 100, commandCalls: 1 },
        legacy: { transportMs: 65.0, payloadBytes: 1500, estTokens: 375, commandCalls: 3 },
        speedup: 2.28,
        tokenReductionPct: 73.3,
      },
    },
  ]);

  assert.ok(populated.includes("Executive Summary"));
  assert.ok(populated.includes("2.28x speedup"));
  assert.ok(populated.includes("Reduced from **3 calls**"));
  assert.ok(populated.includes("Dual-Transport Comparative Measurements"));
});
