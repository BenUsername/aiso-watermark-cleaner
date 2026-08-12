import { describe, expect, it } from "vitest";
import { buildRewritePrompt } from "../lib/rewrite-text";

describe("Layer B prompts", () => {
  it("builds the upstream paraphrase prompt", () => {
    const prompt = buildRewritePrompt("paraphrase", "Hello world facts 42.");
    expect(prompt).toContain("every sentence uses different wording and structure");
    expect(prompt).toContain("Hello world facts 42.");
  });

  it("builds back-translation and structural prompts", () => {
    expect(buildRewritePrompt("backtranslate", "ABC 123", "German", "English")).toContain("Translate the text to German");
    expect(buildRewritePrompt("structural", "ABC 123")).toContain("bullet outline of all claims");
  });
});
