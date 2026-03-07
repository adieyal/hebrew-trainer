# Practice Session Redesign Design

**Date:** 2026-03-07

## Goal

Redesign the `/practice` screen so it feels like a focused writing instrument rather than a dashboard. The new screen should present one prompt, collect one Hebrew answer, show one clear correction, support a deliberate revision pass without mixing states, and turn each detected mistake into future practice material automatically.

## Scope

This redesign applies only to `/practice`. Other routes should keep the existing shell and broader page treatment.

The work also expands the grading pipeline so that LLM-reviewed answers can yield mistake-level remediation objects and auto-saved future practice entries.

## Approved Direction

### Practice-only shell mode

`AppShell` should become route-aware and render a quieter shell for `/practice`:

- compact top bar
- no large marketing-style headline or lede
- subdued primary navigation
- `Practice` visually active

The rest of the application keeps the current shell.

### Single primary session surface

The practice screen should move from several stacked `surface-card` blocks to one centered session surface with internal spacing doing most of the layout work.

The screen structure is:

1. Session header
2. Prompt section
3. Answer section
4. Action row
5. Feedback section
6. Footer session strip

The only framed elements that should remain visually prominent are:

- the answer field
- the comparison block

### Explicit screen states

The UI should clearly represent one state at a time:

- `answering`
- `reviewed`
- `revising`

#### Answering

- editable RTL textarea
- `Skip` and `Check answer`
- no feedback visible

#### Reviewed

- answer locked
- verdict visible
- corrected answer visible
- one-sentence main fix visible
- one block per detected mistake when applicable
- comparison block visible
- explanation collapsed by default
- `Try again` and `Continue`

#### Revising

- prior attempt shown as compact reference
- textarea editable again
- corrected answer remains visible
- `Cancel revision` and `Check revised answer`

## Content and Copy

### Session header

- Overline: `Practice`
- Title: `Focused writing session`
- Metadata: `1 of 5 today`
- Metadata: `Focus: natural phrasing`
- slim progress bar beneath metadata

### Prompt section

- Overline: `Translate to natural Hebrew`
- English prompt is the visual hero

### Answer section

- Label: `Type in Hebrew`
- textarea should start small and feel like sentence composition, not a large essay box
- RTL, right-aligned, large readable Hebrew typography

### Feedback section

Feedback should be reorganized into:

1. verdict
2. corrected answer (`Better phrasing`)
3. key fix (`Main fix`)
4. comparison block (`You wrote` / `Better phrasing`)
5. expandable explanation (`Show why`)

Numeric score display should be removed from the interface.

### Mistake-level remediation

The reviewed state should no longer treat the entire wrong answer as one undifferentiated error. The LLM should identify each specific mistake inside the answer and return one structured analysis per mistake.

Each mistake analysis should include:

- learner fragment
- preferred Hebrew fragment or construction
- issue type
- short learner-facing explanation
- why Hebrew prefers the better construction
- several future practice items

Each future practice item should include:

- English prompt
- primary Hebrew reference
- acceptable Hebrew variants
- focus tokens
- practice roots
- optional register and context

All generated future practice items should be added to the database automatically after grading.

## Visual Direction

The page should feel:

- calm
- precise
- literary
- local and private
- highly intentional

It should use:

- serif for session title and prompt
- sans for metadata, controls, explanations, and navigation
- warm parchment and cream surfaces
- charcoal text
- muted terracotta accent
- restrained semantic tinting only in feedback

The page should rely on spacing and hierarchy rather than nested cards.

## Component Boundaries

Implementation can stay in existing files initially, but the page should be structured into clear sections:

- practice session header
- practice prompt
- practice answer composer
- practice action row
- practice feedback
- practice session footer

Route-specific shell behavior lives in `src/app/AppShell.tsx`.
Practice-specific interaction and rendering live in `src/features/practice/pages/PracticePage.tsx`.
Practice-specific visual styles live in `src/styles.css` under a dedicated namespace.

LLM contract changes live in:

- `src/llm/llm-client.ts`
- `src/llm/prompts/grade-answer.ts`
- `src/llm/openai-client.ts`

Automatic persistence logic should live in domain/service code and practice-page orchestration rather than directly inside view-only UI helpers.

## Interaction Rules

### Check answer

- lock the answer field
- reveal feedback inline
- switch actions to `Try again` and `Continue`
- automatically save any generated future practice items derived from detected mistakes

### Try again

- enter revision mode
- preserve prior attempt as reference
- keep corrected answer visible
- reopen textarea

### Continue

- advance to next item
- clear review state
- keep session shell and header stable
- focus the answer field for the next prompt

### Show why

- reveal explanation inline
- no modal

## Data Model Direction

The LLM grading result should gain a new `mistakeAnalyses[]` array. Each item represents one specific mistake, not the whole answer.

Each item should contain:

- `actualFragment`
- `expectedFragment`
- `issueCode`
- `shortExplanation`
- `whyPreferred`
- `practiceItems[]`

Generated practice items should be converted into `MistakeEntry` records and stored with provenance metadata so the app can distinguish imported mistakes from LLM-derived follow-up prompts.

Recommended provenance fields:

- originating attempt id
- originating exercise id
- originating learner fragment
- originating expected fragment
- derivation source such as `llm_remediation`

## Deduplication Rule

The app should save as many generated items as necessary, but avoid near-duplicate spam.

Recommended deduplication policy:

- dedupe by normalized English prompt plus normalized primary Hebrew reference
- also avoid saving when an existing item already targets the same expected fragment with a near-identical prompt/reference pair

This should remain conservative so that multiple useful prompts for the same construction are still allowed.

## Failure Handling

Grading must remain the core path. If remediation generation is missing or malformed:

- the attempt should still be saved
- the reviewed feedback should still render
- auto-generated future items should be skipped for that attempt rather than breaking the session

## Testing Expectations

Update practice page tests to verify:

- quiet shell mode on `/practice`
- prompt-first layout
- feedback hidden before submission
- reviewed state after submission
- revision state after `Try again`
- corrected answer remains visible during revision
- explanation toggle behavior
- continue advances to next item

Add grading and persistence tests to verify:

- `mistakeAnalyses[]` can be parsed from LLM output
- multiple mistake analyses render as separate feedback blocks
- generated English+Hebrew future practice items are converted into `MistakeEntry` records
- generated entries are auto-saved after grading
- duplicate generated entries are not repeatedly inserted
- malformed remediation payloads do not break grading or session review

## Constraints and Notes

- The workspace currently does not expose a `.git` repository from `/home/adi/Development/hebrew-trainer`, so this design document cannot be committed from here.
- The redesign should preserve the existing grading and persistence flow where possible and focus changes on shell, layout, state rendering, and copy.
