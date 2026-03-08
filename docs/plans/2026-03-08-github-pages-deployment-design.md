# GitHub Pages Deployment Design

**Date:** 2026-03-08

## Goal

Deploy the Vite app to a new public GitHub repository at `adieyal/hebrew-trainer` and host the built site on GitHub Pages at `https://adieyal.github.io/hebrew-trainer/`.

## Context

The repository currently has no Git remote configured and no GitHub Actions workflow. The Vite config also does not set a `base` path, which means the app would emit root-relative asset URLs that break when hosted from a project page path such as `/hebrew-trainer/`.

## Options Considered

### 1. GitHub Pages via GitHub Actions

Use the official Pages workflow actions to build the app, upload `dist/`, and deploy from the default branch.

**Pros**
- Matches GitHub’s recommended Pages flow
- No deploy branch to maintain
- Easy to rerun and inspect in Actions
- Keeps deployment logic in the repo

**Cons**
- Requires Pages to be configured for GitHub Actions

### 2. GitHub Pages via `gh-pages` Branch

Build locally or in CI, then push the static output to a dedicated branch.

**Pros**
- Familiar older pattern

**Cons**
- More branch-management overhead
- Less clean than the first-party Actions flow

### 3. No Base Path Adjustment

Keep Vite as-is and rely on Pages hosting anyway.

**Pros**
- No config change

**Cons**
- Incorrect asset URLs for a project page deployment
- Site would likely load a blank page or broken assets

## Chosen Approach

Use GitHub Pages via GitHub Actions.

## Design

### Repository Hosting

Create a new public GitHub repository named `adieyal/hebrew-trainer`, add it as the `origin` remote, and push the current `main` branch.

### Build Configuration

Set `base: "/hebrew-trainer/"` in Vite so built asset paths resolve correctly on GitHub Pages under the repository path.

To avoid config drift, keep both checked-in Vite config entry points aligned.

### Deployment Workflow

Add a workflow under `.github/workflows/` that:

1. Runs on pushes to `main`
2. Installs dependencies with `npm ci`
3. Builds the project with `npm run build`
4. Uploads the `dist/` directory as the Pages artifact
5. Deploys with the official `deploy-pages` action

### GitHub Pages Settings

Configure the repository Pages source to “GitHub Actions” so deployments come from the workflow rather than a branch.

## Validation

Before pushing:

- Run `npm run build`
- Ensure the workflow file is syntactically valid

After pushing:

- Confirm the Actions workflow succeeds
- Confirm Pages is enabled
- Open the deployed URL and verify the app loads with working assets
