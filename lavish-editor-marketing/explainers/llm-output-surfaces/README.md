# Worked example: a report as a narrated timeline

The reviewable example for `lavish-axi playbook explainer`. One real artifact from the
scout home - `data/llm-output-surfaces-audit/report.md`, the LLM Output Surfaces Audit -
turned into a 67-second narrated timeline in six beats.

- `source.md` - the quoted lines this explainer narrates, one anchor per claim.
- `beats.json` - the only authored timeline input: one claim and one narration line per beat.
- `narration.json` - generated: measured seconds and start offset for each beat.
- `index.html` - the HyperFrames composition. The block between `<!-- narrate:start -->` and
  `<!-- narrate:end -->` is generated; every scene is hand-authored and named `beat-<id>`.
- `renders/llm-output-surfaces.mp4` - the rendered timeline.

## Rebuild

```sh
npm run narrate   # local Kokoro TTS per beat, measure with ffprobe, rewrite the timing block
npm run check     # timings, audio durations, and scene ids still agree
npm run render    # the same hyperframes pipeline as the marketing video
```

`npm run narrate` is the only step that is not reproducible from the repository alone: it
downloads the Kokoro model once and writes the WAVs. After that, the timings, the
composition, and the render are a function of `beats.json`.

## Environment

Needs `npx hyperframes@0.5.7`, ffmpeg/ffprobe, Chromium, and `pip install kokoro-onnx soundfile`
on the `python3` that comes first on `PATH`, because HyperFrames calls that interpreter for
the local voice. On a machine with a global libvips, sharp fails to install behind
`npx hyperframes`; prefix the commands with `SHARP_IGNORE_GLOBAL_LIBVIPS=1`.

Voice and speed are pinned in `beats.json`, so the same beats produce the same narration and
the same measured timings.
