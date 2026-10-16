#!/usr/bin/env node
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { serve } from "../src/server.js";
import { runSideBySideTurn, getBenchmarkDataDir } from "../src/benchmark.js";
import { VERSION } from "../src/cli.js";

async function main() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lavish-bench-suite-"));
  const stateDir = path.join(dir, "state");
  await mkdir(stateDir);

  const wireFile = path.join(dir, "wire-artifact.html");
  const shadowFile = path.join(dir, "shadow-artifact.html");
  const htmlContent =
    "<!doctype html><html><head><title>Benchmark</title></head><body><h1>Benchmark Target</h1></body></html>";
  await writeFile(wireFile, htmlContent, "utf8");
  await writeFile(shadowFile, htmlContent, "utf8");

  const server = await serve({
    port: 0,
    host: "127.0.0.1",
    stateFile: path.join(stateDir, "state.json"),
    version: VERSION,
  });

  const baseUrl = `http://127.0.0.1:${server.port}`;
  console.log(`[benchmark] Lavish server started on ${baseUrl}`);

  try {
    // Open wire session
    const wireRes = await fetch(`${baseUrl}/api/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ file: wireFile, noGate: true }),
    }).then((r) => r.json());

    // Open shadow session
    const shadowRes = await fetch(`${baseUrl}/api/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ file: shadowFile, noGate: true }),
    }).then((r) => r.json());

    const wireKey = wireRes.key;
    const shadowKey = shadowRes.key;

    const rounds = [
      {
        prompt: "Change hero section background to navy blue and update typography",
        reply: "Updated hero background to navy blue and adjusted heading font sizes",
      },
      {
        prompt: "Add padding to primary call to action button and include hover effect",
        reply: "Applied 12px vertical padding to CTA button with smooth transition",
      },
      {
        prompt: "Ensure mobile viewport renders menu as collapsed hamburger sheet",
        reply: "Configured mobile sheet navigation drawer with smooth slide animation",
      },
      {
        prompt: "Fix contrast ratio on secondary button text to meet WCAG AA standards",
        reply: "Adjusted secondary button text color for WCAG AA compliance",
      },
      {
        prompt: "Add confirmation modal when deleting draft item from project list",
        reply: "Implemented confirmation dialog with cancel and confirm delete buttons",
      },
    ];

    console.log(`[benchmark] Running ${rounds.length} side-by-side transport rounds...`);
    const results = [];

    for (let i = 0; i < rounds.length; i++) {
      const { prompt, reply } = rounds[i];
      const measurement = await runSideBySideTurn({
        baseUrl,
        wireKey,
        wireFile,
        shadowKey,
        shadowFile,
        promptText: prompt,
        replyText: reply,
        modelTurnMs: 40,
        round: i + 1,
        dataDir: getBenchmarkDataDir(),
      });
      results.push(measurement);
      console.log(
        `Round ${i + 1}: wire=${measurement.wire.totalTurnMs}ms (${measurement.wire.estTokens} tok) vs legacy=${measurement.legacy.totalTurnMs}ms (${measurement.legacy.estTokens} tok) -> speedup=${measurement.comparison.speedup}x, probeIntercepted=${measurement.legacy.probeIntercepted}`,
      );
    }

    console.log(`\n[benchmark] Completed successfully! Stored under ${getBenchmarkDataDir()}`);
  } finally {
    await server.close();
    await rm(dir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("[benchmark] Failed:", err);
  process.exit(1);
});
