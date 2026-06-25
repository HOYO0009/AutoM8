import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ClarificationPanel } from "./ClarificationPanel";

describe("ClarificationPanel", () => {
  it("renders required Clarification Questions before a Draft Automation exists", () => {
    const html = renderToStaticMarkup(
      <ClarificationPanel
        questions={[
          {
            id: "sales-spreadsheet",
            question: "Which sales spreadsheet should AutoM8 open?",
            reason: "AutoM8 needs the exact source before it can create a Draft Automation."
          }
        ]}
        answerText={{}}
        isGenerating={false}
        canSubmit={false}
        onAnswerChange={() => undefined}
        onSubmit={() => undefined}
      />
    );

    expect(html).toContain("Clarification required");
    expect(html).toContain("Which sales spreadsheet should AutoM8 open?");
    expect(html).toContain("AutoM8 needs the exact source before it can create a Draft Automation.");
    expect(html).toContain("disabled=\"\"");
    expect(html).not.toContain("Save draft");
  });
});
