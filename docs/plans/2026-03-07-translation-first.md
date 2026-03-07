# Translation-First Practice Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the app from Hebrew-correction import to English-to-Hebrew translation practice with stored generated Hebrew references.

**Architecture:** Extend the persisted entry model to support English prompts plus generated Hebrew references, then rewire import, grading, and practice to use the translation-first flow while keeping legacy records readable. The LLM becomes the source of generated reference answers and translation-aware grading context.

**Tech Stack:** React, TypeScript, Vite, Vitest, IndexedDB, OpenAI-compatible LLM client

---

### Task 1: Extend the core model for translation prompts

**Files:**
- Modify: `src/domain/models/mistake.ts`
- Modify: `src/domain/services/mistake-entry-factory.ts`
- Test: `src/storage/repositories/repositories.test.ts`

**Step 1: Write the failing test**

Add a repository round-trip test that stores and reloads an entry with:

- `englishPrompt`
- `primaryTranslation`
- `acceptableTranslations`
- `practiceRoots`

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/storage/repositories/repositories.test.ts`

Expected: FAIL because the stored shape does not yet cover the new fields.

**Step 3: Write minimal implementation**

Extend `MistakeEntry` and `ImportCandidate` to include translation-first fields while preserving existing fields for compatibility. Update any factory defaults accordingly.

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/storage/repositories/repositories.test.ts`

Expected: PASS

### Task 2: Add English import parsing

**Files:**
- Modify: `src/domain/services/mistake-extraction-service.ts`
- Modify: `src/domain/services/mistake-extraction-service.test.ts`

**Step 1: Write the failing test**

Add tests for parsing:

- one English sentence per line
- blank-line-separated English blocks

Assert the parser creates candidates with `englishPrompt`.

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/domain/services/mistake-extraction-service.test.ts`

Expected: FAIL because the parser still expects Hebrew correction pairs.

**Step 3: Write minimal implementation**

Add English-line parsing and candidate construction for translation-first rows. Keep legacy correction parsing in place for compatibility if practical.

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/domain/services/mistake-extraction-service.test.ts`

Expected: PASS

### Task 3: Generate Hebrew references when saving imported English prompts

**Files:**
- Modify: `src/llm/llm-client.ts`
- Modify: `src/llm/openai-client.ts`
- Create or Modify: `src/llm/prompts/generate-translation-reference.ts`
- Modify: `src/features/import/pages/ImportPage.tsx`
- Test: `src/llm/llm-client.test.ts`
- Test: `src/features/import/pages/ImportPage.test.tsx`

**Step 1: Write the failing test**

Add:

- an LLM prompt test for translation-reference generation
- an import-page test that saves an English prompt and expects generated Hebrew reference data to be persisted

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/llm/llm-client.test.ts src/features/import/pages/ImportPage.test.tsx`

Expected: FAIL because there is no translation-reference generation path yet.

**Step 3: Write minimal implementation**

Add a translation-reference generation API that returns:

- `primaryTranslation`
- `acceptableTranslations`
- `focusTokens`
- `practiceRoots`
- `register`
- `ruleNote`

Update `ImportPage` save behavior to generate references before persisting.

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/llm/llm-client.test.ts src/features/import/pages/ImportPage.test.tsx`

Expected: PASS

### Task 4: Rebuild exercise generation around English prompts

**Files:**
- Modify: `src/domain/services/exercise-generation-service.ts`
- Modify: `src/domain/services/exercise-generation-service.test.ts`
- Modify: `src/features/practice/practice-variation-service.ts`
- Modify: `src/features/practice/practice-variation-service.test.ts`

**Step 1: Write the failing test**

Add tests asserting generated exercises:

- display the English prompt as the main practice source
- use generated Hebrew references as targets and acceptable answers
- still interleave different families

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/domain/services/exercise-generation-service.test.ts src/features/practice/practice-variation-service.test.ts`

Expected: FAIL because exercises are still built from Hebrew correction pairs.

**Step 3: Write minimal implementation**

Use `englishPrompt` as the displayed source and `primaryTranslation` plus `acceptableTranslations` as the grading reference set. Keep fallback behavior for legacy records.

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/domain/services/exercise-generation-service.test.ts src/features/practice/practice-variation-service.test.ts`

Expected: PASS

### Task 5: Update grading for translation-aware feedback

**Files:**
- Modify: `src/domain/services/grading-service.ts`
- Modify: `src/domain/services/grading-service.test.ts`
- Modify: `src/llm/prompts/grade-answer.ts`

**Step 1: Write the failing test**

Add grading tests where:

- the prompt meaning is English
- the user provides a valid Hebrew translation variant
- feedback explains the delta between the user translation and the preferred Hebrew translation

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/domain/services/grading-service.test.ts`

Expected: FAIL because grading still assumes the source premise is a corrected Hebrew sentence.

**Step 3: Write minimal implementation**

Adjust grading prompts and local defaults so explanations reference the English meaning and the generated Hebrew reference set.

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/domain/services/grading-service.test.ts`

Expected: PASS

### Task 6: Update practice and mistake-bank UI copy

**Files:**
- Modify: `src/features/practice/pages/PracticePage.tsx`
- Modify: `src/features/import/pages/ImportPage.tsx`
- Modify: `src/features/mistakes/pages/MistakeBankPage.tsx`
- Modify: `src/features/practice/pages/PracticePage.test.tsx`
- Modify: `src/styles.css`

**Step 1: Write the failing test**

Add UI assertions for:

- import instructions referencing English prompts
- practice prompt showing English source text
- mistake bank surfacing English plus generated Hebrew references

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/import/pages/ImportPage.test.tsx src/features/practice/pages/PracticePage.test.tsx`

Expected: FAIL because the UI still describes Hebrew correction import.

**Step 3: Write minimal implementation**

Update labels, placeholders, and rendering to match the translation-first flow. Keep typography and teaching UI consistent.

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/features/import/pages/ImportPage.test.tsx src/features/practice/pages/PracticePage.test.tsx`

Expected: PASS

### Task 7: Full verification

**Files:**
- Modify: any touched files from previous tasks

**Step 1: Run the full test suite**

Run: `npm run test -- --run`

Expected: all tests pass

**Step 2: Run the production build**

Run: `npm run build`

Expected: build succeeds

**Step 3: Review for stale copy**

Check for leftover correction-first language:

Run: `rg -n "corrected Hebrew|Original:|Corrected:|correction pairs|Fix the Hebrew" src`

Expected: only intentionally retained compatibility references remain
