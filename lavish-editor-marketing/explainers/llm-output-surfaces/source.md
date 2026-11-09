# Source excerpt

Quoted verbatim from `data/llm-output-surfaces-audit/report.md` in the scout home
(LLM Output Surfaces Audit, 2026-11-05), trimmed to the lines this explainer narrates.
Every beat in `beats.json` names an anchor in this file, so the timeline can be
checked without opening the original report.

## executive-summary

> However, passive understanding surfaces - scout reports (`data/<id>/report.md`), pull request descriptions, `/bearings` default chat output, and complex architectural explanations - still default to unconstrained Markdown prose.

## capabilities

> Notably, `lavish-axi` already ships two under-connected capabilities:
>
> 1. `src/export-bundle.js:35-41, 67` already bundles `<audio>`, `<video>`, `<source>`, and `<track>` (`.mp4`, `.webm`, `.mp3`, `.wav`, `.m4a`, `.vtt`) into self-contained HTML exports up to 25 MB, even though no `lavish-axi` playbook guides agents to emit narrated or animated explainers.
> 2. `lavish-editor-marketing/` already contains a working `hyperframes@0.5.7` HTML+GSAP composition pipeline (`lavish-editor-marketing/index.html`, `lavish-editor-marketing/AGENTS.md:19`) that renders deterministic 60fps HTML timelines to MP4 and pairs with `hyperframes-media` (local Kokoro TTS and Whisper word-level timestamps).

## missing-playbook

> No playbook in `lavish-axi/src/playbooks.js` or skill in `architect/.agents/skills/` exposes animated or narrated explainers to agents.

> Agents do not know that a 3b1b-style explainer can be served immediately in `lavish-axi` as an interactive GSAP+SVG+`<audio>`+`<track>` HTML artifact (without waiting on MP4 encoding) and optionally rendered to `.mp4` via `hyperframes`.

## recommendation

> **Browser-Native 3b1b-Style Narrated Explainers** (`lavish-axi/src/playbooks.js` + a new opt-in `architect/.agents/skills/video-explainer/SKILL.md`): Treat a 3b1b-style explainer first as a deterministic HTML + inline SVG + GSAP timeline synchronized with local `<audio>` + `<track kind="captions">` (`.vtt`) inside `lavish-axi` (instant 60fps playback, zero MP4 encode wait, full element annotation), with opt-in `npx hyperframes render` for MP4 export and `kokoro-onnx` / `piper-tts` (local/free) or ElevenLabs (cloud) for narration.
