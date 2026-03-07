# PRD: Personal Hebrew Mistake Trainer

## Engineering Product Requirements Document

## 1. Overview

### Product name

Personal Hebrew Mistake Trainer

### Product type

Desktop-first, local-first web application

### Core idea

A personalized writing practice tool that helps a user improve written Hebrew by practicing their own recurring mistakes.

The app captures corrected Hebrew examples, turns them into structured mistake entries, generates targeted exercises, grades typed Hebrew responses, and tracks relapse and mastery over time.

This is not a generic language app. It is a **personal error-driven writing trainer**.

---

## 2. Product objective

Build a working local-first application that lets a user:

* import real Hebrew corrections from past conversations
* organize them into a personal mistake bank
* practice through typed Hebrew exercises
* receive structured, pattern-aware feedback
* review recurring mistake categories and relapse trends
* persist all data locally in the browser
* optionally use an LLM for parsing, generation, and tolerant grading

---

## 3. Product vision

The application should feel like:

* a private writing desk
* a study instrument with memory
* a calm and intelligent practice surface
* a tool for adults who already write real messages in Hebrew

It should not feel like:

* a school worksheet site
* a flashcard clone
* a mobile game in educational cosplay
* a generic SaaS dashboard

---

## 4. Problem statement

A learner who already writes practical Hebrew often gets corrected in chats, messages, and daily writing. Those corrections are useful in the moment but usually disappear into history. The learner repeats the same patterns because:

* mistakes are not stored systematically
* corrections are not grouped into reusable patterns
* there is no personal review loop
* ordinary language apps do not target the learner’s actual failure modes
* passive recognition does not force productive recall

The result is recurring frustration:

* “I know this correction already”
* “I keep making the same type of mistake”
* “I want practice on my Hebrew, not generic Hebrew”

This product solves that by turning the user’s own correction history into a structured, active, recurring practice system.

---

## 5. Users

## Primary user

Adult Hebrew learner with real-world writing needs

### Characteristics

* already writes Hebrew messages, admin notes, practical replies
* gets occasional corrections from people or from ChatGPT
* wants to sound more natural and make fewer repeated mistakes
* is comfortable with reflective, deliberate learning
* likely values subtle analytics and personalization

## Secondary user

Advanced learner or heritage learner who wants to fix persistent writing errors and register mismatches.

---

## 6. Use cases

### Core use cases

1. Import a batch of corrected Hebrew examples from past chats
2. Review parsed mistakes before saving them
3. Start a short practice session
4. Type Hebrew responses
5. See what changed and why
6. Discover recurring mistake families
7. Revisit weak areas later

### Example real-life contexts

* casual WhatsApp responses
* scheduling messages
* semi-formal appointment messages
* asking for help
* replies to acquaintances
* short administrative notes
* sentence-level grammar repairs

---

## 7. User stories

### Import and organization

* As a user, I want to paste prior corrections so I can build my mistake bank quickly.
* As a user, I want to review parsed entries before saving so that bad extraction does not poison my data.
* As a user, I want mistakes grouped by category so I can understand my patterns.

### Practice

* As a user, I want short sessions based on my weak areas so that practice is relevant.
* As a user, I want to type answers in Hebrew so that I practice production, not recognition.
* As a user, I want targeted feedback so I know what exactly changed.

### Review and insight

* As a user, I want to see which mistakes keep relapsing so I can focus on them.
* As a user, I want to see which categories are improving so I can trust the process.
* As a user, I want to revisit stored mistakes directly so I can inspect my history.

### Local-first and control

* As a user, I want the app to work without a backend so it is easy to host and private by default.
* As a user, I want to export my data so I can back it up or move it later.
* As a user, I want LLM features to be optional so the app still works if I do not configure them.

---

## 8. Non-functional requirements

### Performance

* app should load quickly from static hosting
* practice interactions should feel immediate
* IndexedDB operations should not block the UI

### Reliability

* user data must persist across browser restarts
* imports should not destroy existing data accidentally
* failed grading or parsing must not lose session state

### Privacy

* default mode keeps all data local in browser
* if LLM is enabled, user should know what text is being sent out

### Accessibility

* keyboard-friendly
* strong focus states
* readable typography
* good contrast
* clean RTL support

---

## 9. Scope

## MVP in scope

* static frontend app
* IndexedDB persistence
* import corrections
* mistake bank
* practice sessions
* rule-based exercise generation
* structured grading
* review / insights
* export/import JSON
* optional LLM enhancement hooks

## Out of scope

* login
* cloud sync
* multi-user support
* native mobile app
* voice/audio
* collaborative learning
* public sharing

---

## 10. Success criteria

The MVP is successful if a user can:

1. import at least 20 real correction examples
2. save them into a structured mistake bank
3. complete a practice session of 5 to 10 items
4. receive useful correction feedback after each answer
5. return later and continue with persisted progress
6. view relapse and mastery trends
7. feel that the exercises reflect their own real writing mistakes

---

## 11. Core product flows

## Flow 1: Import corrections

1. User navigates to Import
2. Pastes raw correction text
3. App parses candidate entries
4. User reviews, edits, and accepts entries
5. User saves accepted entries
6. New MistakeEntries appear in mistake bank

## Flow 2: Start and complete a session

1. User navigates to Practice
2. App selects due / weak / relapsed mistakes
3. App creates a session and shows first exercise
4. User types answer
5. App grades answer
6. App updates feedback panel
7. User continues
8. App saves attempt history
9. Session completes
10. Summary shown

## Flow 3: Review progress

1. User navigates to Insights
2. App displays relapse patterns, mastery curves, weak categories
3. User drills into a weak category or returns to practice

## Flow 4: Inspect mistake bank

1. User navigates to Mistakes
2. Filters entries
3. Opens detail view
4. Reviews original, corrected, tags, history, related examples

---

## 12. Problem example catalogue

This section is critical. The app should not be designed around abstract grammar labels alone. It needs concrete patterns.

## Category A: Common word spelling

### Example 1

* Wrong: מא איתך?
* Correct: מה איתך?
* Pattern: common interrogative spelling
* Focus tokens: מה
* Adjacent tokens: מה נשמע, מה קורה, מה שלומך

### Example 2

* Wrong: העיכר
* Correct: העיקר
* Pattern: common word spelling

### Example 3

* Wrong: לגיע
* Correct: להגיע
* Pattern: infinitive / common verb spelling

---

## Category B: Missing connector or structural glue

### Example 1

* Wrong: למרות גם חצי צעד אחורה
* Correct: למרות שלפעמים גם חצי צעד אחורה
* Pattern: connector omission / clause support
* Focus tokens: למרות, שלפעמים

### Example 2

* Wrong: אני חושב הוא יגיע
* Correct: אני חושב שהוא יגיע
* Pattern: missing ש־ connector

---

## Category C: Time expression / number / gender

### Example 1

* Wrong: אתה יכול להגיע לפני אחד?
* Correct: אתה יכול להגיע לפני אחת?
* Pattern: time expression gender
* Focus tokens: אחת

### Example 2

* Wrong: בשעה אחד
* Correct: בשעה אחת
* Pattern: fixed time expression form

---

## Category D: Direct translation from English

### Example 1

* Source idea: Don’t go out of your way
* Bad literal Hebrew: אל תלך מחוץ לדרך שלך
* Correct natural Hebrew: אל תטרח במיוחד
* Pattern: direct translation / idiomatic mismatch

### Example 2

* Source idea: grab a beer
* Over-literal Hebrew: ניקח בירה
* Better natural forms: נקפוץ לבירה / ניפגש לבירה
* Pattern: non-native collocation

---

## Category E: Context word choice

### Example 1

* Wrong: תודה שארגנת שקתרין תבוא להסתובב בבר־אילן
* Correct: תודה שארגנת שקתרין תבוא לשבת במשרד בבר־אילן
* Pattern: scene-inappropriate verb
* Focus contrast: להסתובב vs לשבת במשרד

### Example 2

* Wrong: אני פה אם אתם עדיין בסביבה
* Better: אני פה אם אתם עדיין באזור
* Pattern: context and natural phrasing

---

## Category F: Register mismatch

### Example 1

* Formal: בהתאם לכך, הייתי רוצה לחדש את תהליך...
* Less formal: לכן אני רוצה להמשיך את התהליך...
* Pattern: register tuning

### Example 2

* Prompt: rewrite this to sound less formal
* Pattern: tone shift exercise

---

## Category G: Numeral + noun structure

### Example 1

* Wrong: אכלתי תפוח אתמול
* Better for targeted exercise: אכלתי תפוח אחד אתמול
* Pattern: explicit count after object
* Related examples:

  * היא קנתה שני ספרים
  * הוא אכל שלושה תפוחים

This category needs care because Hebrew numeral systems are a glorious chaos beast. The app should stay narrow and concrete at first.

---

## 13. Functional requirements by module

# 13.1 Import module

## Requirements

* accept raw pasted text
* parse candidate correction pairs
* support at least one stable structured format
* support heuristic extraction from correction conversation text
* let user edit each candidate before save
* let user reject bad candidates
* prevent silent duplicate explosion

## Supported input formats

### Format A: explicit pair blocks

```text
Original: אתה יכול לגיע לפני אחד?
Corrected: אתה יכול להגיע לפני אחת?
```

### Format B: arrow format

```text
מא איתך? -> מה איתך?
```

### Format C: pasted chat-style transcript

Example:

```text
correct my hebrew: מא איתך?
הנה גרסה מתוקנת:
מה איתך?
```

The parser should support partial extraction here, with confidence limits.

## Output

`ImportCandidate[]`

## Acceptance criteria

* user can paste at least 10 examples and save corrected rows successfully
* user can edit parsed rows before save
* bad parse does not corrupt existing data

---

# 13.2 Mistake bank module

## Requirements

* store MistakeEntries
* list them with filters
* show detail view
* persist mastery and review metadata
* allow archive in future-ready design

## Filters

* tag
* context
* mastery band
* due now
* relapsed
* recently added

## Acceptance criteria

* imported entries appear immediately
* filters update list correctly
* detail view shows correction and history

---

# 13.3 Practice module

## Requirements

* generate short session from stored mistakes
* display one exercise at a time
* support typed Hebrew entry
* show staged feedback after submit
* update review schedule
* persist attempts

## Session lengths

* 5
* 10
* 15 items

## Supported exercise types in MVP

* fix_the_hebrew
* translate_to_hebrew
* context_response
* minimal_pair
* tone_shift

## Acceptance criteria

* session starts from stored mistake bank
* user can complete session without reload
* every answer produces structured feedback
* next item loads correctly
* session completion summary is shown

---

# 13.4 Grading module

## Requirements

* exact-match grading
* acceptable-variant grading
* token-level near-miss detection
* issue classification
* explanation synthesis
* optional derived mistake creation

## Acceptance criteria

* correct answers score correctly
* minor punctuation in balanced mode does not falsely fail good answers
* clearly wrong answers get localized feedback
* new mistakes can be captured from attempts when enabled

---

# 13.5 Review / insights module

## Requirements

* show relapse chart
* show mastery trend
* show weak categories
* show summary counts
* derive insights from attempts and mistake metadata

## Acceptance criteria

* insights screen updates after sessions
* categories with more failures are surfaced
* relapses are counted correctly

---

# 13.6 Export/import data module

## Requirements

* export all app data as JSON
* import prior exported JSON
* version exported format
* validate before import

## Acceptance criteria

* user can back up and restore data
* invalid import is rejected safely

---

## 14. LLM integration specification

This matters because vague “AI support” tends to become a pit of mush.

The LLM must be optional and sharply bounded.

## 14.1 LLM roles

### Role A: Parse imported corrections

Turn pasted text into structured candidates.

### Role B: Enrich mistake entries

Infer:

* tags
* focus tokens
* adjacent tokens
* context
* register
* short rule note

### Role C: Generate exercises

Given a mistake entry, generate:

* prompt
* target answer
* acceptable variants
* reminders
* related examples

### Role D: Grade borderline answers

Judge whether a response is acceptable when rule-based grading is inconclusive.

### Role E: Generate adjacent practice

Produce nearby phrases or structurally related items.

---

## 14.2 LLM operating modes

### Mode 1: disabled

No LLM usage. App works entirely with rule-based behavior.

### Mode 2: assistive

Rule-based by default. LLM used only for:

* import parsing
* adjacent example generation
* borderline grading

### Mode 3: enhanced

LLM can also generate exercises and richer explanations.

Recommendation: default to Mode 1 or 2.

---

## 14.3 LLM provider assumptions

For MVP:

* OpenAI-compatible provider
* API key entered by user and stored locally if they choose

No shared server key in MVP.

---

## 14.4 LLM interface contract

Create a provider-agnostic client:

```ts
interface LlmClient {
  parseCorrections(input: ParseCorrectionsInput): Promise<ParseCorrectionsOutput>;
  enrichMistake(input: EnrichMistakeInput): Promise<EnrichMistakeOutput>;
  generateExercises(input: GenerateExercisesInput): Promise<GenerateExercisesOutput>;
  gradeAnswer(input: GradeWithLlmInput): Promise<GradeWithLlmOutput>;
}
```

---

## 14.5 LLM prompt requirements

### Hard requirements

* JSON-only outputs where structured output is expected
* no markdown wrappers
* no prose outside schema
* no invented certainty
* must reflect uncertainty explicitly
* must preserve Hebrew exactly where possible
* must not “correct” user data beyond requested task

### Safety constraints

* do not expose private data unless user enabled LLM
* surface what content is sent out
* allow user to disable LLM fully

---

## 14.6 LLM parsing spec

### Input

```ts
type ParseCorrectionsInput = {
  rawText: string;
  locale: "he";
};
```

### Output

```ts
type ParseCorrectionsOutput = {
  candidates: {
    sourceText?: string;
    correctedText: string;
    wrongFragments?: string[];
    rightFragments?: string[];
    tags?: MistakeTag[];
    contexts?: ContextTag[];
    register?: Register;
    ruleNote?: string;
    confidence: number;
  }[];
};
```

### Behavior

* detect wrong/corrected pairs
* infer likely fragments if possible
* guess tags conservatively
* emit confidence per candidate
* do not discard ambiguous candidates; return low confidence instead

### Prompt skeleton

System prompt:

* You extract Hebrew correction pairs into structured data.
* Return JSON only.
* Preserve Hebrew text exactly.
* When unsure, use low confidence instead of inventing detail.

---

## 14.7 LLM enrichment spec

### Input

```ts
type EnrichMistakeInput = {
  sourceText?: string;
  correctedText: string;
  existingTags?: MistakeTag[];
};
```

### Output

```ts
type EnrichMistakeOutput = {
  focusTokens: string[];
  adjacentTokens: string[];
  tags: MistakeTag[];
  contexts: ContextTag[];
  register: Register;
  ruleNote?: string;
};
```

### Behavior

* identify the central learning target
* suggest adjacent forms worth drilling
* classify context and register
* keep rule note brief and local

---

## 14.8 LLM exercise generation spec

### Input

```ts
type GenerateExercisesInput = {
  mistakes: MistakeEntry[];
  types: ExerciseType[];
  count: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  constraints?: {
    preferRealisticMessaging: boolean;
    preferShortAnswers: boolean;
  };
};
```

### Output

```ts
type GenerateExercisesOutput = {
  exercises: {
    type: ExerciseType;
    prompt: string;
    subPrompt?: string;
    hint?: string;
    targetAnswer: string;
    acceptableAnswers: string[];
    explanation?: string;
    reminders?: string[];
    relatedExamples?: string[];
    sourceMistakeIds: string[];
    difficulty: 1 | 2 | 3 | 4 | 5;
  }[];
};
```

### Hard constraints

* exercises must require typed Hebrew output
* must focus on the user’s real mistake patterns
* avoid generic textbook fluff
* explanations must be concise
* use realistic messaging or sentence contexts

---

## 14.9 LLM grading spec

### When to use

Only if rule-based grader returns uncertain result.

### Input

```ts
type GradeWithLlmInput = {
  prompt: string;
  targetAnswer: string;
  acceptableAnswers: string[];
  userAnswer: string;
  sourceMistake?: {
    tags: MistakeTag[];
    focusTokens: string[];
    ruleNote?: string;
  };
};
```

### Output

```ts
type GradeWithLlmOutput = {
  isCorrect: boolean;
  score: number;
  issues: {
    code: string;
    message: string;
    expectedFragment?: string;
    actualFragment?: string;
  }[];
  feedbackSummary: string;
  correctedAnswer: string;
  shouldCreateDerivedMistake: boolean;
  derivedMistake?: {
    sourceText?: string;
    correctedText: string;
    tags?: MistakeTag[];
    wrongFragments?: string[];
    rightFragments?: string[];
    focusTokens?: string[];
    adjacentTokens?: string[];
  };
};
```

### Constraints

* be tolerant of natural variants
* be strict about the targeted pattern
* do not overcorrect stylistic alternatives unless the prompt explicitly targets style
* return concise issue descriptions

---

## 15. Rule-based behavior specification

Even with LLM support, the app must have a strong rule-based backbone.

# 15.1 Rule-based exercise generation

### If sourceText exists and correctedText exists

Generate `fix_the_hebrew`

Example:

* Prompt: תקן את המשפט
* Presented text: אתה יכול לגיע לפני אחד?
* Target: אתה יכול להגיע לפני אחת?

### If mistake tag is direct_translation or register_mismatch

Generate `context_response` or `tone_shift`

Example:

* Prompt: כתוב את זה בעברית טבעית יותר: “don’t go out of your way”
* Target: אל תטרח במיוחד

### If mistake tag is time_expression or gender_number

Generate `minimal_pair`

Example:

* Prompt: בחר את הצורה הנכונה והקלד את המשפט המלא
* Variants: לפני אחד / לפני אחת

### If context is casual_text

Generate short WhatsApp-style prompt

---

# 15.2 Rule-based grading

### Step 1: normalize

* trim
* collapse spaces
* normalize punctuation spacing
* optionally ignore final period in balanced mode

### Step 2: exact match

If normalized answer equals target → score 1.0

### Step 3: acceptable variants

If in acceptableAnswers → score 0.95

### Step 4: token comparison

Find:

* missing token
* extra token
* substitution
* focus token mismatch

### Step 5: classify issue

Map mismatch to issue types:

* spelling_error
* wrong_fragment
* missing_fragment
* structure_error
* register_mismatch
* near_miss

### Step 6: generate feedback

Feedback template:

* what was wrong
* corrected answer
* one-line pattern reminder

---

## 16. File structure

Use a structure that is explicit enough for implementation and not baroque.

```text
src/
  app/
    App.tsx
    routes.tsx
    providers.tsx

  domain/
    models/
      mistake.ts
      exercise.ts
      attempt.ts
      session.ts
      settings.ts
    services/
      mistake-extraction-service.ts
      exercise-generation-service.ts
      grading-service.ts
      spaced-repetition-service.ts
      insights-service.ts
    utils/
      hebrew-normalize.ts
      token-diff.ts
      ids.ts
      dates.ts

  features/
    practice/
      pages/PracticePage.tsx
      components/
        SessionHeader.tsx
        ExercisePrompt.tsx
        ResponseEditor.tsx
        ActionBar.tsx
        FeedbackPanel.tsx
        ProgressFooter.tsx
      state/
        practice-store.ts
      hooks/
        usePracticeSession.ts

    import/
      pages/ImportPage.tsx
      components/
        PasteBox.tsx
        CandidateTable.tsx
        ImportActions.tsx
      state/
        import-store.ts

    insights/
      pages/InsightsPage.tsx
      components/
        MetricCard.tsx
        RelapseChartCard.tsx
        MasteryChartCard.tsx
        WeakAreasCard.tsx

    mistakes/
      pages/MistakeBankPage.tsx
      components/
        MistakeFiltersBar.tsx
        MistakeList.tsx
        MistakeCard.tsx
        MistakeDetailPanel.tsx

    settings/
      pages/SettingsPage.tsx

    export/
      export-service.ts
      import-service.ts

  storage/
    db.ts
    repositories/
      mistake-repository.ts
      exercise-repository.ts
      attempt-repository.ts
      session-repository.ts
      settings-repository.ts

  llm/
    llm-client.ts
    openai-client.ts
    prompts/
      parse-corrections.ts
      enrich-mistake.ts
      generate-exercises.ts
      grade-answer.ts
    schemas/
      parse-corrections-schema.ts
      enrich-mistake-schema.ts
      generate-exercises-schema.ts
      grade-answer-schema.ts

  ui/
    components/
      Button.tsx
      IconButton.tsx
      Chip.tsx
      EmptyState.tsx
      LoadingState.tsx
      ErrorState.tsx
    tokens/
      colors.ts
      spacing.ts
      typography.ts
```

---

## 17. Milestones

## Milestone 1: Core skeleton

Deliver:

* app shell
* routing
* IndexedDB setup
* repositories
* settings persistence

## Milestone 2: Import flow

Deliver:

* import page
* raw paste area
* parser for at least one structured format
* candidate review table
* save accepted candidates

## Milestone 3: Practice loop

Deliver:

* session generation
* practice screen
* editor
* action bar
* rule-based grading
* feedback panel
* progress updates

## Milestone 4: Insights + mistake bank

Deliver:

* mistake listing/filtering
* detail panel
* relapse + mastery view
* summary counters

## Milestone 5: Export + polish

Deliver:

* JSON export/import
* keyboard shortcuts
* state polish
* improved diff/feedback rendering

## Milestone 6: Optional LLM enhancement

Deliver:

* LLM config in settings
* parse with LLM
* enrich with LLM
* borderline grading with LLM
* optional exercise generation

---

## 18. Acceptance tests

### Import

* Given pasted source/corrected pairs, the app should produce editable candidates
* Saving accepted candidates should create MistakeEntries

### Practice

* Given stored MistakeEntries, the app should generate a session
* Submitting an answer should produce AttemptResult and visible feedback
* Completing a session should update mastery and nextReviewAt

### Insights

* After multiple attempts, relapse and weak categories should update

### Persistence

* Reloading browser should preserve mistake bank, attempts, and settings

### RTL

* Hebrew typing should display correctly
* mixed Hebrew/English UI should not collapse directionality

---

## 19. Open questions to resolve during build

### 1. What exact structured import format should be first-class?

Recommendation: explicit `Original:` / `Corrected:` pairs first.

### 2. Should the practice screen allow “revise answer” after a partial?

Recommendation: yes.

### 3. Should we create derived mistakes automatically?

Recommendation: not automatically in v1; create candidate derived mistakes only.

### 4. How strong should rule-based parsing be before LLM support?

Recommendation: enough for explicit structured formats, not heroic heuristics.

### 5. How polished should charts be in MVP?

Recommendation: simple and readable. No chart opera.

---

## 20. Final engineering thesis

Build the smallest version that truly closes the loop:

* import real mistakes
* turn them into structured entries
* generate typing practice
* grade the result
* store history
* show relapse and mastery

Do not let this become a cathedral of AI features before that loop works. The differentiator is not that an LLM exists somewhere in the wiring. The differentiator is that the app remembers the user’s specific Hebrew failure modes and turns them into recurring, focused writing practice.

That is the machine.

I can next produce one of two things:

1. a **drop-in implementation prompt** for an LLM coder to build the React/TypeScript app, or
2. a **detailed component contract and API schema pack** with exact TypeScript interfaces, event flows, and JSON schemas.

