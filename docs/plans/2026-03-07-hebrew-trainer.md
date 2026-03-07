# Personal Hebrew Mistake Trainer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local-first React app that imports Hebrew corrections, stores a personal mistake bank, runs typed practice sessions, grades answers, tracks insights, and supports JSON backup/restore.

**Architecture:** Use React + TypeScript + Vite for the UI shell, React Router for navigation, Zustand for local app state, and IndexedDB via `idb` repositories for persistence. Keep product behavior in pure domain services so import parsing, exercise generation, grading, scheduling, and insights are testable without the UI.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Zustand, idb, Vitest, Testing Library

---

### Task 1: Scaffold project and app shell

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/routes.tsx`
- Create: `src/app/providers.tsx`
- Create: `src/styles.css`

**Step 1: Write the failing build setup**

Create the config and app entry files, then run the build to surface missing dependencies or type issues.

**Step 2: Run build to verify it fails**

Run: `npm run build`
Expected: FAIL because dependencies are not yet installed or some source files are incomplete.

**Step 3: Write minimal implementation**

Add the base Vite/React wiring, routes for Import, Practice, Mistakes, Insights, and Settings, and a shell layout with navigation.

**Step 4: Run build to verify it passes**

Run: `npm run build`
Expected: PASS after installing dependencies and fixing types.

### Task 2: Add core domain models and pure services with tests

**Files:**
- Create: `src/domain/models/*.ts`
- Create: `src/domain/services/*.ts`
- Create: `src/domain/utils/*.ts`
- Test: `src/domain/**/*.test.ts`

**Step 1: Write the failing tests**

Cover normalization, import parsing, exercise generation, grading, review scheduling, and insights derivation.

**Step 2: Run tests to verify they fail**

Run: `npm run test -- --runInBand`
Expected: FAIL with missing exports or behavior mismatches.

**Step 3: Write minimal implementation**

Add pure models and services that satisfy the tests and follow the MVP rules from `spec.md`.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- --runInBand`
Expected: PASS.

### Task 3: Add IndexedDB repositories and app settings persistence

**Files:**
- Create: `src/storage/db.ts`
- Create: `src/storage/repositories/*.ts`
- Test: `src/storage/**/*.test.ts`

**Step 1: Write the failing repository tests**

Cover saving, listing, updating, and replacing data for mistakes, sessions, attempts, and settings.

**Step 2: Run tests to verify they fail**

Run: `npm run test -- --runInBand`
Expected: FAIL with repository methods not implemented.

**Step 3: Write minimal implementation**

Create IndexedDB object stores and repository adapters with versioned schema setup.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- --runInBand`
Expected: PASS.

### Task 4: Implement import flow and mistake bank

**Files:**
- Create: `src/features/import/**/*`
- Create: `src/features/mistakes/**/*`
- Modify: `src/app/routes.tsx`
- Test: `src/features/import/**/*.test.tsx`

**Step 1: Write the failing UI and behavior tests**

Cover parsing pasted text into editable candidates, accepting/rejecting rows, saving candidates, listing mistakes, filtering, and opening details.

**Step 2: Run tests to verify they fail**

Run: `npm run test -- --runInBand`
Expected: FAIL with missing components and stores.

**Step 3: Write minimal implementation**

Build the import page, candidate editing table, save actions, mistake filters, and detail panel using the repositories and domain services.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- --runInBand`
Expected: PASS.

### Task 5: Implement practice loop and feedback

**Files:**
- Create: `src/features/practice/**/*`
- Test: `src/features/practice/**/*.test.tsx`

**Step 1: Write the failing practice tests**

Cover session creation from stored mistakes, answer submission, feedback rendering, progress tracking, revision before continue, and completion summary.

**Step 2: Run tests to verify they fail**

Run: `npm run test -- --runInBand`
Expected: FAIL with missing practice flow code.

**Step 3: Write minimal implementation**

Build the practice page, state store, session hook, response editor, feedback panel, and completion summary.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- --runInBand`
Expected: PASS.

### Task 6: Implement insights and backup/restore

**Files:**
- Create: `src/features/insights/**/*`
- Create: `src/features/settings/**/*`
- Create: `src/features/export/*`
- Test: `src/features/insights/**/*.test.tsx`
- Test: `src/features/export/**/*.test.ts`

**Step 1: Write the failing tests**

Cover derived insight cards, relapse/mastery summaries, JSON export shape, import validation, and settings updates.

**Step 2: Run tests to verify they fail**

Run: `npm run test -- --runInBand`
Expected: FAIL with missing modules.

**Step 3: Write minimal implementation**

Add the insights screen, settings form, optional LLM config persistence, JSON export/import services, and simple charts/cards.

**Step 4: Run tests to verify they pass**

Run: `npm run test -- --runInBand`
Expected: PASS.

### Task 7: Verify the whole app

**Files:**
- Modify: any remaining files required by test/build fixes

**Step 1: Run the full verification suite**

Run: `npm run test -- --runInBand`
Expected: PASS.

**Step 2: Run the production build**

Run: `npm run build`
Expected: PASS.

**Step 3: Review the app against the PRD**

Confirm that import, practice, insights, persistence, RTL support, and backup/restore all exist and behave per `spec.md`.
