import { useEffect, useState } from "react";
import { deriveInsights } from "../../../domain/services/insights-service";
import { attemptRepository } from "../../../storage/repositories/attempt-repository";
import { mistakeRepository } from "../../../storage/repositories/mistake-repository";

export function InsightsPage() {
  const [snapshot, setSnapshot] = useState<ReturnType<typeof deriveInsights> | null>(null);

  useEffect(() => {
    void Promise.all([mistakeRepository.list(), attemptRepository.list()]).then(
      ([mistakes, attempts]) => {
        setSnapshot(deriveInsights(mistakes, attempts, new Date().toISOString()));
      },
    );
  }, []);

  const maxWeakCategoryFailures =
    snapshot && snapshot.weakCategories.length > 0
      ? Math.max(...snapshot.weakCategories.map((category) => category.failures))
      : 1;

  return (
    <section className="page page--grid">
      <div className="page__intro">
        <p className="eyebrow type-label">Insights</p>
        <h2 className="type-heading-lg">See relapse, momentum, and weak categories</h2>
        <p className="type-body-muted">
          The analytics stay light on purpose: enough signal to focus your next
          session without turning the app into a dashboard costume.
        </p>
      </div>

      {!snapshot ? (
        <div className="surface-card">
          <p className="empty-state type-body-muted">Import mistakes and finish a session to unlock insights.</p>
        </div>
      ) : (
        <>
          <div className="metrics-grid">
            <article className="metric-card">
              <span className="metric-card__label type-label-meta">Practiced mistakes</span>
              <strong className="type-heading-md">{snapshot.totalMistakes}</strong>
            </article>
            <article className="metric-card">
              <span className="metric-card__label type-label-meta">Due now</span>
              <strong className="type-heading-md">{snapshot.dueCount}</strong>
            </article>
            <article className="metric-card">
              <span className="metric-card__label type-label-meta">Relapsed</span>
              <strong className="type-heading-md">{snapshot.relapsedCount}</strong>
            </article>
            <article className="metric-card">
              <span className="metric-card__label type-label-meta">Average mastery</span>
              <strong className="type-heading-md">{Math.round(snapshot.averageMastery * 100)}%</strong>
            </article>
          </div>

          <div className="surface-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow type-label">Weak categories</p>
                <h3 className="type-heading-md">Where failures cluster</h3>
              </div>
            </div>
            {snapshot.weakCategories.length === 0 ? (
              <p className="empty-state type-body-muted">No weak categories yet. Finish a few sessions first.</p>
            ) : (
              <div className="chart-list">
                {snapshot.weakCategories.map((category) => (
                  <div className="chart-row" key={category.tag}>
                    <span>{category.tag.replaceAll("_", " ")}</span>
                    <progress
                      aria-label={`${category.tag.replaceAll("_", " ")} failures`}
                      className="chart-row__track"
                      max={maxWeakCategoryFailures}
                      value={category.failures}
                    />
                    <strong>{category.failures}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
