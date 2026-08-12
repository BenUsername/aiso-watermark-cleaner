import { describe, expect, it } from "vitest";
import { cleanText, inspectText } from "../lib/clean-text";

describe("cleanText", () => {
  it("removes zero-width, bidi, and tag characters", () => {
    const result = cleanText(`a\u200Bb\u2060c\u{E0061}`);
    expect(result.cleanedText).toBe("abc");
    expect(result.stats.removedCount).toBe(3);
  });

  it("normalizes exotic spaces by default", () => {
    const result = cleanText("one\u00A0two\u2009three");
    expect(result.cleanedText).toBe("one two three");
    expect(result.stats.replacedCount).toBe(2);
  });

  it("preserves normal text", () => {
    const text = "A clean sentence with punctuation.";
    expect(cleanText(text)).toEqual({
      cleanedText: text,
      stats: { inputLength: text.length, outputLength: text.length, removedCount: 0, replacedCount: 0, removed: {}, replaced: {} },
    });
  });

  it("normalizes lookalikes only when requested", () => {
    expect(cleanText("pаypal").cleanedText).toBe("pаypal");
    expect(cleanText("pаypal", { normalizeConfusables: true }).cleanedText).toBe("paypal");
  });

  it("supports optional NFKC normalization", () => {
    expect(cleanText("①", { nfkc: true }).cleanedText).toBe("1");
  });

  it("reports upstream-compatible kinds, labels, counts, and offsets", () => {
    const report = inspectText(`a\u200Bb\u202Ec\u{E0041}`);
    expect(report.suspiciousTotal).toBe(3);
    expect(report.hits.map((hit) => hit.kind)).toEqual(expect.arrayContaining(["zwj_family", "bidi", "tag_chars"]));
    expect(report.hits.find((hit) => hit.codepoint === "U+200B")).toMatchObject({
      label: "U+200B ZERO WIDTH SPACE (Cf)",
      count: 1,
      sampleOffsets: [1],
    });
  });

  it("flags confusables only in aggressive inspection", () => {
    expect(inspectText("pаy").suspiciousTotal).toBe(0);
    expect(inspectText("pаy", { aggressive: true }).hits[0]).toMatchObject({ kind: "confusable", codepoint: "U+0430" });
  });
});
