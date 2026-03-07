# Practice UI Typography And Feedback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the practice experience easier to read and learn from by upgrading Hebrew typography, fixing score presentation, adding highlighted issue explanations, tightening layout spacing, and showing an explicit LLM grading loading state.

**Architecture:** Keep the change centered on the practice page and shared CSS. Extend grading results only where needed to support issue highlighting, then render those issues through small UI helpers on the practice page. Use a Hebrew-first web font for practice content via stylesheet import and scoped classes rather than replacing the entire app’s type system.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, CSS

---

### Task 1: Add failing practice UI tests

**Files:**
- Modify: `src/features/practice/pages/PracticePage.test.tsx`

**Step 1: Write the failing tests**

Add tests for:
- score display never exceeding `100%`
- visible loading copy during async grading
- issue highlight rendering when grading returns issues

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: FAIL because the current page does not render those UI states.

**Step 3: Write minimal implementation**

Update the practice page and helpers until the new UI states appear.

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: PASS.

### Task 2: Improve typography and layout

**Files:**
- Modify: `src/styles.css`
- Modify: `src/features/practice/pages/PracticePage.tsx`

**Step 1: Write the failing test or assertion**

Use the practice test additions to assert the relevant classnames or loading text where practical.

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: FAIL until the page reflects the new structure.

**Step 3: Write minimal implementation**

Import a Hebrew-first web font, add scoped Hebrew content classes, enlarge Hebrew text, tighten the answer/action spacing, and visually prioritize prompt and corrected Hebrew.

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: PASS.

### Task 3: Add issue highlighting UI

**Files:**
- Create: `src/features/practice/feedback-highlighting.tsx`
- Modify: `src/features/practice/pages/PracticePage.tsx`
- Modify: `src/styles.css`

**Step 1: Write the failing test**

Assert that returned issues are rendered as distinct highlighted fragments with visible explanations.

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: FAIL with missing highlight UI.

**Step 3: Write minimal implementation**

Render corrected-answer highlights with two issue categories:
- spelling
- grammar/style/structure

Add tooltip text or inline explanatory labels tied to those fragments.

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/features/practice/pages/PracticePage.test.tsx`
Expected: PASS.

### Task 4: Verify full app integrity

**Files:**
- Modify: any remaining files needed for integration fixes

**Step 1: Run the full verification suite**

Run: `npm run test -- --run`
Expected: PASS.

**Step 2: Run the production build**

Run: `npm run build`
Expected: PASS.
