# Personal Hebrew Mistake Trainer Design

**Date:** 2026-03-07

## Goal

Build a desktop-first, local-first React application that turns a learner's corrected Hebrew examples into a persisted mistake bank, targeted writing practice, structured feedback, and lightweight progress insights.

## Product Slice

The MVP centers on a complete offline loop:

1. Import explicit correction pairs and conservative transcript extracts
2. Review and save mistakes into IndexedDB
3. Generate short rule-based exercises from stored mistakes
4. Grade typed Hebrew answers with token-aware feedback
5. Track attempts, relapse, mastery, and review timing
6. Export and restore the full dataset as versioned JSON

Optional LLM support is kept behind settings and interface boundaries so the app remains fully useful without external APIs.

## Architecture

The app will use React, TypeScript, Vite, React Router, and Zustand for a small, predictable client architecture. Domain logic lives in pure TypeScript services and models. IndexedDB persistence is wrapped in repository modules so feature code stays decoupled from storage details. Route pages stay thin and delegate behavior to feature hooks and stores.

## UX Direction

The interface should feel like a private study desk rather than a dashboard. The visual system will use warm paper-and-ink tones, strong typography, visible focus states, and first-class RTL support. Practice will prioritize one clear task at a time with calm feedback and obvious next actions.

## Data Model

Core entities:

- `MistakeEntry`
- `Exercise`
- `Attempt`
- `PracticeSession`
- `AppSettings`

Derived insights come from attempts plus current mistake metadata rather than storing redundant aggregates.

## Scope Decisions

- First-class import format: `Original:` / `Corrected:` pairs, with support for `wrong -> right` lines and limited transcript heuristics
- Practice allows revising the answer before moving on
- Derived mistakes are suggested in grading results but not auto-saved
- Charts stay simple and readable, implemented with lightweight SVG/CSS rather than a heavy charting library
- LLM client interfaces are included, but live calls are optional and disabled by default
