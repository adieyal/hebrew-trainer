import { useEffect, useMemo, useState } from "react";
import type { MistakeEntry } from "../../../domain/models/mistake";
import { mistakeRepository } from "../../../storage/repositories/mistake-repository";

export function GeneratedDrillsPage() {
  const [drills, setDrills] = useState<MistakeEntry[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>();

  useEffect(() => {
    void mistakeRepository.list().then((items) => {
      const generatedDrills = items.filter((item) => item.derivedFrom);
      setDrills(generatedDrills);
      if (generatedDrills[0]) {
        setSelectedId(generatedDrills[0].id);
      }
    });
  }, []);

  const filteredDrills = useMemo(() => {
    return drills.filter((drill) => {
      const haystack = [
        drill.englishPrompt,
        drill.primaryTranslation,
        drill.correctedText,
        drill.ruleNote,
        drill.derivedFrom?.actualFragment,
        drill.derivedFrom?.expectedFragment,
        drill.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return !search || haystack.includes(search.toLowerCase());
    });
  }, [drills, search]);

  const selectedDrill = filteredDrills.find((drill) => drill.id === selectedId);

  return (
    <section className="page page--stack">
      <div className="page__intro">
        <p className="eyebrow">Generated drills</p>
        <h2>Future practice from your mistakes</h2>
        <p>
          These read-only English and Hebrew drills were generated automatically
          from mistake patterns the reviewer identified during practice.
        </p>
      </div>

      <section className="surface-card">
        <div className="filters-row">
          <input
            className="text-input"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by prompt, Hebrew, or construction"
            value={search}
          />
        </div>
      </section>

      <div className="two-column-grid">
        <section className="surface-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Entries</p>
              <h3>{filteredDrills.length} generated drills</h3>
            </div>
          </div>
          {filteredDrills.length === 0 ? (
            <p className="empty-state">No generated drills match the current search.</p>
          ) : (
            <div className="candidate-list">
              {filteredDrills.map((drill) => (
                <button
                  className={
                    drill.id === selectedId
                      ? "candidate-card candidate-card--selected"
                      : "candidate-card"
                  }
                  key={drill.id}
                  onClick={() => setSelectedId(drill.id)}
                  type="button"
                >
                  <div className="candidate-card__header">
                    <strong>{drill.stats.masteryBand}</strong>
                    <span className="pill">{drill.tags.join(", ")}</span>
                  </div>
                  <p className="mistake-snippet" dir="auto">
                    {drill.englishPrompt ?? "Generated practice prompt"}
                  </p>
                  <p className="mistake-snippet mistake-snippet--strong" dir="rtl">
                    {drill.primaryTranslation ?? drill.correctedText}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="surface-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Detail</p>
              <h3>Drill detail</h3>
            </div>
          </div>
          {selectedDrill ? (
            <dl className="detail-grid">
              <div>
                <dt>English prompt</dt>
                <dd dir="auto">{selectedDrill.englishPrompt ?? "Not captured"}</dd>
              </div>
              <div>
                <dt>Primary translation</dt>
                <dd dir="rtl">
                  {selectedDrill.primaryTranslation ?? selectedDrill.correctedText}
                </dd>
              </div>
              <div>
                <dt>Acceptable variants</dt>
                <dd dir="rtl">
                  {(selectedDrill.acceptableTranslations ?? [selectedDrill.correctedText]).join(
                    " / ",
                  )}
                </dd>
              </div>
              <div>
                <dt>From issue</dt>
                <dd>{selectedDrill.tags.join(", ")}</dd>
              </div>
              <div>
                <dt>You wrote</dt>
                <dd dir="rtl">{selectedDrill.derivedFrom?.actualFragment ?? "Not captured"}</dd>
              </div>
              <div>
                <dt>Target construction</dt>
                <dd dir="rtl">
                  {selectedDrill.derivedFrom?.expectedFragment ?? "Not captured"}
                </dd>
              </div>
              <div>
                <dt>Rule note</dt>
                <dd>{selectedDrill.ruleNote ?? "No note yet"}</dd>
              </div>
            </dl>
          ) : (
            <p className="empty-state">
              Select a generated drill to inspect its prompt, Hebrew reference, and source construction.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
