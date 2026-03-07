# LLM-Led Grading And Adaptive Practice Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace exact-sentence grading with configurable rule-based, hybrid, and LLM-led evaluation, and generate adaptive practice that revisits weak words/forms over time without repeating the same sentence structure.

**Architecture:** Extend the domain models so exercises and mistakes carry focus-token and variation metadata, add an LLM client contract for grading and sentence generation, and route practice selection through a weighted adaptive scheduler. Keep the UI thin and let grading and selection rules live in domain services so they remain testable.

**Tech Stack:** React 19, TypeScript, Vite, IndexedDB, optional OpenAI-compatible HTTP client, Vitest, Testing Library

---

### Task 1: Extend settings and domain models

**Files:**
- Modify: `src/domain/models/settings.ts`
- Modify: `src/domain/models/exercise.ts`
- Modify: `src/domain/models/mistake.ts`
- Modify: `src/domain/services/settings-service.ts`
- Test: `src/domain/services/settings-service.test.ts`

**Step 1: Write the failing tests**

Add tests for default grading strategy selection and new weakness/variation defaults.

**Step 2: Run tests to verify they fail**

Run: `npm run test -- --run`
Expected: FAIL with missing fields or incompatible defaults.

**Step 3: Write minimal implementation**

Add grading strategy, weakness profile, and richer exercise metadata with backward-compatible defaults.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- --run`
Expected: PASS.

### Task 2: Add LLM contracts for grading and exercise variation

**Files:**
- Create: `src/llm/llm-client.ts`
- Create: `src/llm/openai-client.ts`
- Create: `src/llm/prompts/grade-answer.ts`
- Create: `src/llm/prompts/generate-variation.ts`
- Test: `src/llm/llm-client.test.ts`

**Step 1: Write the failing tests**

Cover prompt payload shaping and JSON response parsing for structured grading and variation generation.

**Step 2: Run tests to verify they fail**

Run: `npm run test -- --run`
Expected: FAIL with missing client modules.

**Step 3: Write minimal implementation**

Add provider-agnostic interfaces and a minimal OpenAI-compatible fetch adapter.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- --run`
Expected: PASS.

### Task 3: Refactor grading into configurable strategies

**Files:**
- Modify: `src/domain/services/grading-service.ts`
- Modify: `src/domain/models/attempt.ts`
- Test: `src/domain/services/grading-service.test.ts`

**Step 1: Write the failing tests**

Add coverage for exact pass, hybrid fallback, and LLM-led acceptance of alternate-but-valid Hebrew.

**Step 2: Run tests to verify they fail**

Run: `npm run test -- --run`
Expected: FAIL with unsupported strategy or missing verdict metadata.

**Step 3: Write minimal implementation**

Return richer grading results including verdict source, semantic acceptance, and targeted-pattern handling.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- --run`
Expected: PASS.

### Task 4: Add adaptive weakness scoring and weighted session selection

**Files:**
- Modify: `src/domain/services/spaced-repetition-service.ts`
- Modify: `src/domain/services/exercise-generation-service.ts`
- Create: `src/domain/services/adaptive-practice-service.ts`
- Test: `src/domain/services/spaced-repetition-service.test.ts`
- Test: `src/domain/services/adaptive-practice-service.test.ts`

**Step 1: Write the failing tests**

Cover weakness updates after correct/incorrect attempts, damping of overused items, and scheduled resurfacing of strong items.

**Step 2: Run tests to verify they fail**

Run: `npm run test -- --run`
Expected: FAIL with missing adaptive behavior.

**Step 3: Write minimal implementation**

Compute rolling weakness scores and pick sessions with weighted spacing rather than straight slicing.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- --run`
Expected: PASS.

### Task 5: Generate fresh variations around weak forms

**Files:**
- Modify: `src/domain/services/exercise-generation-service.ts`
- Create: `src/features/practice/practice-variation-service.ts`
- Test: `src/domain/services/exercise-generation-service.test.ts`

**Step 1: Write the failing tests**

Cover generation of exercises that preserve target forms while changing sentence context.

**Step 2: Run tests to verify they fail**

Run: `npm run test -- --run`
Expected: FAIL with missing variation support.

**Step 3: Write minimal implementation**

Add rule-based variation generation first and LLM-backed variation generation when configured.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- --run`
Expected: PASS.

### Task 6: Update settings and practice UI

**Files:**
- Modify: `src/features/settings/pages/SettingsPage.tsx`
- Modify: `src/features/practice/pages/PracticePage.tsx`
- Test: `src/features/settings/pages/SettingsPage.test.tsx`
- Test: `src/features/practice/pages/PracticePage.test.tsx`

**Step 1: Write the failing tests**

Cover grading strategy selection, automatic defaulting when a key exists, and feedback messaging for accepted alternate wording.

**Step 2: Run tests to verify they fail**

Run: `npm run test -- --run`
Expected: FAIL with missing UI states.

**Step 3: Write minimal implementation**

Surface the new strategy settings and richer practice feedback without complicating the page flow.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- --run`
Expected: PASS.

### Task 7: Verify the full adaptive practice flow

**Files:**
- Modify: any remaining files needed for integration fixes

**Step 1: Run the full verification suite**

Run: `npm run test -- --run`
Expected: PASS.

**Step 2: Run the production build**

Run: `npm run build`
Expected: PASS.

**Step 3: Manually inspect the new behavior**

Confirm that rule-based-only still works offline, API-key presence changes the default strategy, alternate phrasings can be accepted through LLM-led grading, and weak items reappear adaptively without dominating every session.
