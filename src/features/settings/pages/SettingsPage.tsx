import { ChangeEvent, useEffect, useState } from "react";
import type { AppSettings, PracticeFontPreset } from "../../../domain/models/settings";
import { settingsRepository } from "../../../storage/repositories/settings-repository";
import {
  clearTrainerProgress,
  exportTrainerData,
  importTrainerData,
  validateImportPayload,
} from "../../export/export-service";
import {
  createDefaultSettings,
  OPENAI_BASE_URL_OPTIONS,
  OPENAI_MODEL_OPTIONS,
  PRACTICE_FONT_OPTIONS,
  resolvePracticeFontStack,
} from "../settings-utils";

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [status, setStatus] = useState("");
  const [importJson, setImportJson] = useState("");

  useEffect(() => {
    void settingsRepository
      .getOrCreate(() => createDefaultSettings(new Date().toISOString()))
      .then(setSettings);
  }, []);

  useEffect(() => {
    if (!settings) {
      return;
    }

    document.documentElement.style.setProperty(
      "--font-hebrew-training",
      resolvePracticeFontStack(
        settings.typography.practiceFontPreset,
        settings.typography.customPracticeFont,
      ),
    );
  }, [settings]);

  const updateSettings = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (!settings) {
      return;
    }

    setSettings({
      ...settings,
      [key]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSave = async () => {
    if (!settings) {
      return;
    }

    await settingsRepository.save(settings);
    setStatus("Settings saved locally.");
  };

  const handleExport = async () => {
    const payload = await exportTrainerData(new Date().toISOString());
    setImportJson(JSON.stringify(payload, null, 2));
    setStatus("Exported current data to JSON.");
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importJson) as unknown;
      if (!validateImportPayload(parsed)) {
        setStatus("Import rejected: JSON does not match the app export format.");
        return;
      }

      await importTrainerData(parsed);
      setStatus("Import complete. Reload any open pages to see the restored data.");
    } catch {
      setStatus("Import rejected: invalid JSON.");
    }
  };

  const handleResetProgress = async () => {
    await clearTrainerProgress();
    setStatus("Reset practice progress. Your sentence bank was preserved.");
  };

  const handleLlmChange = (
    field: "mode" | "apiKey" | "baseUrl" | "model",
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!settings) {
      return;
    }

    const nextLlm = {
      ...settings.llm,
      [field]: event.target.value,
    };

    setSettings({
      ...settings,
      llm: nextLlm,
      gradingStrategy:
        field === "apiKey" && String(event.target.value).trim() && settings.gradingStrategy === "rule_based_only"
          ? "llm_led"
          : settings.gradingStrategy,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleTypographyChange = (
    field: "practiceFontPreset" | "customPracticeFont",
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!settings) {
      return;
    }

    setSettings({
      ...settings,
      typography: {
        ...settings.typography,
        [field]:
          field === "practiceFontPreset"
            ? (event.target.value as PracticeFontPreset)
            : event.target.value,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <section className="page page--grid">
      <div className="page__intro">
        <p className="eyebrow type-label">Settings</p>
        <h2 className="type-heading-lg">Control persistence, exports, and optional LLM support</h2>
        <p className="type-body-muted">
          Everything stays local by default. If you enable an external model,
          the app makes that choice explicit and keeps the provider details in
          browser storage only.
        </p>
      </div>

      {!settings ? null : (
        <form onSubmit={(event) => event.preventDefault()}>
          <div className="surface-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow type-label">Practice Defaults</p>
                <h3 className="type-heading-md">Session and grading behavior</h3>
              </div>
              <button className="button" onClick={() => void handleSave()} type="button">
                Save settings
              </button>
            </div>

            <div className="form-grid">
              <label className="field-block">
                <span className="field-label type-label-field">Default session length</span>
                <select
                  className="select-input"
                  onChange={(event) =>
                    updateSettings(
                      "defaultSessionLength",
                      Number(event.target.value) as 5 | 10 | 15,
                    )
                  }
                  value={settings.defaultSessionLength}
                >
                  <option value={5}>5 items</option>
                  <option value={10}>10 items</option>
                  <option value={15}>15 items</option>
                </select>
              </label>

              <label className="field-block">
                <span className="field-label type-label-field">Grading mode</span>
                <select
                  className="select-input"
                  onChange={(event) =>
                    updateSettings(
                      "gradingMode",
                      event.target.value as "strict" | "balanced",
                    )
                  }
                  value={settings.gradingMode}
                >
                  <option value="balanced">Balanced</option>
                  <option value="strict">Strict</option>
                </select>
              </label>

              <label className="field-block">
                <span className="field-label type-label-field">Grading strategy</span>
                <select
                  className="select-input"
                  onChange={(event) =>
                    updateSettings(
                      "gradingStrategy",
                      event.target.value as
                        | "rule_based_only"
                        | "hybrid_fallback"
                        | "llm_led",
                    )
                  }
                  value={settings.gradingStrategy}
                >
                  <option value="rule_based_only">Rule-based only</option>
                  <option value="hybrid_fallback">Hybrid fallback</option>
                  <option value="llm_led">LLM-led</option>
                </select>
              </label>
            </div>
          </div>

          <div className="surface-card">
            <p className="eyebrow type-label">Typography</p>
            <h3 className="type-heading-md">Practice font options</h3>
            <div className="form-grid">
              <label className="field-block">
                <span className="field-label type-label-field">Practice font</span>
                <select
                  className="select-input"
                  onChange={(event) => handleTypographyChange("practiceFontPreset", event)}
                  value={settings.typography.practiceFontPreset}
                >
                  {PRACTICE_FONT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {settings.typography.practiceFontPreset === "custom" ? (
                <label className="field-block">
                  <span className="field-label type-label-field">Custom font stack</span>
                  <input
                    className="text-input"
                    onChange={(event) => handleTypographyChange("customPracticeFont", event)}
                    placeholder='"Adelle Sans", "Assistant", sans-serif'
                    value={settings.typography.customPracticeFont ?? ""}
                  />
                </label>
              ) : null}
            </div>
          </div>

          <div className="surface-card">
            <p className="eyebrow type-label">LLM</p>
            <h3 className="type-heading-md">Optional external assistance</h3>
            <div className="form-grid">
              <label className="field-block">
                <span className="field-label type-label-field">Mode</span>
                <select
                  className="select-input"
                  onChange={(event) => handleLlmChange("mode", event)}
                  value={settings.llm.mode}
                >
                  <option value="disabled">Disabled</option>
                  <option value="assistive">Assistive</option>
                  <option value="enhanced">Enhanced</option>
                </select>
              </label>
              <label className="field-block">
                <span className="field-label type-label-field">Base URL</span>
                <input
                  className="text-input"
                  list="openai-base-url-options"
                  onChange={(event) => handleLlmChange("baseUrl", event)}
                  value={settings.llm.baseUrl ?? ""}
                />
                <datalist id="openai-base-url-options">
                  {OPENAI_BASE_URL_OPTIONS.map((baseUrl) => (
                    <option key={baseUrl} value={baseUrl} />
                  ))}
                </datalist>
              </label>
              <label className="field-block">
                <span className="field-label type-label-field">Model</span>
                <input
                  className="text-input"
                  list="openai-model-options"
                  onChange={(event) => handleLlmChange("model", event)}
                  value={settings.llm.model ?? ""}
                />
                <datalist id="openai-model-options">
                  {OPENAI_MODEL_OPTIONS.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
              </label>
              <label className="field-block">
                <span className="field-label type-label-field">API key</span>
                <input
                  className="text-input"
                  onChange={(event) => handleLlmChange("apiKey", event)}
                  placeholder="Stored locally only"
                  type="password"
                  value={settings.llm.apiKey ?? ""}
                />
              </label>
            </div>
          </div>

          <div className="surface-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow type-label">Backup</p>
                <h3 className="type-heading-md">Export or restore your local data</h3>
              </div>
              <div className="button-row">
                <button
                  className="button button--secondary"
                  onClick={() => void handleResetProgress()}
                  type="button"
                >
                  Reset progress
                </button>
                <button className="button button--secondary" onClick={() => void handleExport()} type="button">
                  Export JSON
                </button>
                <button className="button" onClick={() => void handleImport()} type="button">
                  Import JSON
                </button>
              </div>
            </div>
            <textarea
              className="text-input text-input--multiline"
              onChange={(event) => setImportJson(event.target.value)}
              rows={14}
              value={importJson}
            />
            <p className="status-text type-body-muted">{status}</p>
          </div>
        </form>
      )}
    </section>
  );
}
