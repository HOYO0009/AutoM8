import { AlertCircle, LoaderCircle, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { ApiErrorResponse, DraftAutomation, DraftAutomationResponse } from "../shared/draftAutomation";

const examplePrompt =
  "Every morning, open the sales spreadsheet, collect yesterday's total revenue, and draft a short email summary for the team.";

export function App() {
  const [prompt, setPrompt] = useState(examplePrompt);
  const [draft, setDraft] = useState<DraftAutomation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const trimmedPrompt = prompt.trim();
  const canGenerate = trimmedPrompt.length > 0 && !isGenerating;
  const promptWordCount = useMemo(() => {
    return trimmedPrompt ? trimmedPrompt.split(/\s+/).length : 0;
  }, [trimmedPrompt]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canGenerate) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/draft-automation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: trimmedPrompt })
      });

      const payload = (await response.json()) as DraftAutomationResponse | ApiErrorResponse;

      if (!response.ok || "error" in payload) {
        setDraft(null);
        setError("error" in payload ? payload.error.message : "AutoM8 could not create a draft.");
        return;
      }

      setDraft(payload.draft);
    } catch {
      setDraft(null);
      setError("AutoM8 could not reach the local draft API.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace" aria-label="Automation builder">
        <div className="builder-pane">
          <header className="pane-header">
            <div>
              <p className="eyebrow">Automation Builder</p>
              <h1>Draft an automation from a prompt</h1>
            </div>
            <span className="status-pill">In-memory draft</span>
          </header>

          <form className="prompt-form" onSubmit={handleSubmit}>
            <label htmlFor="workflow-prompt">Workflow prompt</label>
            <textarea
              id="workflow-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the desktop workflow AutoM8 should draft..."
              rows={10}
            />
            <div className="form-footer">
              <span>{promptWordCount} words</span>
              <button type="submit" disabled={!canGenerate}>
                {isGenerating ? (
                  <LoaderCircle aria-hidden="true" className="spin" size={18} />
                ) : (
                  <Sparkles aria-hidden="true" size={18} />
                )}
                Generate draft
              </button>
            </div>
          </form>

          {error ? (
            <div className="error-box" role="alert">
              <AlertCircle aria-hidden="true" size={18} />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        <div className="preview-pane" aria-live="polite">
          {draft ? <DraftPreview draft={draft} /> : <EmptyPreview isGenerating={isGenerating} />}
        </div>
      </section>
    </main>
  );
}

function DraftPreview({ draft }: { draft: DraftAutomation }) {
  return (
    <article className="draft-preview">
      <header className="draft-header">
        <p className="eyebrow">Draft automation</p>
        <h2>{draft.name}</h2>
        <p>{draft.summary}</p>
      </header>

      <ol className="step-list">
        {draft.steps.map((step, index) => (
          <li key={`${step.title}-${index}`} className="step-item">
            <div className="step-index">{index + 1}</div>
            <div>
              <div className="step-title-row">
                <h3>{step.title}</h3>
                <span>{step.nodeType}</span>
              </div>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}

function EmptyPreview({ isGenerating }: { isGenerating: boolean }) {
  return (
    <div className="empty-preview">
      <div className="empty-icon">
        {isGenerating ? (
          <LoaderCircle aria-hidden="true" className="spin" size={28} />
        ) : (
          <Sparkles aria-hidden="true" size={28} />
        )}
      </div>
      <h2>{isGenerating ? "Generating draft" : "No draft yet"}</h2>
      <p>
        {isGenerating
          ? "AutoM8 is asking the configured OpenRouter model to turn the prompt into ordered automation steps."
          : "Submit a workflow prompt to create a draft automation preview."}
      </p>
    </div>
  );
}
