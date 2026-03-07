# Translation-First Practice Design

## Summary

The app will shift from a correction-first Hebrew mistake bank to an English-prompt translation trainer. Users will import only English sentences. On save, the app will generate Hebrew reference translations and supporting metadata with the LLM, then store that generated reference set locally for stable practice, grading, and spaced repetition.

## Goals

- Let the user import English prompts instead of Hebrew correction pairs.
- Generate reusable Hebrew reference answers automatically.
- Keep practice stable and reviewable by storing generated references locally.
- Preserve adaptive scoring, variety, and feedback quality.

## Core Model Shift

The current `MistakeEntry` premise is:

- optional original Hebrew
- corrected Hebrew
- derived token-level mistake metadata

The new premise becomes a translation prompt with generated Hebrew references:

- `englishPrompt`
- `primaryTranslation`
- `acceptableTranslations`
- `register`
- `contexts`
- `focusTokens`
- `practiceRoots`
- adaptive learning stats

We should keep the existing persisted shape readable long enough to avoid breaking the app during migration, but the UI and new saves should move to the translation-first model.

## Import Flow

The import page should accept plain English input, ideally one sentence per line for v1. The import parser will produce candidate rows containing English prompts only. When the user saves accepted rows:

1. The app sends each English prompt to the LLM.
2. The LLM returns:
   - one primary Hebrew translation
   - several acceptable Hebrew variants
   - register/context hints
   - focus tokens or practice roots
   - a short explanation of what makes the phrasing natural
3. The app stores the generated result locally as the new practice item.

If LLM generation fails, the row should remain unsaved and the UI should clearly say why. This redesign is intentionally LLM-dependent.

## Practice Flow

Practice becomes translation from English to Hebrew:

- prompt card shows the English sentence
- user types Hebrew
- grading compares the answer against the generated Hebrew reference set
- the LLM evaluates semantic accuracy, naturalness, and target-pattern handling
- adaptive stats continue updating after each attempt

The existing richer teaching panel still applies, but the comparison now explains the difference between the user translation and a natural Hebrew rendering of the English source sentence.

## Feedback

Feedback should remain layered:

- top-line verdict and score
- generated Hebrew reference answer
- expandable teaching block:
  - what you wrote
  - better phrasing
  - what changed
  - why Hebrew prefers it
  - another example

Because the source is English, explanations should explicitly connect the Hebrew choice back to meaning and register rather than to a user-imported “corrected sentence.”

## Variety and Adaptation

Variety should come from two places:

- the stored acceptable Hebrew variants for each English prompt
- later generated refresh variants over time

The current spaced repetition and interleaved selection logic can stay, but it should operate on translation prompts rather than correction entries. Over time, we can also generate neighboring English prompts that reinforce the same weak forms, but that is not required for this first pass.

## Migration Strategy

This first pass should be additive rather than destructive:

- extend the model to support translation prompts
- make new imports create translation-first records
- make practice prefer translation-first records
- keep existing data readable so the app still loads

We do not need a perfect semantic migration of every old correction-first field immediately.

## Risks

- The app becomes meaningfully more dependent on the LLM.
- Generated metadata may vary in quality across models.
- Existing screens that assume Hebrew source/corrected pairs will need careful adaptation.

## Out of Scope

- removing every correction-first code path in one pass
- generating new English prompts from weak forms
- migrating every legacy record into the new semantics perfectly
