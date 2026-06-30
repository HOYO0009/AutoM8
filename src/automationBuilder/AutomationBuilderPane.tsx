import { AlertCircle, LoaderCircle, Sparkles } from "lucide-react";
import { FormEvent, ReactNode } from "react";
import type { ApiErrorDiagnostics } from "../../shared/apiResponses";

interface AutomationBuilderPaneError {
  message: string;
  code?: string;
  diagnostics?: ApiErrorDiagnostics;
}

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
  error: AutomationBuilderPaneError | null;
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
          <div className="error-content">
            <span>{error.message}</span>
            <ErrorDiagnostics error={error} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ErrorDiagnostics({ error }: { error: AutomationBuilderPaneError }) {
  const diagnostics = error.diagnostics;
  const rows = [
    error.code ? { label: "Code", value: error.code } : null,
    diagnostics?.failureType
      ? { label: "Failure", value: failureTypeLabel(diagnostics.failureType) }
      : null,
    diagnostics?.model ? { label: "Model", value: diagnostics.model } : null,
    diagnostics?.stage ? { label: "Stage", value: diagnostics.stage } : null,
    diagnostics?.providerStatus
      ? { label: "Provider status", value: String(diagnostics.providerStatus) }
      : null,
    diagnostics?.guidance ? { label: "Guidance", value: diagnostics.guidance } : null
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  if (rows.length === 0) {
    return null;
  }

  return (
    <dl className="error-diagnostics" aria-label="Failure diagnostics">
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function failureTypeLabel(failureType: NonNullable<ApiErrorDiagnostics["failureType"]>): string {
  switch (failureType) {
    case "provider_rejection":
      return "Provider rejection";
    case "invalid_assistant_message":
      return "Invalid assistant message";
    case "invalid_json":
      return "Invalid JSON";
    case "invalid_creation_result_shape":
      return "Invalid creation result shape";
  }
}
