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
            reason: "AutoM8 needs the exact source before it can create a Draft Automation.",
            answerKind: "text"
          }
        ]}
        answerText={{}}
        isGenerating={false}
        canSubmit={false}
        onAnswerChange={() => undefined}
        onPickAnswer={async () => null}
        onSubmit={() => undefined}
      />
    );

    expect(html).toContain("Clarification required");
    expect(html).toContain("Which sales spreadsheet should AutoM8 open?");
    expect(html).toContain("AutoM8 needs the exact source before it can create a Draft Automation.");
    expect(html).toContain("disabled=\"\"");
    expect(html).not.toContain("Save draft");
  });

  it("renders picker controls for local file and spreadsheet questions", () => {
    const html = renderToStaticMarkup(
      <ClarificationPanel
        questions={[
          {
            id: "sales-spreadsheet",
            question: "Which sales spreadsheet should AutoM8 open?",
            reason: "AutoM8 needs the exact source before it can create a Draft Automation.",
            answerKind: "local_spreadsheet"
          },
          {
            id: "source-file",
            question: "Which source file should AutoM8 read?",
            reason: "AutoM8 needs the exact source file before modeling this step.",
            answerKind: "local_file"
          }
        ]}
        answerText={{
          "sales-spreadsheet": "C:/Reports/Sales.xlsx"
        }}
        isGenerating={false}
        canSubmit={false}
        onAnswerChange={() => undefined}
        onPickAnswer={async () => null}
        onSubmit={() => undefined}
      />
    );

    expect(html).toContain("Choose spreadsheet");
    expect(html).toContain("Choose file");
    expect(html).toContain("readOnly=\"\"");
    expect(html).toContain("C:/Reports/Sales.xlsx");
  });
});
