import { AlertCircle, LoaderCircle, Sparkles } from "lucide-react";
import { FormEvent } from "react";

export function AutomationBuilderPane({
  prompt,
  setPrompt,
  promptWordCount,
  canGenerate,
  isGenerating,
  error,
  onGenerate
}: {
  prompt: string;
  setPrompt: (prompt: string) => void;
  promptWordCount: number;
  canGenerate: boolean;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onGenerate();
  }

  return (
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
  );
}
