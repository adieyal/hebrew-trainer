import { useEffect, useMemo, useState } from "react";
import type { MasteryBand, MistakeEntry } from "../../../domain/models/mistake";
import { isDue } from "../../../domain/utils/dates";
import { containsHebrewScript } from "../../../domain/utils/hebrew-normalize";
import { mistakeRepository } from "../../../storage/repositories/mistake-repository";

export function MistakeBankPage() {
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [search, setSearch] = useState("");
  const [masteryBand, setMasteryBand] = useState<"all" | MasteryBand>("all");
  const [dueOnly, setDueOnly] = useState(false);
  const [relapsedOnly, setRelapsedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();

  useEffect(() => {
    void mistakeRepository.list().then((items) => {
      const rootMistakes = items.filter((item) => !item.derivedFrom);
      setMistakes(rootMistakes);
      if (rootMistakes[0]) {
        setSelectedId(rootMistakes[0].id);
      }
    });
  }, []);

  const filteredMistakes = useMemo(() => {
    const nowIso = new Date().toISOString();
    return mistakes.filter((mistake) => {
      const haystack = `${mistake.englishPrompt ?? ""} ${mistake.primaryTranslation ?? ""} ${mistake.sourceText ?? ""} ${mistake.correctedText} ${mistake.ruleNote ?? ""}`.toLowerCase();
      if (search && !haystack.includes(search.toLowerCase())) {
        return false;
      }

      if (masteryBand !== "all" && mistake.stats.masteryBand !== masteryBand) {
        return false;
      }

      if (dueOnly && !isDue(mistake.stats.nextReviewAt, nowIso)) {
        return false;
      }

      if (relapsedOnly && mistake.stats.relapseCount === 0) {
        return false;
      }

      return true;
    });
  }, [dueOnly, masteryBand, mistakes, relapsedOnly, search]);

  const selectedMistake = filteredMistakes.find((mistake) => mistake.id === selectedId);

  return (
    <section className="page page--stack">
      <div className="page__intro">
        <p className="eyebrow type-label">Mistake Bank</p>
        <h2 className="type-heading-lg">Inspect your translation patterns</h2>
        <p className="type-body-muted">
          Filter by mastery, due status, and relapses to see which English
          prompts and Hebrew patterns still need active review.
        </p>
      </div>

      <section className="surface-card">
        <div className="filters-row">
          <input
            className="text-input"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by English prompt, Hebrew, or note"
            value={search}
          />
          <select
            className="text-input"
            onChange={(event) => setMasteryBand(event.target.value as "all" | MasteryBand)}
            value={masteryBand}
          >
            <option value="all">All mastery bands</option>
            <option value="new">New</option>
            <option value="fragile">Fragile</option>
            <option value="building">Building</option>
            <option value="solid">Solid</option>
          </select>
          <label className="checkbox-row">
            <input
              checked={dueOnly}
              onChange={(event) => setDueOnly(event.target.checked)}
              type="checkbox"
            />
            Due now
          </label>
          <label className="checkbox-row">
            <input
              checked={relapsedOnly}
              onChange={(event) => setRelapsedOnly(event.target.checked)}
              type="checkbox"
            />
            Relapsed
          </label>
        </div>
      </section>

      <div className="two-column-grid">
        <section className="surface-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow type-label">Entries</p>
              <h3 className="type-heading-md">{filteredMistakes.length} matching mistakes</h3>
            </div>
          </div>
          {filteredMistakes.length === 0 ? (
            <p className="empty-state type-body-muted">No mistakes match the current filters.</p>
          ) : (
            <div className="candidate-list">
              {filteredMistakes.map((mistake) => (
                <button
                  className={
                    mistake.id === selectedId
                      ? "candidate-card candidate-card--selected"
                      : "candidate-card"
                  }
                  key={mistake.id}
                  onClick={() => setSelectedId(mistake.id)}
                  type="button"
                >
                  <div className="candidate-card__header">
                    <strong>{mistake.stats.masteryBand}</strong>
                    <span className="pill">{mistake.tags.join(", ")}</span>
                  </div>
                  <p className="mistake-snippet" dir="auto">
                    {mistake.englishPrompt ?? mistake.sourceText ?? "Generated prompt"}
                  </p>
                  <p className="mistake-snippet type-hebrew-body type-hebrew-body-snippet" dir="rtl">
                    {mistake.primaryTranslation ?? mistake.correctedText}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="surface-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow type-label">Detail</p>
              <h3 className="type-heading-md">Translation detail</h3>
            </div>
          </div>
          {selectedMistake ? (
            <dl className="detail-grid">
              <div>
                <dt className="type-label-meta">English prompt</dt>
                <dd dir="auto">{selectedMistake.englishPrompt ?? "Not captured"}</dd>
              </div>
              <div>
                <dt className="type-label-meta">Primary translation</dt>
                <dd className="type-hebrew-body" dir="rtl">
                  {selectedMistake.primaryTranslation ?? selectedMistake.correctedText}
                </dd>
              </div>
              <div>
                <dt className="type-label-meta">Acceptable variants</dt>
                <dd className="type-hebrew-body" dir="rtl">
                  {(selectedMistake.acceptableTranslations ?? [selectedMistake.correctedText]).join(" / ")}
                </dd>
              </div>
              <div>
                <dt className="type-label-meta">Tags</dt>
                <dd>{selectedMistake.tags.join(", ")}</dd>
              </div>
              <div>
                <dt className="type-label-meta">Rule note</dt>
                <dd className={containsHebrewScript(selectedMistake.ruleNote ?? "") ? "type-hebrew-body" : undefined}>
                  {selectedMistake.ruleNote ?? "No note yet"}
                </dd>
              </div>
              <div>
                <dt className="type-label-meta">Attempts</dt>
                <dd>{selectedMistake.stats.attempts}</dd>
              </div>
              <div>
                <dt className="type-label-meta">Next review</dt>
                <dd>
                  {selectedMistake.stats.nextReviewAt
                    ? new Date(selectedMistake.stats.nextReviewAt).toLocaleString()
                    : "Ready now"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="empty-state type-body-muted">
              Select an entry to inspect the English prompt, Hebrew reference, and review history.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
