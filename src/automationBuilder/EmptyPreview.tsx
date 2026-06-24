import { LoaderCircle, Sparkles } from "lucide-react";

export function EmptyPreview({ isGenerating }: { isGenerating: boolean }) {
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
