# Practice Session Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework `/practice` into a compact session-mode writing screen with explicit answering, reviewed, and revising states while adding mistake-level LLM remediation that auto-saves future English+Hebrew practice items.

**Architecture:** Make `AppShell` route-aware so `/practice` gets a quiet top bar and no large hero. Extend the grading contract so the LLM returns sentence-level feedback plus `mistakeAnalyses[]` entries, each containing mistake-specific future practice items. Recompose `PracticePage` into a single primary session surface with explicit UI modes layered on top of the existing grading/session logic, automatically persist generated practice items with deduplication, and refresh tests around behavior, persistence, and copy.

**Tech Stack:** React, TypeScript, React Router, Vite, Vitest, Testing Library, CSS

---

### Task 1: Extend grading models for mistake-level remediation

**Files:**
- Modify: `src/domain/models/attempt.ts`
- Modify: `src/domain/models/mistake.ts`
- Modify: `src/llm/llm-client.ts`
- Test: `src/llm/llm-client.test.ts`

**Step 1: Write the failing test**

Add or extend a test that expects the LLM grading payload shape to support:

- `mistakeAnalyses[]`
- per-mistake fragment metadata
- generated practice items with English and Hebrew content

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/llm/llm-client.test.ts`
Expected: FAIL because the current types and parsing logic do not include mistake-level remediation.

**Step 3: Write minimal implementation**

- Extend attempt result types with `mistakeAnalyses[]`.
- Extend mistake entry provenance fields for generated follow-up prompts.
- Extend the LLM client interfaces to describe generated practice items.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/llm/llm-client.test.ts`
Expected: PASS for the new payload shape.

**Step 5: Commit**

```bash
git add src/domain/models/attempt.ts src/domain/models/mistake.ts src/llm/llm-client.ts src/llm/llm-client.test.ts
git commit -m "feat: model mistake-level remediation output"
```

### Task 2: Update the LLM grading prompt and schema

**Files:**
- Modify: `src/llm/prompts/grade-answer.ts`
- Modify: `src/llm/openai-client.ts`
- Test: `src/llm/openai-client.test.ts`

**Step 1: Write the failing test**

Add a test that expects the OpenAI-compatible client to parse `mistakeAnalyses[]` and generated practice items from the response payload.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/llm/openai-client.test.ts`
Expected: FAIL because the current schema excludes remediation arrays.

**Step 3: Write minimal implementation**

- Extend the grading prompt to require one analysis per specific mistake.
- Require each analysis to include 2-4 future English-led practice items with Hebrew references.
- Extend the JSON schema in the OpenAI client accordingly.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/llm/openai-client.test.ts`
Expected: PASS for the expanded schema.

**Step 5: Commit**

```bash
git add src/llm/prompts/grade-answer.ts src/llm/openai-client.ts src/llm/openai-client.test.ts
git commit -m "feat: request mistake remediation from llm grading"
```

### Task 3: Save generated practice items automatically with deduplication

**Files:**
- Modify: `src/domain/services/grading-service.ts`
- Modify: `src/domain/services/mistake-entry-factory.ts`
- Modify: `src/storage/repositories/mistake-repository.ts`
- Test: `src/storage/repositories/repositories.test.ts`
- Test: `src/domain/services/grading-service.test.ts`

**Step 1: Write the failing test**

Add tests that:

- convert generated remediation practice items into `MistakeEntry` records
- auto-save all valid generated items after grading
- skip near-duplicates based on normalized prompt/reference matching

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/domain/services/grading-service.test.ts src/storage/repositories/repositories.test.ts`
Expected: FAIL because no remediation persistence exists yet.

**Step 3: Write minimal implementation**

- Add mapping from generated practice items to `MistakeEntry`.
- Add provenance metadata for derived items.
- Add repository support for finding/avoiding duplicates as needed.
- Keep grading successful even if remediation persistence cannot run.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/domain/services/grading-service.test.ts src/storage/repositories/repositories.test.ts`
Expected: PASS for auto-save and deduplication behavior.

**Step 5: Commit**

```bash
git add src/domain/services/grading-service.ts src/domain/services/mistake-entry-factory.ts src/storage/repositories/mistake-repository.ts src/domain/services/grading-service.test.ts src/storage/repositories/repositories.test.ts
git commit -m "feat: persist generated remediation prompts"
```

### Task 4: Add practice-only shell mode

**Files:**
- Modify: `src/app/AppShell.tsx`
- Modify: `src/styles.css`
- Test: `src/features/practice/pages/PracticePage.test.tsx`

**Step 1: Write the failing test**

Add a test that renders the practice page within routing and asserts the large shell hero is absent while the compact navigation still shows `Practice`.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: FAIL because the current shell always renders the large hero.

**Step 3: Write minimal implementation**

- Use route awareness in `AppShell`.
- Render a compact header/nav treatment only for `/practice`.
- Add practice-shell CSS classes without changing non-practice routes.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: PASS for the new shell assertion.

**Step 5: Commit**

```bash
git add src/app/AppShell.tsx src/styles.css src/features/practice/pages/PracticePage.test.tsx
git commit -m "feat: add practice session shell mode"
```

### Task 5: Restructure the practice page into a single session surface

**Files:**
- Modify: `src/features/practice/pages/PracticePage.tsx`
- Modify: `src/features/practice/feedback-highlighting.tsx`
- Modify: `src/styles.css`
- Test: `src/features/practice/pages/PracticePage.test.tsx`

**Step 1: Write the failing test**

Add assertions that the page shows:

- `Focused writing session`
- `Translate to natural Hebrew`
- `Type in Hebrew`

and no longer shows the old intro copy or separate feedback placeholder structure before submission.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: FAIL because the page still renders the old intro and labels.

**Step 3: Write minimal implementation**

- Remove the landing-style session intro from `PracticePage`.
- Render the session header inline with progress metadata.
- Replace stacked cards with one main session composition.
- Rename answer label to `Type in Hebrew`.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: PASS for the new header and label expectations.

**Step 5: Commit**

```bash
git add src/features/practice/pages/PracticePage.tsx src/features/practice/feedback-highlighting.tsx src/styles.css src/features/practice/pages/PracticePage.test.tsx
git commit -m "feat: rebuild practice page layout"
```

### Task 6: Introduce explicit reviewed and revising modes

**Files:**
- Modify: `src/features/practice/pages/PracticePage.tsx`
- Test: `src/features/practice/pages/PracticePage.test.tsx`

**Step 1: Write the failing test**

Add tests that:

- after submission, the answer input is locked and `Try again` plus `Continue` appear
- clicking `Try again` shows `Cancel revision` and `Check revised answer`
- the prior attempt is shown as reference

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: FAIL because revision mode does not exist yet.

**Step 3: Write minimal implementation**

- Add a narrow UI mode model for answering/reviewed/revising.
- Preserve reviewed attempt data when entering revision mode.
- Re-enable editing only in revising mode.
- Keep controls mutually exclusive by state.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: PASS for state transition behavior.

**Step 5: Commit**

```bash
git add src/features/practice/pages/PracticePage.tsx src/features/practice/pages/PracticePage.test.tsx
git commit -m "feat: add practice revision mode"
```

### Task 7: Rebuild feedback around verdict, better phrasing, main fix, comparison, and detected mistakes

**Files:**
- Modify: `src/features/practice/pages/PracticePage.tsx`
- Modify: `src/features/practice/feedback-highlighting.tsx`
- Modify: `src/styles.css`
- Test: `src/features/practice/pages/PracticePage.test.tsx`

**Step 1: Write the failing test**

Add tests that:

- reviewed feedback shows a verdict label
- shows `Better phrasing`
- shows `Main fix`
- shows one block per detected mistake when multiple analyses exist
- no numeric score text

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: FAIL because the current page still renders `Score ...` and has no per-mistake remediation sections.

**Step 3: Write minimal implementation**

- Map grading output into the approved verdict language.
- Remove numeric score display.
- Promote corrected answer visually under `Better phrasing`.
- Derive a one-sentence main fix from teaching data or issue messages.
- Render one mistake remediation block per analysis.
- Keep generated future prompt details low-volume by default.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: PASS for the new feedback structure.

**Step 5: Commit**

```bash
git add src/features/practice/pages/PracticePage.tsx src/features/practice/feedback-highlighting.tsx src/styles.css src/features/practice/pages/PracticePage.test.tsx
git commit -m "feat: redesign practice feedback"
```

### Task 8: Refine explanation toggle and revision visibility rules

**Files:**
- Modify: `src/features/practice/pages/PracticePage.tsx`
- Modify: `src/styles.css`
- Test: `src/features/practice/pages/PracticePage.test.tsx`

**Step 1: Write the failing test**

Add assertions that:

- explanation is collapsed by default
- `Show why` reveals explanation sections
- corrected answer remains visible in revision mode after `Try again`

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: FAIL because the new copy/visibility rules are not fully enforced yet.

**Step 3: Write minimal implementation**

- Rename toggle copy to `Show why` / `Hide explanation` if needed.
- Show short explanation sections only when expanded.
- Preserve corrected answer visibility across reviewed and revising modes.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: PASS for explanation and revision visibility behavior.

**Step 5: Commit**

```bash
git add src/features/practice/pages/PracticePage.tsx src/styles.css src/features/practice/pages/PracticePage.test.tsx
git commit -m "feat: polish practice teaching flow"
```

### Task 9: Add session footer controls and advance flow polish

**Files:**
- Modify: `src/features/practice/pages/PracticePage.tsx`
- Modify: `src/styles.css`
- Test: `src/features/practice/pages/PracticePage.test.tsx`

**Step 1: Write the failing test**

Add assertions that:

- footer copy shows `Completed 1 of 5 today` after the first graded item
- `Continue` advances to the next exercise and clears feedback

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: FAIL because the old footer copy and flow do not match the redesign.

**Step 3: Write minimal implementation**

- Add a footer strip with completion copy.
- Add placeholder low-volume quick actions if included in scope.
- Ensure `Continue` resets review state and prepares the next prompt cleanly.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: PASS for footer and transition behavior.

**Step 5: Commit**

```bash
git add src/features/practice/pages/PracticePage.tsx src/styles.css src/features/practice/pages/PracticePage.test.tsx
git commit -m "feat: finish practice session flow"
```

### Task 10: Run final verification

**Files:**
- Test: `src/features/practice/pages/PracticePage.test.tsx`
- Test: `src/llm/llm-client.test.ts`
- Test: `src/llm/openai-client.test.ts`
- Test: `src/domain/services/grading-service.test.ts`
- Test: `src/storage/repositories/repositories.test.ts`
- Test: any impacted route-level tests

**Step 1: Run targeted tests**

Run: `npm test -- --run src/features/practice/pages/PracticePage.test.tsx src/llm/llm-client.test.ts src/llm/openai-client.test.ts src/domain/services/grading-service.test.ts src/storage/repositories/repositories.test.ts`
Expected: PASS

**Step 2: Run broader frontend tests**

Run: `npm test -- --run`
Expected: PASS, or identify unrelated pre-existing failures separately.

**Step 3: Manual verification**

Run: `npm run dev`
Expected: `/practice` uses the compact shell, other routes keep the current shell, and the session UI behaves correctly across desktop and mobile widths.

**Step 4: Commit**

```bash
git add src/app/AppShell.tsx src/features/practice/pages/PracticePage.tsx src/features/practice/feedback-highlighting.tsx src/styles.css src/features/practice/pages/PracticePage.test.tsx
git commit -m "feat: redesign practice session experience"
```

## Notes

- This workspace currently is not attached to a visible `.git` repository, so the commit steps may need to be run from the repository root or skipped until Git metadata is available.
- If quick actions in the footer are not yet wired to domain behavior, render them as quiet disabled or placeholder controls only if that matches product intent; otherwise omit them for this pass.
