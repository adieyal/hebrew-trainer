# GitHub Pages Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Configure this Vite app to build and deploy to GitHub Pages from a new public repository at `adieyal/hebrew-trainer`.

**Architecture:** The app will remain a static Vite build. A GitHub Actions workflow will build `dist/` on pushes to `main`, upload the artifact, and deploy it to GitHub Pages. Vite will use a repository-scoped base path so project-page asset URLs resolve correctly.

**Tech Stack:** Vite, React, TypeScript, GitHub Actions, GitHub Pages, GitHub CLI

---

### Task 1: Add Pages-compatible Vite configuration

**Files:**
- Modify: `vite.config.ts`
- Modify: `vite.config.js`

**Step 1: Inspect the current Vite config**

Run: `sed -n '1,220p' vite.config.ts`
Expected: Vite config without a `base` property.

**Step 2: Add the Pages base path**

Update both config files to set:

```ts
base: "/hebrew-trainer/",
```

Expected: both config entry points stay aligned.

**Step 3: Verify the diff**

Run: `git diff -- vite.config.ts vite.config.js`
Expected: only the `base` property is added.

### Task 2: Add the GitHub Pages deployment workflow

**Files:**
- Create: `.github/workflows/deploy-pages.yml`

**Step 1: Create the workflow**

Add a workflow that:
- triggers on push to `main`
- uses `actions/checkout`
- sets up Node
- runs `npm ci`
- runs `npm run build`
- uploads `dist/`
- deploys with `actions/deploy-pages`

**Step 2: Verify the workflow contents**

Run: `sed -n '1,240p' .github/workflows/deploy-pages.yml`
Expected: workflow references the official Pages actions and `dist/`.

### Task 3: Verify the local build

**Files:**
- No file changes

**Step 1: Run the project build**

Run: `npm run build`
Expected: successful Vite production build output in `dist/`.

**Step 2: Review generated asset paths if needed**

Run: `rg "/hebrew-trainer/" dist`
Expected: built HTML or asset references include the Pages base path.

### Task 4: Create and connect the GitHub repository

**Files:**
- No file changes

**Step 1: Create the public repository**

Run:

```bash
gh repo create adieyal/hebrew-trainer --public --source=. --remote=origin --push
```

Expected: GitHub repository is created, `origin` is added, and `main` is pushed.

**Step 2: Confirm the remote**

Run: `git remote -v`
Expected: `origin` points to `adieyal/hebrew-trainer`.

### Task 5: Enable GitHub Pages deployment from Actions

**Files:**
- No file changes

**Step 1: Configure Pages**

Run:

```bash
gh api -X POST repos/adieyal/hebrew-trainer/pages -f build_type=workflow
```

Expected: GitHub Pages is configured to build from Actions.

**Step 2: Confirm Pages settings**

Run:

```bash
gh api repos/adieyal/hebrew-trainer/pages
```

Expected: response shows Pages enabled for workflow-based deployment.

### Task 6: Check deployment status

**Files:**
- No file changes

**Step 1: Watch the workflow**

Run:

```bash
gh run list --repo adieyal/hebrew-trainer --limit 5
```

Expected: a Pages deployment workflow appears.

**Step 2: Inspect the latest run if needed**

Run:

```bash
gh run view --repo adieyal/hebrew-trainer --log
```

Expected: build and deployment jobs complete successfully.

**Step 3: Confirm the site URL**

Run:

```bash
gh repo view adieyal/hebrew-trainer --web
```

Expected: repository exists and the Pages site URL is `https://adieyal.github.io/hebrew-trainer/`.
