export const PLAYBOOK_ROUTER_INSTRUCTION =
  "MUST open each matching playbook before writing HTML. Match against the use_when trigger; one artifact often combines several playbooks.";

export const PLAYBOOK_ROUTER_HELP =
  "One artifact often combines several playbooks (for example a plan that includes a comparison and a diagram), so MUST open each matching playbook before writing HTML.";

export const PLAYBOOKS = [
  {
    id: "diagram",
    use_when: "Explain relationships, flows, state, architecture, and concepts with illustrations",
    choose: [
      "Default to hand-authored inline SVG: it gives proportion, emphasis, spatial metaphor, and annotation-ready structure that generated layouts cannot.",
      "Use Mermaid only when the user asks for an editable whiteboard: rendered Mermaid in a `.mermaid` container becomes an Excalidraw whiteboard in the Lavish browser.",
      "For large systems, draw a small overview illustration and put detail in module cards below it, instead of one dense auto-laid graph.",
    ],
    structure: [
      "Assume the reader knows nothing about the system or concept: explain from zero; do not presume prior familiarity.",
      "Prefer one concept per diagram: a sequence of simple single-concept illustrations over one dense figure that combines several; layer understanding step by step.",
      "Lead with the question the diagram answers, not with the implementation detail that produced it.",
      "Keep the first visual to the core relationship, then put dense evidence or file references below it.",
      "For complex systems, separate topology from detail so the overview stays readable.",
    ],
    design_rules: [
      "Size with viewBox plus width:100%; never fixed pixel dimensions, and keep every element inside the viewBox.",
      "Color through currentColor and the page's CSS custom properties so figures follow the artifact's light and dark themes.",
      "Give every meaningful node, edge, and region a stable id and a <title> so reviewers can annotate precisely.",
      "Keep labels to a few words and put prose beside the figure in HTML - SVG text does not wrap, so short labels are also the overflow discipline.",
      "Keep figures self-contained: no external images, fonts, or scripts, so exports render offline.",
      "Render-verify before serving: screenshot the artifact in light, dark, and a narrow viewport - the layout audit deliberately skips SVG interiors.",
      "When the user asked for a whiteboard, initialize Mermaid theme-aware with the `lavish-axi design` snippet rather than hardcoding one theme; to show flowchart nodes as icons from the user's Excalidraw libraries, follow `whiteboard_tooling.library_icons` there.",
    ],
    pitfalls: [
      "Do not cram every file or function into one figure when a layered explanation would be clearer.",
      "Do not hand-build boxes-and-arrows from div/flexbox: inline SVG owns figures, HTML owns the prose around them.",
      "Do not reach for Mermaid to save authoring effort - it surrenders position, size, and emphasis to the engine.",
      "Do not present unverified architecture claims as facts. Cite the files or commands that support them.",
    ],
    lavish_notes: [
      "A Lavish diagram should invite precise annotation: make modules, edges, and captions easy to click and discuss.",
      "When a relationship is uncertain, label it as a question so the user can resolve it in the review loop.",
    ],
  },
  {
    id: "table",
    use_when: "Turn dense records into scan-friendly review surfaces",
    choose: [
      "Use a table when rows share the same fields and the user needs to compare evidence quickly.",
      "Use cards when each record has a different shape or needs a long explanation.",
      "Use summaries above the table when counts, risk levels, or statuses change how the table should be read.",
    ],
    structure: [
      "Start with a short summary of what the rows prove or require.",
      "Group columns by the decision they support: identity, evidence, status, action.",
      "Keep raw details available, but make the primary status visible without reading every cell.",
    ],
    design_rules: [
      "Use semantic table markup when the data is tabular.",
      "Protect long paths, code symbols, URLs, and prose from overflowing on narrow screens.",
      "Use restrained color for status and severity so the table remains readable when printed or skimmed.",
    ],
    pitfalls: [
      "Do not paste a terminal table into HTML and call it done.",
      "Do not hide the important conclusion below a large undifferentiated grid.",
      "Do not use color as the only status signal.",
    ],
    lavish_notes: [
      "A Lavish table should make individual rows easy annotation targets.",
      "If a row implies a follow-up change, include an action control that queues a specific prompt.",
      "When one action covers multiple rows and completeness matters, also follow the input playbook's tracked batch pattern so the reviewer submits one explicit ID set for item-by-item accounting.",
    ],
  },
  {
    id: "comparison",
    use_when: "Show options, tradeoffs, and current vs target behavior",
    choose: [
      "Use before and after when the same system is changing over time.",
      "Use option cards when the user needs to choose between mutually exclusive directions.",
      "Use a scorecard only when the criteria are explicit and comparable.",
    ],
    structure: [
      "Name the decision at the top of the artifact.",
      "Show the concrete behavior or artifact shape for each side, not just abstract pros and cons.",
      "End with a recommendation only when the evidence actually supports one.",
    ],
    design_rules: [
      "Keep corresponding details aligned so differences are visible without hunting.",
      "Use visual hierarchy to separate primary tradeoffs from secondary notes.",
      "Make the cost of each option as visible as the benefit.",
    ],
    pitfalls: [
      "Do not make every option look equally recommended if one is clearly preferred.",
      "Do not compare vague summaries when concrete examples are available.",
      "Do not bury assumptions that would change the recommendation.",
    ],
    lavish_notes: [
      "A Lavish comparison should let the user annotate the exact option or tradeoff they want changed.",
      "If the goal is selection, provide controls that queue the chosen option with rationale.",
    ],
  },
  {
    id: "plan",
    use_when: "Explain a product or technical plan before implementation",
    choose: [
      "Use this when the user needs to inspect a feature approach before implementation begins.",
      "Use it when the user explicitly asked for a PRD, technical design, implementation plan or proposal.",
      "Use a lighter comparison or diagram playbook when the plan is only a single small design choice.",
    ],
    structure: [
      "Start with the goal, the current state, and desired behavior.",
      "Then describe a proposed approach, focusing on high level decisions.",
      "At the end, list any risks you see, and open questions you have, and follow the 'comparison' playbook to provide options for the user to choose from.",
    ],
    design_rules: [
      "Verify each claim against the codebase before presenting it as fact.",
      "When discussing frontend experiences, prefer visually mocking the experience under a consistent design system as the real product over describing it with text.",
      "The plan needs to be self-contained enough that another developer can read it and fully implement the proposal.",
    ],
    pitfalls: [
      "Do not leave resolved open questions in the artifact. Update existing content to reflect the decision and remove the open question.",
      "Do not only focus on ambiguous decisions and omit the actual proposal.",
      "Do not omit failure modes, migration concerns, or backwards compatibility questions.",
    ],
    lavish_notes: ["A Lavish plan should make a plan and its uncertainties easy to annotate before code exists."],
  },
  {
    id: "code",
    use_when: "Render source code, code files, patches, PR diffs, and before/after code inside Lavish artifacts",
    choose: [
      "Use this whenever an artifact shows source code: a snippet, full file, patch, PR diff, local change set, or before/after code.",
      "Use File for one code file, FileDiff for old/new versions or parsed patch metadata, and CodeView only when several files or diffs need coordinated navigation.",
      "Choose split layout for careful side-by-side review when width allows; choose unified layout when space is tight, changes are mostly additive, or mobile readability matters.",
    ],
    structure: [
      "Place the path, language, and reason to inspect the code immediately before each rendered file or diff.",
      "Keep evidence close to each claim with file paths, line references, or annotations next to the relevant code.",
      "For multi-file changes, group files by user-facing area or task instead of dumping a raw patch in repository order.",
    ],
    design_rules: [
      `Rendering MUST use @pierre/diffs, not hand-rolled <pre> blocks or another diff library. This verified no-build standalone HTML snippet renders one file and one split diff from esm.sh:
\`\`\`html
<div id="file"></div>
<div id="diff"></div>
<script type="module">
  import { File, FileDiff } from "https://esm.sh/@pierre/diffs@1.2.10?bundle";

  const theme = { light: "github-light", dark: "github-dark" };
  const options = { theme, themeType: "dark", overflow: "wrap" };
  const oldFile = {
    name: "src/greeting.ts",
    contents: "export function greet(name: string) {\\n  return \\"Hello \\" + name;\\n}\\n\\nconsole.log(greet(\\"Lavish\\"));\\n",
  };
  const newFile = {
    name: "src/greeting.ts",
    contents: "export function greet(name: string) {\\n  return \\"Hello, \\" + name + \\"!\\";\\n}\\n\\nconsole.log(greet(\\"Lavish\\"));\\n",
  };

  new File(options).render({
    containerWrapper: document.querySelector("#file"),
    file: newFile,
  });

  new FileDiff({ ...options, diffStyle: "split" }).render({
    containerWrapper: document.querySelector("#diff"),
    oldFile,
    newFile,
  });

</script>
\`\`\``,
      "Pick a Shiki theme pair that matches the artifact's DaisyUI or Tailwind direction and light or dark mode; replace the GitHub pair above when the page is not GitHub-like.",
      'Use FileDiff diffStyle: "split" for side-by-side review and diffStyle: "unified" for stacked reading; keep overflow: "wrap" unless horizontal alignment is essential.',
      "Use @pierre/diffs line annotations, selections, and headers when calling out specific lines so notes stay attached to code.",
    ],
    pitfalls: [
      "Do not render code as static screenshots, plain <pre> blocks, or markdown pasted into HTML.",
      "Do not choose an arbitrary default Shiki theme that clashes with the page palette or dark mode.",
      "Do not show huge unrelated files when a focused render range, parsed patch file, or grouped summary would be clearer.",
      "Do not separate a claim from the code lines that prove it.",
    ],
    lavish_notes: [
      "A Lavish code artifact should make each file, hunk, and relevant line easy to annotate precisely.",
      "When a user action should trigger a fix, queue prompts that name the file path, line range, and desired change.",
      "If the artifact combines code with a plan, table, or comparison, read those playbooks too and keep @pierre/diffs responsible for the code surface.",
    ],
  },
  {
    id: "input",
    use_when:
      "Must be used when the agent needs to collect user input on decisions, choices, preferences, triage, scope, or other structured feedback from within the artifact",
    choose: [
      "Use this when the user needs to select, tune, triage, annotate, or edit a structured choice.",
      "Use controls for decisions the user can make faster visually than by writing a prompt.",
      "Use an opt-in tracked batch when the agent must preserve completeness across a multi-item decision, such as findings to fixes, constraints to implementation, or recommendations to follow-up work.",
      "Use plain annotations when the artifact only needs open-ended feedback.",
    ],
    structure: [
      "Make each decision surface visible: what is being chosen, what the options mean, and what happens next.",
      "For a tracked batch, give every candidate item a short, stable, visible ID and let the reviewer select or disposition items with editable native controls.",
      "Keep reversible selection state local in the artifact until the user explicitly submits that question.",
      "Pair each question with a Submit or Queue answer control that sends exactly one prompt for the final answer.",
      "Show selected state separately from queued state so the user trusts what will be sent back.",
    ],
    design_rules: [
      'Set data-lavish-annotate="off" on <html> for decision, choice, and form-shaped pages; leave annotation on (the default, or "on") when reviewing a frontend or layout. Unknown values default to on. The toolbar can override the page default and keeps the reviewer\'s choice across artifact reloads.',
      "Native controls - radios, checkboxes, text inputs, selects, textareas, buttons, options, labels, disclosure summaries, and contenteditable regions - and custom widgets with an interactive ARIA role (button, checkbox, combobox, menuitem, option, radio, switch, tab, treeitem, and the menuitem variants) are interactive automatically: clicks toggle, focus, and type instead of annotating, so they do not need data-lavish-action. An <a href> stays annotatable when it carries one of these roles or sits inside such a widget. Build choice and option UIs from these whenever you can.",
      "For reversible choices, do not call window.lavish.queuePrompt() from radio change handlers or option click handlers. Those handlers should only update local selected state.",
      "Use a per-question form submit or explicit Queue answer button to read the current values and call window.lavish.queuePrompt() exactly once for the final answer.",
      "Put data-lavish-action only on custom (non-native) elements that should act like a feedback control - typically a styled div or span you made clickable - so Lavish does not annotate it and shows a pointer cursor instead.",
      "Use data-lavish-question on a question wrapper or pass queueKey when multiple pre-send updates should replace the prior unsent answer for the same question.",
      "Pass options such as tag, text, selector, target, data, queueKey, or element when they help the agent understand exactly what the user chose.",
      "For a tracked batch, queue the final selected set once in a concise, bounded data.items array; include each item's stable ID, concise label, and requested disposition, and explicitly tell the agent to account for every submitted ID before reporting completion.",
      "Call window.lavish.sendQueuedPrompts() only when the control should immediately send committed feedback instead of waiting for the user to press Send to Agent.",
      "Make queued prompts specific enough that the agent can act without asking a follow-up question.",
      "Keep native browser controls accessible and readable on mobile.",
    ],
    pitfalls: [
      "Do not queue one prompt per radio change, checkbox toggle, dropdown change, or choice-button click when the user can still change their mind.",
      "Do not create controls whose queued prompt is unclear or too vague to execute.",
      "Do not hide the difference between selected locally and queued for the agent.",
      "Do not require interaction for content the user only needs to read.",
    ],
    lavish_notes: [
      "Lavish is strongest when the artifact becomes a focused review surface and not just a static page.",
      'A native single-choice question should submit the final value: `<form data-lavish-question="plan" onsubmit="event.preventDefault(); const choice = new FormData(event.currentTarget).get(\'plan\'); if (choice) window.lavish.queuePrompt(\'Use the \' + choice + \' plan\', { tag: \'choice\', text: \'Plan: \' + choice, element: event.currentTarget, data: { question: \'plan\', answer: choice } });"><label><input type="radio" name="plan" value="Starter"> Starter</label><label><input type="radio" name="plan" value="Pro"> Pro</label><button type="submit">Queue this answer</button></form>`.',
      `A tracked batch should submit the final selected set once: <form data-lavish-question="tracked-review" onsubmit="event.preventDefault(); const selected = [...event.currentTarget.querySelectorAll('input[name=items]:checked')].map((input) => ({ id: input.value, label: input.dataset.label, disposition: input.dataset.disposition })); if (selected.length) window.lavish.queuePrompt('Act on every selected item and return an item-by-item receipt. Account for every submitted ID before reporting completion.', { tag: 'tracked-batch', text: 'Apply ' + selected.length + ' selected review items', element: event.currentTarget, data: { items: selected } });"><label><input type="checkbox" name="items" value="R-03" data-label="Preserve rollback behavior" data-disposition="must-address"> R-03 — Preserve rollback behavior</label><label><input type="checkbox" name="items" value="R-08" data-label="Reuse the existing error surface" data-disposition="must-address"> R-08 — Reuse the existing error surface</label><button type="submit">Queue selected items</button></form>`,
      `For a decision artifact a human may open by double-clicking the HTML, optionally include this standalone answer-copy control: it copies every question's answers as text the human pastes back into the chat for the agent to read. It works without Lavish and remains absent unless you write it into the artifact:
\`\`\`html
<div>
  <button type="button" onclick="(async (btn) => {
    const copyRun = btn._lavishCopyRun = (btn._lavishCopyRun || 0) + 1;
    const qs = [...document.querySelectorAll('[data-lavish-question]')];
    const status = btn.parentElement.querySelector('[data-lavish-copy-all-status]');
    btn.parentElement.querySelector('[data-lavish-copy-all-manual]')?.remove();
    const out = [];
    for (const q of qs) {
      const key = q.getAttribute('data-lavish-question')?.trim() || 'Question';
      const lines = [];
      for (const el of q.querySelectorAll('input, select, textarea')) {
        if (el.matches(':disabled')) continue;
        if (el.closest('[data-lavish-question]') !== q) continue;
        const isChoice = el.matches('input[type=checkbox], input[type=radio]');
        if (isChoice && !el.checked) continue;
        if (el.matches('input[type=button], input[type=submit], input[type=reset], input[type=image], input[type=hidden], input[type=file], input[type=range], input[type=color]')) continue;
        let vals;
        if (el instanceof HTMLSelectElement) {
          vals = [...el.selectedOptions].filter((o) => !o.disabled && !o.closest('optgroup[disabled]')).map((o) => o.value.trim()).filter(Boolean);
        } else {
          const v = isChoice && (!el.hasAttribute('value') || !el.value.trim())
            ? el.labels?.[0]?.textContent?.trim() || el.getAttribute('aria-label')?.trim() || el.name || ''
            : el.value.trim();
          vals = v ? [v] : [];
        }
        const label = el.name || el.labels?.[0]?.textContent?.trim() || el.getAttribute('aria-label')?.trim() || el.getAttribute('placeholder')?.trim() || el.tagName.toLowerCase();
        for (const v of vals) lines.push('  ' + label + ': ' + v.split('\\n').join('\\n    '));
      }
      if (lines.length) out.push(key + ':\\n' + lines.join('\\n'));
    }
    const text = out.join('\\n\\n');
    if (!text) {
      status.textContent = qs.length ? 'No answers to copy yet.' : 'No questions or answers to copy.';
      return;
    }
    status.textContent = '';
    try {
      if (typeof navigator.clipboard?.writeText !== 'function') throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
      if (copyRun !== btn._lavishCopyRun) return;
      status.textContent = 'Answers copied.';
      return;
    } catch {}
    if (copyRun !== btn._lavishCopyRun) return;
    const tmp = document.createElement('textarea');
    tmp.value = text;
    tmp.readOnly = true;
    tmp.setAttribute('aria-hidden', 'true');
    tmp.style.position = 'fixed';
    tmp.style.left = '-10000px';
    document.body.append(tmp);
    tmp.focus();
    tmp.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {}
    tmp.remove();
    if (ok) {
      status.textContent = 'Answers copied.';
      return;
    }
    btn.parentElement.querySelector('[data-lavish-copy-all-manual]')?.remove();
    const man = document.createElement('textarea');
    man.value = text;
    man.readOnly = true;
    man.rows = Math.min(12, Math.max(3, text.split('\\n').length));
    man.setAttribute('aria-label', 'Answers to copy manually');
    man.dataset.lavishCopyAllManual = '';
    btn.insertAdjacentElement('afterend', man);
    man.focus();
    man.select();
    status.textContent = 'Clipboard unavailable. Copy the answers below manually.';
  })(this)">Copy all answers</button>
  <span data-lavish-copy-all-status role="status" aria-live="polite"></span>
</div>
\`\`\``,
      "The agent's tracked-batch completion receipt must give every submitted ID exactly one outcome: addressed with concrete evidence, deferred with a reason, or rejected with a reason. Evidence may cover several IDs. Before declaring completion, compare the submitted ID set with the receipt ID set and surface every missing ID.",
      "A custom choice UI should make option buttons update local state, then use a separate Queue answer button with data-lavish-action to queue the final selected value.",
      "Use window.lavish.queuePrompt for user intent, not internal analytics or UI-only state changes.",
      "End input paths with an obvious way for the user to send feedback back to the agent.",
    ],
  },
  {
    id: "explanation",
    use_when:
      "Explain an existing system, PR, incident, or decision to a reader who was not there - when the goal is understanding what is and why, not choosing a direction or inspecting a plan before implementation",
    choose: [
      "Use this when the reader needs to understand something that already exists: a PR's mechanism, an incident's root cause, an architecture, a past decision.",
      "Use the plan playbook when the reader must inspect and approve an approach before implementation begins; use comparison when they must choose between options.",
      "Combine with diagram for flows or architecture, table for evidence inventories, and code when the mechanism lives in specific lines.",
    ],
    structure: [
      "Lead with the one-sentence answer to the question the reader actually has, before any mechanism.",
      "Then show only what changed or how it works - a flow or before/after of the relevant slice, not a diagram of the whole system.",
      "Keep evidence (file paths, line references, links, commands) subordinate to the narrative: cited where a claim needs support, never inlined wholesale.",
      "Make each claim its own section or annotation target so the reader can push back on exactly the part they disagree with.",
      "End with what was deliberately left out and where to look next, not a summary that restates the piece.",
    ],
    design_rules: [
      "Define unfamiliar terms at first use; for the reader's starting point, follow the diagram playbook's assume-nothing rule rather than restating it here.",
      "Name the question the explanation answers at the top, so the reader knows whether it is their question.",
      "Put prose beside figures - inline SVG for the flow or before/after, HTML for the reasoning - per the diagram playbook.",
      "Link evidence rather than pasting logs or diffs; inlined evidence buries the narrative and goes stale.",
      "Distinguish verified claims (cited to files, commands, or links) from inference; label uncertain reasoning as a question.",
    ],
    pitfalls: [
      "Do not restate the PR body, diff, or ticket file-by-file; the source documents already exist and the reader can open them.",
      "Do not bury the answer under a diagram of the entire system when the question is about one slice of it.",
      "Do not present inferred reasoning as verified fact; cite or label it.",
    ],
    lavish_notes: [
      "A Lavish explanation should let the reader annotate the exact claim they doubt or want expanded.",
      "When an explanation surfaces a disagreement, queue prompts that name the claim and the evidence gap.",
    ],
  },
  {
    // The only playbook whose deliverable is a rendered file, so it is the only one that
    // owns an ordered workflow: the recipe is the instruction an agent needs here.
    id: "explainer",
    use_when:
      "Turn a report, an incident, a decision, or an outcome into a narrated timeline that a reader watches instead of reading",
    choose: [
      "Use it when order and cause are the point: an incident's failure chain, a report's ranked findings, a decision's trade-offs, or an outcome's route from cause to result.",
      "Use the explanation playbook instead when the reader must scan, revisit, and annotate claims; a narrated timeline is one fixed pass in time, not a reference page.",
      "Use slides when a person presents live; an explainer must stand alone with its own narration.",
      "Put the rendered MP4 inside a Lavish artifact when the reader should discuss it afterwards: `export` already inlines a local MP4 under its size cap, so the video travels with the page around it.",
    ],
    structure: [
      "Open with the answer, not with background: the first beat states the claim the rest of the timeline supports.",
      "Give every beat one claim and one visual that shows it; two claims in one beat means two beats.",
      "Order beats by cause and consequence, not by the source document's section order: setup, turning point, effect, what follows.",
      "Keep one beat for the tension that makes the rest necessary - the gap, the failing assumption, the cost of leaving it.",
      "Close with the reader's next action and where the source lives, instead of a summary that repeats the timeline.",
      "Six to eight beats is the usable range; past ten, cut a beat rather than speed the voice up.",
    ],
    design_rules: [
      "One beats file is the only timing input: it holds the spoken text and a source reference per beat, and nothing else is hand-tuned per render.",
      "Narration decides the clock. Synthesize a beat's audio first, measure that file, and start the next beat after it ends; never write an offset you did not measure.",
      "Point visual timing at the audio, not at the animation: the visual for a beat starts where that beat's narration starts, so editing a sentence moves the picture.",
      "Cite inside the frame: each beat shows the source path and anchor it speaks for, so a viewer can check a claim without asking.",
      "Copy the quoted lines into a small `source.md` beside the composition and give each beat an anchor in it, so the explainer is checkable from its own folder alone.",
      'Author one scene per beat and name it `id="beat-<id>"`, then build the paused GSAP timeline from the measured per-beat offsets instead of typed numbers.',
      "Give every `<audio>` element an `id`, `src`, `data-start`, and `data-duration`: the renderer discovers the track by id and silently drops audio without one.",
      "Keep the composition deterministic: pin the GSAP version and the voice, and use no `Date.now()`, no `Math.random()`, and no runtime fetch.",
      "Fail a check when committed timings and committed audio disagree, so a half-finished rebuild cannot ship.",
      "Watch the rendered MP4 before delivering it; nothing else in this pipeline looks at the picture.",
    ],
    workflow: [
      "1. Copy the lines you will narrate from the source document into `<explainer>/source.md` verbatim, one `##` anchor per claim, with the original path recorded at the top.",
      "2. Write `<explainer>/beats.json`: `voice`, `speed`, and one object per beat with `id`, `narration` (the spoken sentences), and `source_ref` (an anchor in `source.md`, or the file that proves a mechanism).",
      '3. Narrate every beat with the pinned local voice: `npx hyperframes@0.5.7 tts "<narration>" -o assets/narration/01-<id>.wav -v am_michael`, then `ffprobe -v error -show_entries format=duration -of csv=p=0 assets/narration/01-<id>.wav` for its seconds. Inside this repository `node lavish-editor-marketing/explainers/scripts/narrate.mjs <explainer>` runs that loop, writes `narration.json`, and rewrites the timing block in `index.html`; outside a checkout, keep the measured seconds in your beats file and write the `<audio>` elements yourself.',
      '4. Write `index.html` as a HyperFrames composition: one `<section class="beat" id="beat-<id>">` per beat, one `<audio id="narration-<id>" src=... data-start="<measured start>" data-duration="<measured seconds>">` per beat, and a paused GSAP timeline on `window.__timelines` whose per-beat offsets come from those measurements, never from typed numbers.',
      "5. Check, then render with `npx hyperframes@0.5.7 lint` and `npx hyperframes@0.5.7 render <explainer> -o renders/<slug>.mp4`, and require the compiled `audioCount` to equal the beat count. Inside this repository `narrate.mjs <explainer> --check` also fails when the committed timings no longer match the committed audio.",
      "6. Re-run step 3 whenever a sentence or the voice changes: both the timings and the MP4 follow `beats.json`, and the MP4 is rendered again only when the explainer changes.",
    ],
    pitfalls: [
      "Do not invent a claim the source does not make. A narrated claim sounds more confident than the same sentence buried in a report.",
      "Do not narrate the document's structure; narrate the subject.",
      "Do not add a queue, a daemon, a second renderer, or a hosted service. The local HTML timeline plus local text to speech is the whole pipeline.",
      "Do not hand-edit the generated timing block or keep narration audio the beats file no longer produces; re-run the narration step instead.",
      "Do not reach for a controlled-language standard such as ASD-STE100. Write plain technical English for a developer.",
      "Do not let the example grow: six beats that run end to end prove the recipe, and a full production piece does not review.",
    ],
    lavish_notes: [
      "The worked example is `lavish-editor-marketing/explainers/llm-output-surfaces`: a scout report that audits this repository, six beats, one rendered MP4, rebuilt with the commands above.",
      "A rendered MP4 reviews well inside a Lavish artifact: a reviewer annotates the beat they doubt, and the prompt comes back with a timestamp.",
      "A machine with a global libvips installed fails the sharp install behind `npx hyperframes`. Prefix the hyperframes command with `SHARP_IGNORE_GLOBAL_LIBVIPS=1`.",
    ],
  },
  {
    id: "slides",
    use_when: "Create a deliberate presentation when slides are requested",
    choose: [
      "Use slides only when the user asks for a deck, presentation, talk, or paced walkthrough.",
      "Use a scroll page when the user needs reference material, detailed review, or dense evidence.",
      "Use one idea per slide when the artifact has a narrative arc.",
    ],
    structure: [
      "Plan the story before writing the slide markup.",
      "Open with the point, build context, show evidence, and close with the decision or next action.",
      "Vary slide composition so the deck does not feel like repeated cards.",
    ],
    design_rules: [
      "Keep slide text sparse and let visuals carry the explanation.",
      "Use large type, strong alignment, and deliberate whitespace rather than dense paragraphs.",
      "Make navigation and screen-size assumptions explicit in the artifact.",
    ],
    pitfalls: [
      "Do not turn every explainer into slides by default.",
      "Do not paste a scroll-page outline into fixed-size frames without rewriting the narrative.",
      "Do not make consecutive slides with the same spatial composition unless repetition is the point.",
    ],
    lavish_notes: [
      "A Lavish slide deck can still collect feedback, but each prompt should refer to a slide or decision.",
      "Use slides for persuasion or presentation, not for dense code review.",
    ],
  },
];

export function listPlaybooks() {
  return PLAYBOOKS.map(({ id, use_when }) => ({ id, use_when }));
}

export function findPlaybook(id) {
  return PLAYBOOKS.find((playbook) => playbook.id === id) || null;
}

export function playbookIds() {
  return PLAYBOOKS.map((playbook) => playbook.id);
}
