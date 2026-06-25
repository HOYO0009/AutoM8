import { AlertCircle, LoaderCircle, Sparkles } from "lucide-react";
import { FormEvent, ReactNode } from "react";

export function AutomationBuilderPane({
  prompt,
  setPrompt,
  promptWordCount,
  canGenerate,
  isGenerating,
  error,
  onGenerate,
  eyebrow = "Automation Builder",
  title = "Draft an automation from a prompt",
  statusLabel = "In-memory draft",
  promptLabel = "Workflow prompt",
  promptPlaceholder = "Describe the desktop workflow AutoM8 should draft...",
  submitLabel = "Generate draft",
  headerAction
}: {
  prompt: string;
  setPrompt: (prompt: string) => void;
  promptWordCount: number;
  canGenerate: boolean;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
  eyebrow?: string;
  title?: string;
  statusLabel?: string;
  promptLabel?: string;
  promptPlaceholder?: string;
  submitLabel?: string;
  headerAction?: ReactNode;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onGenerate();
  }

  return (
    <div className="builder-pane">
      <header className="pane-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <div className="pane-header-actions">
          <span className="status-pill">{statusLabel}</span>
          {headerAction}
        </div>
      </header>

      <form className="prompt-form" onSubmit={handleSubmit}>
        <label htmlFor="workflow-prompt">{promptLabel}</label>
        <textarea
          id="workflow-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={promptPlaceholder}
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
            {submitLabel}
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
  );
}
