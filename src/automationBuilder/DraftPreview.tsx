import { AlertCircle, CheckCircle2, LoaderCircle, Save } from "lucide-react";

import { DraftAutomation } from "../../shared/automationDraft";
import { NodeGraphViewer } from "../nodeGraphViewer/NodeGraphViewer";

export function DraftPreview({
  draft,
  isSaving,
  onSave,
  saveError,
  savedNotice,
  eyebrow = "Draft automation",
  saveLabel = "Save draft"
}: {
  draft: DraftAutomation;
  isSaving: boolean;
  onSave: () => void;
  saveError: string | null;
  savedNotice: string | null;
  eyebrow?: string;
  saveLabel?: string;
}) {
  return (
    <article className="draft-preview">
      <header className="draft-header">
        <div className="draft-title-row">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{draft.name}</h2>
          </div>
          <button className="save-draft-button" type="button" onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <LoaderCircle aria-hidden="true" className="spin" size={18} />
            ) : (
              <Save aria-hidden="true" size={18} />
            )}
            {saveLabel}
          </button>
        </div>
        <p>{draft.summary}</p>
        {savedNotice ? (
          <div className="notice-box" role="status">
            <CheckCircle2 aria-hidden="true" size={18} />
            <span>{savedNotice}</span>
          </div>
        ) : null}
        {saveError ? (
          <div className="error-box" role="alert">
            <AlertCircle aria-hidden="true" size={18} />
            <span>{saveError}</span>
          </div>
        ) : null}
      </header>

      <NodeGraphViewer automation={draft} />
    </article>
  );
}
