import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { findPlaybook } from "../src/playbooks.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const exampleDir = fileURLToPath(
  new URL("../lavish-editor-marketing/explainers/llm-output-surfaces/", import.meta.url),
);
const narrateScript = fileURLToPath(
  new URL("../lavish-editor-marketing/explainers/scripts/narrate.mjs", import.meta.url),
);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

test("the explainer playbook covers beats, narration timing, and reproducibility", () => {
  const playbook = findPlaybook("explainer");

  assert.ok(playbook, "explainer playbook exists");
  assert.match(playbook.use_when, /report/);
  assert.match(playbook.use_when, /incident/);
  assert.match(playbook.use_when, /decision/);
  assert.match(playbook.use_when, /outcome/);
  assert.match(playbook.use_when, /narrated timeline/);

  const beats = playbook.structure.join(" ");
  assert.match(beats, /every beat one claim/i);
  assert.match(beats, /cause and consequence/i);

  // The narration-to-timeline mapping is a rule, not a suggestion: an unmeasured offset
  // is the failure this playbook exists to prevent.
  const rules = playbook.design_rules.join(" ");
  assert.match(rules, /measure that file/i);
  assert.match(rules, /never write an offset you did not measure/i);
  assert.match(rules, /data-start/);
  assert.match(rules, /id="beat-<id>"/);

  const workflow = playbook.workflow.join(" ");
  assert.match(workflow, /source\.md/);
  assert.match(workflow, /beats\.json/);
  assert.match(workflow, /narrate\.mjs/);
  assert.match(workflow, /hyperframes@0\.5\.7 tts/);
  assert.match(workflow, /hyperframes@0\.5\.7 render/);
  assert.match(workflow, /--check/);

  // One renderer, no new control plane: the only mention of a second renderer forbids one.
  const everything = JSON.stringify(playbook);
  assert.equal((everything.match(/second renderer/g) || []).length, 1);
  assert.match(playbook.pitfalls.join(" "), /Do not add a queue, a daemon, a second renderer/);
});

test("the worked explainer example is reproducible from its own beats file", () => {
  const beats = readJson(`${exampleDir}beats.json`);
  const narration = readJson(`${exampleDir}narration.json`);
  const source = readFileSync(`${exampleDir}source.md`, "utf8");

  assert.ok(existsSync(`${exampleDir}renders/llm-output-surfaces.mp4`), "the rendered MP4 is committed");
  assert.ok(beats.beats.length >= 4 && beats.beats.length <= 8, "the example stays small enough to review");

  for (const beat of beats.beats) {
    const anchor = /^source\.md#(.+)$/.exec(beat.source_ref);
    if (anchor) {
      assert.match(source, new RegExp(`^## ${anchor[1]}$`, "m"), `${beat.id} cites ${beat.source_ref}`);
      assert.ok(beat.narration.length > 0, `${beat.id} has narration text`);
    } else {
      // A mechanism claim may cite the file that proves it instead of the source document.
      const cited = [exampleDir, repoRoot].map((base) => `${base}${beat.source_ref}`);
      assert.ok(cited.some(existsSync), `${beat.id} cites an existing ${beat.source_ref}`);
    }
  }

  assert.equal(narration.beats.length, beats.beats.length);
});

test("committed narration audio, timings, and scenes still agree", () => {
  const output = execFileSync(process.execPath, [narrateScript, exampleDir, "--check"], {
    encoding: "utf8",
    cwd: repoRoot,
  });

  assert.match(output, /narration check passed/);
});
