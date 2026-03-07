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

  return (
    <section className="page page--grid">
      <div className="page__intro">
        <p className="eyebrow">Insights</p>
        <h2>See relapse, momentum, and weak categories</h2>
        <p>
          The analytics stay light on purpose: enough signal to focus your next
          session without turning the app into a dashboard costume.
        </p>
      </div>

      {!snapshot ? (
        <div className="surface-card">
          <p className="empty-state">Import mistakes and finish a session to unlock insights.</p>
        </div>
      ) : (
        <>
          <div className="metrics-grid">
            <article className="metric-card">
              <span className="metric-card__label">Practiced mistakes</span>
              <strong>{snapshot.totalMistakes}</strong>
            </article>
            <article className="metric-card">
              <span className="metric-card__label">Due now</span>
              <strong>{snapshot.dueCount}</strong>
            </article>
            <article className="metric-card">
              <span className="metric-card__label">Relapsed</span>
              <strong>{snapshot.relapsedCount}</strong>
            </article>
            <article className="metric-card">
              <span className="metric-card__label">Average mastery</span>
              <strong>{Math.round(snapshot.averageMastery * 100)}%</strong>
            </article>
          </div>

          <div className="surface-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Weak categories</p>
                <h3>Where failures cluster</h3>
              </div>
            </div>
            {snapshot.weakCategories.length === 0 ? (
              <p className="empty-state">No weak categories yet. Finish a few sessions first.</p>
            ) : (
              <div className="chart-list">
                {snapshot.weakCategories.map((category) => (
                  <div className="chart-row" key={category.tag}>
                    <span>{category.tag.replaceAll("_", " ")}</span>
                    <div className="chart-row__track">
                      <div
                        className="chart-row__fill"
                        style={{ width: `${Math.max(18, category.failures * 22)}px` }}
                      />
                    </div>
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
