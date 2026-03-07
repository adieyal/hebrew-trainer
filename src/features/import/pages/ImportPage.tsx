import { useEffect, useState } from "react";
import type { ImportCandidate } from "../../../domain/models/mistake";
import { parseCorrections } from "../../../domain/services/mistake-extraction-service";
import { createMistakeEntryFromCandidate } from "../../../domain/services/mistake-entry-factory";
import { createDefaultSettings } from "../../../domain/services/settings-service";
import { createOpenAiCompatibleClient } from "../../../llm/openai-client";
import { mistakeRepository } from "../../../storage/repositories/mistake-repository";
import { settingsRepository } from "../../../storage/repositories/settings-repository";

export function ImportPage() {
  const [rawText, setRawText] = useState(
    "Can you get here before one?\nShe said she would call tomorrow.",
  );
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [status, setStatus] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void settingsRepository.getOrCreate(() => createDefaultSettings(new Date().toISOString()));
  }, []);

  const handleParse = () => {
    const nextCandidates = parseCorrections(rawText);
    setCandidates(nextCandidates);
    setStatus(
      nextCandidates.length > 0
        ? `Parsed ${nextCandidates.length} prompt candidate${nextCandidates.length === 1 ? "" : "s"}.`
        : "No prompt candidates found yet. Try one English sentence per line.",
    );
  };

  const handleCandidateChange = (
    index: number,
    field: "englishPrompt" | "sourceText" | "correctedText",
    value: string,
  ) => {
    setCandidates((current) =>
      current.map((candidate, candidateIndex) =>
        candidateIndex === index ? { ...candidate, [field]: value } : candidate,
      ),
    );
  };

  const handleRemove = (index: number) => {
    setCandidates((current) => current.filter((_, candidateIndex) => candidateIndex !== index));
  };

  const isPromptWaitingForGeneration = (candidate: ImportCandidate) =>
    Boolean(candidate.englishPrompt && !candidate.sourceText && !candidate.correctedText);

  const handleSave = async () => {
    const settings = await settingsRepository.getOrCreate(() =>
      createDefaultSettings(new Date().toISOString()),
    );
    if (!settings.llm.apiKey) {
      setStatus("Add an LLM API key in settings before saving English prompts.");
      return;
    }

    const client = createOpenAiCompatibleClient({
      apiKey: settings.llm.apiKey,
      baseUrl: settings.llm.baseUrl ?? "https://api.openai.com/v1",
      model: settings.llm.model ?? "gpt-5-mini",
    });
    const saveCount = candidates.length;
    const nowIso = new Date().toISOString();
    setIsSaving(true);
    try {
      const enrichedCandidates = await Promise.all(
        candidates.map(async (candidate) => {
          if (!candidate.englishPrompt) {
            return candidate;
          }

          const generated = await client.generateTranslationReference({
            englishPrompt: candidate.englishPrompt,
            register: candidate.register,
            contexts: candidate.contexts,
          });

          return {
            ...candidate,
            correctedText: generated.primaryTranslation,
            primaryTranslation: generated.primaryTranslation,
            acceptableTranslations: generated.acceptableTranslations,
            focusTokens: generated.focusTokens,
            practiceRoots: generated.practiceRoots,
            register: generated.register ?? candidate.register,
            contexts: generated.contexts ?? candidate.contexts,
            ruleNote: generated.ruleNote ?? candidate.ruleNote,
            adjacentTokens: generated.acceptableTranslations.slice(0, 4),
          };
        }),
      );
      await mistakeRepository.bulkUpsert(
        enrichedCandidates.map((candidate) => createMistakeEntryFromCandidate(candidate, nowIso)),
      );
      setStatus(`Saved ${saveCount} translation prompts to your bank.`);
      setCandidates([]);
    } catch {
      setStatus("Could not generate Hebrew references for these prompts.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="page page--grid">
      <div className="page__intro">
        <p className="eyebrow">Import</p>
        <h2>Bring in English prompts for translation practice</h2>
        <p>
          Paste English sentences, review the prompts you want to keep, and let
          the app generate Hebrew reference answers when you save.
        </p>
      </div>

      <div className="surface-card">
        <label className="field-label" htmlFor="import-raw-text">
          English prompts
        </label>
        <textarea
          className="text-input text-input--multiline"
          dir="auto"
          id="import-raw-text"
          onChange={(event) => setRawText(event.target.value)}
          rows={10}
          value={rawText}
        />
        <div className="button-row">
          <button className="button" onClick={handleParse} type="button">
            Parse prompts
          </button>
          <span className="status-text">{status}</span>
        </div>
      </div>

      <div className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Candidates</p>
            <h3>Review prompts before saving</h3>
          </div>
          <button
            className="button button--secondary"
            disabled={candidates.length === 0 || isSaving}
            onClick={() => void handleSave()}
            type="button"
          >
            {isSaving ? "Generating..." : "Generate Hebrew and save"}
          </button>
        </div>

        {candidates.length === 0 ? (
          <p className="empty-state">
            Parsed English prompts will appear here before Hebrew references are generated.
          </p>
        ) : (
          <div className="candidate-list">
            {candidates.map((candidate, index) => (
              <article className="candidate-card" key={candidate.id}>
                {(() => {
                  const promptOnly = isPromptWaitingForGeneration(candidate);
                  return (
                    <>
                <div className="candidate-card__header">
                  <strong>{promptOnly ? `Prompt ${index + 1}` : `Candidate ${index + 1}`}</strong>
                  <span className="pill">
                    {promptOnly
                      ? "Hebrew will be generated on save"
                      : `Confidence ${Math.round(candidate.confidence * 100)}%`}
                  </span>
                </div>
                <label className="field-label" htmlFor={`candidate-source-${candidate.id}`}>
                  English prompt
                </label>
                <textarea
                  className="text-input text-input--compact"
                  dir="auto"
                  id={`candidate-source-${candidate.id}`}
                  onChange={(event) =>
                    handleCandidateChange(index, "englishPrompt", event.target.value)
                  }
                  rows={2}
                  value={candidate.englishPrompt ?? ""}
                />
                {promptOnly ? (
                  <div className="import-candidate-preview">
                    <p className="field-label">Hebrew reference</p>
                    <p className="import-candidate-preview__copy">
                      A Hebrew reference answer will be generated automatically when you save this prompt.
                    </p>
                  </div>
                ) : (
                  <>
                    <label className="field-label" htmlFor={`candidate-corrected-${candidate.id}`}>
                      Hebrew reference
                    </label>
                    <textarea
                      className="text-input text-input--compact"
                      dir="rtl"
                      id={`candidate-corrected-${candidate.id}`}
                      onChange={(event) =>
                        handleCandidateChange(index, "correctedText", event.target.value)
                      }
                      rows={2}
                      value={candidate.correctedText}
                    />
                  </>
                )}
                <div className="candidate-card__footer">
                  <span className="muted-text">
                    {promptOnly
                      ? "The English prompt looks ready for Hebrew generation."
                      : candidate.tags.join(", ")}
                  </span>
                  <button
                    className="button button--ghost"
                    onClick={() => handleRemove(index)}
                    type="button"
                  >
                    Reject
                  </button>
                </div>
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
