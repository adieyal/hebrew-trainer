import type { AttemptIssue } from "../../domain/models/attempt";
import { tokenizeHebrewText } from "../../domain/utils/hebrew-normalize";
import { diffTokens } from "../../domain/utils/token-diff";

function issueTone(issue: AttemptIssue): "spelling" | "grammar" {
  if (issue.code === "spelling_error" || issue.code === "wrong_fragment") {
    return "spelling";
  }

  return "grammar";
}

function normalizeToken(token: string): string {
  return token.replace(/[.,!?]/g, "");
}

function issuesForToken(
  issues: AttemptIssue[],
  normalizedToken: string,
  fragmentType: "expectedFragment" | "actualFragment",
): AttemptIssue[] {
  return issues.filter((issue) => issue[fragmentType]?.includes(normalizedToken));
}

function renderHighlightedText(
  text: string,
  issues: AttemptIssue[],
  fragmentType: "expectedFragment" | "actualFragment",
  highlightClassName: string,
) {
  const fragments = issues.filter((issue) => issue[fragmentType]);
  const segments = text.match(/\S+|\s+/g) ?? [];

  return segments.map((segment, index) => {
    if (/\s+/.test(segment)) {
      return <span key={`space-${index}`}>{segment}</span>;
    }

    const normalized = normalizeToken(segment);
    const matchingIssues = issuesForToken(fragments, normalized, fragmentType);

    if (matchingIssues.length === 0) {
      return <span key={`${segment}-${index}`}>{segment}</span>;
    }

    const tones = Array.from(new Set(matchingIssues.map((issue) => issueTone(issue))));
    const tooltip = matchingIssues.map((issue) => issue.message).join(" ");

    return (
      <span
        className={[
          highlightClassName,
          ...tones.map((tone) => `${highlightClassName}--${tone}`),
        ].join(" ")}
        data-tooltip={tooltip}
        key={`${segment}-${index}`}
        aria-label={tooltip}
        tabIndex={0}
        title={tooltip}
      >
        {segment}
      </span>
    );
  });
}

interface HighlightedFeedbackProps {
  correctedAnswer: string;
  issues: AttemptIssue[];
}

interface HighlightedAnswerProps {
  answer: string;
  betterAnswer: string;
  issues: AttemptIssue[];
}

function buildFallbackAnswerIssues(
  answer: string,
  betterAnswer: string,
): AttemptIssue[] {
  const answerTokens = tokenizeHebrewText(answer);
  const betterTokens = tokenizeHebrewText(betterAnswer);
  const mismatches = diffTokens(betterTokens, answerTokens);

  return mismatches.slice(0, 4).map((mismatch) => {
    if (mismatch.kind === "extra") {
      return {
        code: "near_miss",
        message: `This word does not belong here in the preferred phrasing.`,
        actualFragment: mismatch.actual,
      } satisfies AttemptIssue;
    }

    if (mismatch.kind === "missing") {
      return {
        code: "missing_fragment",
        message: `The preferred phrasing includes "${mismatch.expected}".`,
        expectedFragment: mismatch.expected,
      } satisfies AttemptIssue;
    }

    return {
      code: "wrong_fragment",
      message: `Consider "${mismatch.expected}" instead of "${mismatch.actual}".`,
      expectedFragment: mismatch.expected,
      actualFragment: mismatch.actual,
    } satisfies AttemptIssue;
  });
}

export function HighlightedAnswer({
  answer,
  betterAnswer,
  issues,
}: HighlightedAnswerProps) {
  const fragments = issues.filter((issue) => issue.actualFragment);
  const effectiveIssues =
    fragments.length > 0 ? issues : buildFallbackAnswerIssues(answer, betterAnswer);

  if (effectiveIssues.length === 0) {
    return (
      <p className="hebrew-text hebrew-text--feedback teaching-panel__hebrew" dir="rtl">
        {answer}
      </p>
    );
  }

  return (
    <p className="hebrew-text hebrew-text--feedback teaching-panel__hebrew" dir="rtl">
      {renderHighlightedText(answer, effectiveIssues, "actualFragment", "teaching-highlight")}
    </p>
  );
}

export function HighlightedFeedback({
  correctedAnswer,
  issues,
}: HighlightedFeedbackProps) {
  const fragments = issues.filter((issue) => issue.expectedFragment);

  if (fragments.length === 0) {
    return (
      <p className="hebrew-text hebrew-text--feedback" dir="rtl">
        {correctedAnswer}
      </p>
    );
  }

  return (
    <div className="feedback-annotation-group">
      <p className="hebrew-text hebrew-text--feedback" dir="rtl">
        {renderHighlightedText(correctedAnswer, issues, "expectedFragment", "feedback-highlight")}
      </p>
      <div className="feedback-issue-list">
        {issues.map((issue, index) => (
          <div className="feedback-issue" key={`${issue.code}-${index}`}>
            <span
              className={`feedback-issue__dot feedback-issue__dot--${issueTone(issue)}`}
            />
            <p>{issue.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
