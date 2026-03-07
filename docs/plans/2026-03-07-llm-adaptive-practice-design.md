# LLM-Led Grading And Adaptive Practice Design

**Date:** 2026-03-07

## Goal

Upgrade the trainer so practice answers are judged for meaning, naturalness, and target-pattern correctness rather than exact sentence reproduction, while also generating fresh exercises around the words and forms the user still struggles with.

## Product Behavior

When LLM support is enabled, the app should treat the saved answer as a reference answer rather than the only acceptable answer. The learner may produce a different Hebrew sentence if it still expresses the intended meaning, sounds natural enough, and avoids the original mistake pattern.

The app should also generate new practice prompts that reuse the learner's weak focus words, phrases, or nearby forms in different contexts. Practice selection should stay adaptive: weak items appear more often, but even strong items reappear on a schedule so learning sticks.

## Settings Model

Add a dedicated grading strategy setting:

- `rule_based_only`
- `hybrid_fallback`
- `llm_led`

If an API key is available locally, default the strategy to `llm_led`. If no key is present, default to `rule_based_only`.

Keep the existing LLM mode for feature availability, but separate it from the grading strategy so the user can enable LLM features without surrendering grading control.

## Exercise Model

Exercises need to carry a stronger learning contract:

- reference answer
- meaning intent
- target focus tokens
- target practice roots or reusable forms
- whether free variation is allowed

This lets the grader ask "did the user handle the learning target?" rather than "did the user copy the saved sentence?"

## Grading Model

Use a three-stage grading pipeline:

1. Fast rule-based pass
   - exact and acceptable variant checks
   - token-level focus-token mismatch detection
   - obvious hard fail when the original target mistake is repeated
2. LLM evaluation
   - judge semantic acceptability
   - judge naturalness
   - judge whether the target pattern was handled correctly
   - return structured JSON with score, verdict, issues, and concise feedback
3. Merge result
   - preserve deterministic issue extraction when useful
   - prefer LLM verdict for correctness in `llm_led`
   - use LLM only for ambiguity in `hybrid_fallback`

## Adaptive Practice Model

Each mistake entry gains a rolling weakness profile:

- `weaknessScore`
- `exposureCount`
- `recentVariationForms`
- `lastPracticedFocus`

Selection becomes weighted spaced repetition:

- weak items are upweighted
- recently overused items are temporarily damped
- relapsed items remain eligible
- strong items still return when due

This avoids hammering the same token continuously while still ensuring long-term review.

## LLM Sentence Generation

For eligible mistakes, the app should ask the LLM to generate nearby practice items using:

- the original mistake
- corrected form
- focus tokens
- adjacent tokens
- requested number of fresh prompts
- realism constraints such as messaging-style Hebrew

The output should be structured JSON exercises that preserve the targeted word or form family while changing the surface sentence.

## UX Changes

- Settings explains grading strategy and automatic defaulting when an API key exists
- Practice feedback can show:
  - `Accepted, different wording`
  - `Meaning okay, but target pattern still wrong`
  - `Natural enough, but register missed`
- Practice session generation should feel varied, not repetitive

## Scope Guardrails

- Keep LLM use optional
- Keep JSON-only contracts
- Do not attempt full morphology or lemma analysis in v1; store "practice roots/forms" as lightweight strings inferred from existing focus and adjacent tokens
- Continue to work offline with rule-based behavior when the LLM is disabled
