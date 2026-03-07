export function HelpPage() {
  return (
    <section className="page page--grid">
      <div className="page__intro">
        <p className="eyebrow type-label">Help</p>
        <h2 className="type-heading-lg">What this trainer is for and how to use it well</h2>
        <p className="type-body-muted">
          This tool is built to turn your real Hebrew mistakes into future
          writing practice, without asking you to manage a giant study system.
        </p>
      </div>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow type-label">Purpose</p>
            <h3 className="type-heading-md">A practice desk, not a course</h3>
          </div>
        </div>
        <p className="status-text type-body-muted">
          The trainer is for people who are already writing Hebrew and want to
          improve the exact patterns they actually miss. Instead of teaching the
          whole language from scratch, it stores useful sentences, serves short
          translation drills, and helps you revisit weak constructions until
          they feel natural.
        </p>
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow type-label">How it works</p>
            <h3 className="type-heading-md">From sentence bank to focused review</h3>
          </div>
        </div>
        <dl className="detail-grid">
          <div>
            <dt className="type-label-meta">1. Build a sentence bank</dt>
            <dd>
              Import English prompts or corrected Hebrew examples so the app has
              real material to practice from.
            </dd>
          </div>
          <div>
            <dt className="type-label-meta">2. Run a practice session</dt>
            <dd>
              The app shows one English prompt at a time, collects your Hebrew,
              and reviews the answer.
            </dd>
          </div>
          <div>
            <dt className="type-label-meta">3. Learn the exact delta</dt>
            <dd>
              After submission, you see the stronger Hebrew phrasing, the main
              fix, and the specific construction the model wants you to notice.
            </dd>
          </div>
          <div>
            <dt className="type-label-meta">4. Grow future drills automatically</dt>
            <dd>
              When the reviewer identifies a real mistake, it can generate extra
              English prompts with Hebrew references so that construction comes
              back later in practice.
            </dd>
          </div>
        </dl>
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow type-label">Importing</p>
            <h3 className="type-heading-md">How to import sentences</h3>
          </div>
        </div>
        <dl className="detail-grid">
          <div>
            <dt className="type-label-meta">English prompts</dt>
            <dd>
              Paste one English sentence per line on the Import page. Review the
              prompts you want to keep, then use <strong>Generate Hebrew and save</strong>.
              The app will create Hebrew reference answers before saving them to
              your bank.
            </dd>
          </div>
          <div>
            <dt className="type-label-meta">Corrected Hebrew examples</dt>
            <dd>
              If you already have original and corrected Hebrew pairs, paste
              them in a structured format like <strong>Original:</strong> and
              <strong>Corrected:</strong>, or as <strong>before -&gt; after</strong>.
              Those rows can be reviewed and edited before saving.
            </dd>
          </div>
          <div>
            <dt className="type-label-meta">What gets stored</dt>
            <dd>
              Imported prompts become part of your sentence bank. Practice
              history, review stats, and generated follow-up drills are then
              built on top of that bank.
            </dd>
          </div>
        </dl>
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow type-label">Backup</p>
            <h3 className="type-heading-md">Your data lives in this browser</h3>
          </div>
        </div>
        <p className="status-text type-body-muted">
          Your data is stored locally in the browser on this device. That means
          it can disappear if you clear browser storage, switch browsers, use
          private browsing, or lose this device profile.
        </p>
        <p className="status-text type-body-muted">
          Treat the app as ephemeral local storage unless you export backups.
          Use the JSON export in <strong>Settings</strong> regularly if you want
          to keep your sentence bank and practice history safe.
        </p>
      </section>
    </section>
  );
}
