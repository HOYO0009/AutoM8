import { LoaderCircle, Sparkles } from "lucide-react";

export function EmptyPreview({
  isGenerating,
  idleTitle = "No draft yet",
  generatingTitle = "Generating draft",
  idleDescription = "Submit a workflow prompt to create a draft automation preview.",
  generatingDescription = "AutoM8 is asking the configured OpenRouter model to turn the prompt into ordered automation steps."
}: {
  isGenerating: boolean;
  idleTitle?: string;
  generatingTitle?: string;
  idleDescription?: string;
  generatingDescription?: string;
}) {
  return (
    <div className="empty-preview">
      <div className="empty-icon">
        {isGenerating ? (
          <LoaderCircle aria-hidden="true" className="spin" size={28} />
        ) : (
          <Sparkles aria-hidden="true" size={28} />
        )}
      </div>
      <h2>{isGenerating ? generatingTitle : idleTitle}</h2>
      <p>{isGenerating ? generatingDescription : idleDescription}</p>
    </div>
  );
}
