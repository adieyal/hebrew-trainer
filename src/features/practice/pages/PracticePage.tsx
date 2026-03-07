import { useEffect, useMemo, useState } from "react";
import type { Attempt } from "../../../domain/models/attempt";
import type { Exercise } from "../../../domain/models/exercise";
import type { MistakeEntry } from "../../../domain/models/mistake";
import type { PracticeSession } from "../../../domain/models/session";
import type { AppSettings } from "../../../domain/models/settings";
import { selectPracticeMistakes } from "../../../domain/services/adaptive-practice-service";
import { gradeExerciseAnswer } from "../../../domain/services/grading-service";
import { createMistakeEntryFromGeneratedPracticeItem } from "../../../domain/services/mistake-entry-factory";
import { createDefaultSettings } from "../../../domain/services/settings-service";
import { applyAttemptToMistake } from "../../../domain/services/spaced-repetition-service";
import { createOpenAiCompatibleClient } from "../../../llm/openai-client";
import {
  containsHebrewScript,
  normalizeHebrewText,
} from "../../../domain/utils/hebrew-normalize";
import { createId } from "../../../domain/utils/ids";
import { attemptRepository } from "../../../storage/repositories/attempt-repository";
import { mistakeRepository } from "../../../storage/repositories/mistake-repository";
import { sessionRepository } from "../../../storage/repositories/session-repository";
import { settingsRepository } from "../../../storage/repositories/settings-repository";
import { HighlightedAnswer, HighlightedFeedback } from "../feedback-highlighting";
import { buildPracticeExercises } from "../practice-variation-service";

type PracticeViewState = "answering" | "reviewed" | "revising";

function hasBetterPhrasingDelta(attempt: Attempt | null): boolean {
  if (!attempt) {
    return false;
  }

  return (
    normalizeHebrewText(attempt.userAnswer, {
      ignoreTerminalPeriod: true,
    }) !==
    normalizeHebrewText(attempt.result.correctedAnswer, {
      ignoreTerminalPeriod: true,
    })
  );
}

function buildVerdictLabel(attempt: Attempt | null): string {
  if (!attempt) {
    return "";
  }

  if (attempt.result.isCorrect) {
    return "Strong";
  }

  if (attempt.result.score >= 0.65 || attempt.result.semanticAccepted) {
    return "Almost there";
  }

  return "Needs another pass";
}

function buildMainFix(attempt: Attempt | null): string {
  if (!attempt) {
    return "";
  }

  const firstAnalysis = attempt.result.mistakeAnalyses[0];
  if (firstAnalysis) {
    return firstAnalysis.shortExplanation;
  }

  if (attempt.result.teaching?.why) {
    return attempt.result.teaching.why;
  }

  return attempt.result.issues[0]?.message ?? attempt.result.feedbackSummary;
}

export function PracticePage() {
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [answer, setAnswer] = useState("");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [viewState, setViewState] = useState<PracticeViewState>("answering");
  const [isStarting, setIsStarting] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    void Promise.all([mistakeRepository.list(), settingsRepository.get()]).then(
      async ([storedMistakes, storedSettings]) => {
        setMistakes(storedMistakes);

        const settings = storedSettings ?? createDefaultSettings(new Date().toISOString());
        if (!storedSettings) {
          await settingsRepository.save(settings);
        }

        setSettings(settings);
        if (storedMistakes.length > 0) {
          await startSession(storedMistakes, settings.defaultSessionLength);
        }
        setIsStarting(false);
      },
    );
  }, []);

  const currentExercise = session ? exercises[session.currentIndex] : undefined;
  const promptCopy = currentExercise?.presentedText ?? currentExercise?.prompt ?? "";
  const promptClassName = containsHebrewScript(promptCopy)
    ? "practice-prompt__text type-hebrew-training-lg"
    : "practice-prompt__text type-heading-lg";
  const completedCount = useMemo(() => {
    if (!session) {
      return 0;
    }

    return attempt ? session.currentIndex + 1 : session.currentIndex;
  }, [attempt, session]);
  async function startSession(sourceMistakes: MistakeEntry[], size: 5 | 10 | 15) {
    const activeSettings = settings ?? createDefaultSettings(new Date().toISOString());
    const pool = selectPracticeMistakes(
      sourceMistakes,
      Math.min(size, sourceMistakes.length),
      new Date().toISOString(),
    );
    const nextExercises = await buildPracticeExercises(
      pool,
      Math.min(size, pool.length),
      activeSettings,
    );
    const nextSession: PracticeSession = {
      id: createId("session"),
      createdAt: new Date().toISOString(),
      requestedSize: size,
      exerciseIds: nextExercises.map((exercise) => exercise.id),
      currentIndex: 0,
    };

    setSession(nextSession);
    setExercises(nextExercises);
    setAnswer("");
    setAttempt(null);
    setViewState("answering");
    await sessionRepository.save(nextSession);
  }

  const handleSubmit = async () => {
    if (!session || !currentExercise || !settings) {
      return;
    }

    setIsEvaluating(true);
    const llmClient =
      settings.gradingStrategy !== "rule_based_only" && settings.llm.apiKey
        ? createOpenAiCompatibleClient({
            apiKey: settings.llm.apiKey,
            baseUrl: settings.llm.baseUrl ?? "https://api.openai.com/v1",
            model: settings.llm.model ?? "gpt-5-mini",
          })
        : undefined;
    const result = await gradeExerciseAnswer(currentExercise, answer, {
      gradingMode: settings.gradingMode,
      gradingStrategy: settings.gradingStrategy,
      llmClient,
    });
    const nextAttempt: Attempt = {
      id: createId("attempt"),
      sessionId: session.id,
      exerciseId: currentExercise.id,
      mistakeIds: currentExercise.sourceMistakeIds,
      userAnswer: answer,
      submittedAt: new Date().toISOString(),
      result,
    };

    const generatedMistakes: MistakeEntry[] = [];
    for (const analysis of result.mistakeAnalyses) {
      for (const practiceItem of analysis.practiceItems) {
        if (
          !practiceItem.englishPrompt?.trim() ||
          !practiceItem.primaryTranslation?.trim()
        ) {
          continue;
        }

        const existing = await mistakeRepository.findByPromptAndTranslation(
          practiceItem.englishPrompt,
          practiceItem.primaryTranslation,
        );

        if (existing) {
          continue;
        }

        generatedMistakes.push(
          createMistakeEntryFromGeneratedPracticeItem(
            analysis,
            practiceItem,
            nextAttempt.submittedAt,
            {
              attemptId: nextAttempt.id,
              exerciseId: currentExercise.id,
            },
          ),
        );
      }
    }

    const updatedMistakes = mistakes.map((mistake) =>
      nextAttempt.mistakeIds.includes(mistake.id)
        ? applyAttemptToMistake(mistake, result, nextAttempt.submittedAt)
        : mistake,
    );
    const allKnownMistakes = [...generatedMistakes, ...updatedMistakes];

    setMistakes(allKnownMistakes);
    setAttempt(nextAttempt);
    setViewState("reviewed");
    setIsEvaluating(false);
    await Promise.all([
      attemptRepository.save(nextAttempt),
      mistakeRepository.bulkUpsert(
        [
          ...updatedMistakes.filter((mistake) => nextAttempt.mistakeIds.includes(mistake.id)),
          ...generatedMistakes,
        ],
      ),
    ]);
  };

  const handleContinue = async () => {
    if (!session) {
      return;
    }

    const isLast = session.currentIndex >= exercises.length - 1;
    const nextSession: PracticeSession = {
      ...session,
      currentIndex: isLast ? session.currentIndex : session.currentIndex + 1,
      completedAt: isLast ? new Date().toISOString() : undefined,
    };

    setSession(nextSession);
    setAnswer("");
    setAttempt(null);
    setViewState("answering");
    setIsEvaluating(false);
    await sessionRepository.save(nextSession);
  };

  const handleSkip = async () => {
    await handleContinue();
  };

  const handleTryAgain = () => {
    if (!attempt) {
      return;
    }

    setAnswer(attempt.userAnswer);
    setViewState("revising");
  };

  const handleCancelRevision = () => {
    if (!attempt) {
      return;
    }

    setAnswer(attempt.userAnswer);
    setViewState("reviewed");
  };

  const completedLabel = session
    ? `${completedCount} of ${exercises.length} today`
    : "0 of 0 today";
  const focusLabel = currentExercise?.focusTokens[0]
    ? `Focus: ${currentExercise.focusTokens[0]}`
    : "Focus: natural phrasing";
  const verdictLabel = buildVerdictLabel(attempt);
  const mainFix = buildMainFix(attempt);
  const isLocked = viewState === "reviewed" || isEvaluating;
  const showsBetterPhrasing = hasBetterPhrasingDelta(attempt);

  return (
    <section className="practice-page">
      <header className="practice-session-header">
        <p className="eyebrow type-label">Practice</p>
        <h2 className="practice-session-header__title type-heading-lg">Focused writing session</h2>
        <p className="practice-session-header__meta type-body-muted">
          {session ? `${session.currentIndex + 1} of ${exercises.length} today` : "0 of 0 today"}
          <span aria-hidden="true"> · </span>
          {focusLabel}
        </p>
        {session ? (
          <progress
            aria-hidden="true"
            className="practice-progress"
            max={exercises.length}
            value={session.currentIndex + 1}
          />
        ) : null}
      </header>

      {isStarting ? <p className="status-text type-body-muted">Preparing your session...</p> : null}

      {!isStarting && mistakes.length === 0 ? (
        <section className="surface-card">
          <p className="empty-state type-body-muted">
            Import a few corrected examples first so the app has real patterns to practice.
          </p>
        </section>
      ) : null}

      {session && currentExercise ? (
        <section className="practice-session-surface">
          <div className="practice-prompt">
            <p className="eyebrow type-label">Translate to natural Hebrew</p>
            {currentExercise.presentedText ? (
              <p className={promptClassName} dir="auto">
                {currentExercise.presentedText}
              </p>
            ) : (
              <p className={promptClassName} dir="auto">
                {currentExercise.prompt}
              </p>
            )}
          </div>

          <div className="practice-answer-section">
            <label className="field-label type-label-field practice-answer-section__label" htmlFor="practice-answer">
              Type in Hebrew
            </label>
            {viewState === "revising" && attempt ? (
              <div className="practice-prior-attempt">
                <p className="practice-prior-attempt__label type-label-meta">Prior attempt</p>
                <p className="hebrew-text type-hebrew-training" dir="rtl">{attempt.userAnswer}</p>
              </div>
            ) : null}
            <textarea
              className="text-input text-input--multiline text-input--hebrew practice-answer type-hebrew-training"
              dir="rtl"
              disabled={isLocked}
              id="practice-answer"
              onChange={(event) => setAnswer(event.target.value)}
              rows={3}
              value={answer}
            />
          </div>

          <div className="practice-action-row">
            {viewState === "answering" ? (
              <>
                <button className="button button--ghost" onClick={() => void handleSkip()} type="button">
                  Skip
                </button>
                <button
                  className="button"
                  disabled={answer.trim().length === 0 || isEvaluating}
                  onClick={() => void handleSubmit()}
                  type="button"
                >
                  {isEvaluating ? "Evaluating..." : "Check answer"}
                </button>
              </>
            ) : null}
            {viewState === "reviewed" ? (
              <>
                <button className="button button--ghost" onClick={handleTryAgain} type="button">
                  Try again
                </button>
                <button className="button" onClick={() => void handleContinue()} type="button">
                  Continue
                </button>
              </>
            ) : null}
            {viewState === "revising" ? (
              <>
                <button className="button button--ghost" onClick={handleCancelRevision} type="button">
                  Cancel revision
                </button>
                <button
                  className="button"
                  disabled={answer.trim().length === 0 || isEvaluating}
                  onClick={() => void handleSubmit()}
                  type="button"
                >
                  {isEvaluating ? "Evaluating..." : "Check revised answer"}
                </button>
              </>
            ) : null}
          </div>
          {isEvaluating ? (
            <p className="status-text type-body-muted status-text--active">Evaluating with LLM...</p>
          ) : null}

          {attempt ? (
            <section className="practice-feedback">
              <div className="practice-feedback__verdict-row">
                <p className="practice-feedback__verdict type-heading-md">{verdictLabel}</p>
              </div>
              {showsBetterPhrasing ? (
                <div>
                  <p className="practice-feedback__label type-label">Better phrasing</p>
                  <HighlightedFeedback
                    correctedAnswer={attempt.result.correctedAnswer}
                    issues={attempt.result.issues}
                  />
                </div>
              ) : null}
              <div>
                <p className="practice-feedback__label type-label">Main fix</p>
                <p className="practice-feedback__copy type-body">{mainFix}</p>
              </div>
              {showsBetterPhrasing ? (
                <div className="practice-comparison">
                  <div>
                    <p className="practice-feedback__label type-label">You wrote</p>
                    <HighlightedAnswer
                      answer={attempt.userAnswer}
                      betterAnswer={attempt.result.correctedAnswer}
                      issues={attempt.result.issues}
                    />
                  </div>
                  <div>
                    <p className="practice-feedback__label type-label">Better phrasing</p>
                    <p className="hebrew-text hebrew-text--feedback type-hebrew-training" dir="rtl">
                      {attempt.result.correctedAnswer}
                    </p>
                  </div>
                </div>
              ) : null}
              {attempt.result.mistakeAnalyses.length > 0 ? (
                <div className="practice-mistake-list">
                  {attempt.result.mistakeAnalyses.map((analysis, index) => (
                    <article className="practice-mistake-card" key={`${analysis.expectedFragment}-${index}`}>
                      <p className="practice-feedback__label type-label">Detected issue</p>
                      <p className="practice-feedback__copy type-body">
                        <strong>{analysis.expectedFragment}</strong> instead of{" "}
                        <strong>{analysis.actualFragment}</strong>
                      </p>
                      <p className="practice-feedback__copy type-body">{analysis.shortExplanation}</p>
                      <p className="practice-feedback__copy type-body-muted">
                        Added {analysis.practiceItems.length} future practice{" "}
                        {analysis.practiceItems.length === 1 ? "prompt" : "prompts"}.
                      </p>
                    </article>
                  ))}
                </div>
              ) : null}
              {attempt.result.teaching ? (
                <div className="teaching-panel teaching-panel--inline">
                  <div className="teaching-panel__details">
                    <div>
                      <p className="teaching-panel__label type-label">Why Hebrew prefers it</p>
                      <p className="teaching-panel__copy type-body" dir="auto">
                        {attempt.result.teaching.whyPreferred ?? attempt.result.teaching.why}
                      </p>
                    </div>
                    {attempt.result.teaching.anotherExample ? (
                      <div>
                        <p className="teaching-panel__label type-label">Another example</p>
                        <p className="hebrew-text hebrew-text--supporting teaching-panel__example type-hebrew-training">
                          {attempt.result.teaching.anotherExample}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          <footer className="practice-session-footer">
            <p className="status-text type-body-muted">Completed {completedLabel}</p>
          </footer>
          {session.completedAt ? (
            <section className="surface-card">
              <p className="eyebrow type-label">Session complete</p>
              <h3 className="type-heading-md">Your mistake bank has been updated for the next review cycle.</h3>
            </section>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
