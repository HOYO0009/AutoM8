import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AutomationBuilderPane } from "./AutomationBuilderPane";

describe("AutomationBuilderPane", () => {
  it("renders safe failure diagnostics with the generic error message", () => {
    const html = renderToStaticMarkup(
      <AutomationBuilderPane
        prompt="Open notepad and enter HELLO. Then save it to Google Drive."
        setPrompt={() => undefined}
        promptWordCount={11}
        canGenerate={true}
        isGenerating={false}
        error={{
          message:
            "The configured draft automation creator did not return the required creation result shape.",
          code: "INVALID_LLM_RESPONSE",
          diagnostics: {
            failureType: "invalid_creation_result_shape",
            model: "openrouter/free",
            stage: "creation-result-draft",
            providerStatus: 200,
            guidance: "The model returned JSON, but it did not match AutoM8's contract."
          }
        }}
        onGenerate={() => undefined}
      />
    );

    expect(html).toContain(
      "The configured draft automation creator did not return the required creation result shape."
    );
    expect(html).toContain("INVALID_LLM_RESPONSE");
    expect(html).toContain("Invalid creation result shape");
    expect(html).toContain("openrouter/free");
    expect(html).toContain("creation-result-draft");
    expect(html).toContain("The model returned JSON, but it did not match AutoM8&#x27;s contract.");
  });
});
