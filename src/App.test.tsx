import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders new automation mode by default", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("New automation");
    expect(html).toContain("Workflow prompt");
    expect(html).toContain("Draft an automation from a prompt");
  });
});
