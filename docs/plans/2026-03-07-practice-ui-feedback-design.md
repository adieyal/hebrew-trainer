# Practice UI Typography And Feedback Design

**Date:** 2026-03-07

## Goal

Improve the practice surface so Hebrew text is the clearest, most visually important element on the page, feedback is easier to learn from, and LLM grading activity is visibly communicated while it runs.

## UX Direction

The practice page should feel like a writing table, not a form. Hebrew prompt text, typed answers, and corrected feedback should sit at the center of the visual hierarchy through a Hebrew-first web font, larger sizing, stronger contrast, and calmer surrounding UI chrome.

## Typography

Use a Hebrew-first web font for Hebrew-heavy practice content only. Keep the broader app’s English interface typography intact. The prompt text, response textarea, and corrected answer should all be larger and visually denser than labels, buttons, and helper text.

## Feedback Treatment

Feedback should move from plain prose to guided review:

- score normalized to `0-100%`
- clearer verdict labels
- inline highlighted fragments for issues
- spelling issues use one underline color
- grammar, structure, and style issues use a second underline color
- hover/focus reveals the issue explanation

The user should be able to glance at the corrected sentence and immediately see where the important problems were.

## Layout Adjustments

- reduce the visual gap between the answer textarea and the action row
- keep `Check answer` attached to the editor block
- improve feedback card spacing so the corrected Hebrew stands out

## Loading State

When LLM grading is active, the UI should clearly show that evaluation is still in progress and temporarily disable conflicting actions. The state should read as deliberate grading, not as a frozen interface.

## Scope Guardrails

- keep the changes limited to the practice page and shared styles used by that surface
- do not redesign the whole app shell
- use semantic HTML and focus-safe tooltip behavior
- keep score math defensive so values never exceed `100%`
