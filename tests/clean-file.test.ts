import { describe, expect, it } from "vitest";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { cleanFile, inspectFile } from "../lib/clean-file";

function u32(value: number) {
  return new Uint8Array([(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]);
}

function pngChunk(type: string, payload: Uint8Array) {
  return concat(u32(payload.length), strToU8(type), payload, new Uint8Array(4));
}

function samplePng() {
  return concat(
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", new Uint8Array(13)),
    pngChunk("tEXt", strToU8("Comment\0c2pa contentcredentials")),
    pngChunk("IDAT", new Uint8Array([1, 2, 3])),
    pngChunk("IEND", new Uint8Array()),
  );
}

function sampleJpeg() {
  const app0 = strToU8("JFIF\0sample");
  const app11 = strToU8("JUMB c2pa-manifest-fake");
  const segment = (marker: number, payload: Uint8Array) => concat(new Uint8Array([0xff, marker, 0, payload.length + 2]), payload);
  return concat(new Uint8Array([0xff, 0xd8]), segment(0xe0, app0), segment(0xeb, app11), new Uint8Array([0xff, 0xda, 0, 2, 0, 0, 0xff, 0xd9]));
}

describe("file inspection and cleaning", () => {
  it("cleans Markdown frontmatter and Layer A Unicode", () => {
    const source = strToU8("---\ntitle: Hello\ngenerator: Claude\nai_generated: true\n---\nBody\u200B text.\n");
    const before = inspectFile("sample.md", source);
    expect(before.hasAiMetadata).toBe(true);
    expect(before.text?.suspiciousTotal).toBe(1);
    const result = cleanFile("sample.md", source);
    const output = strFromU8(result.bytes);
    expect(output).toContain("title: Hello");
    expect(output).not.toContain("generator:");
    expect(output).not.toContain("ai_generated:");
    expect(output).not.toContain("\u200B");
    expect(result.after.hasAiMetadata).toBe(false);
    expect(result.after.text?.suspiciousTotal).toBe(0);
  });

  it("cleans HTML meta, JSON-LD provenance, attributes, and Unicode", () => {
    const html = strToU8('<html><head><meta name="generator" content="ChatGPT"><meta name="viewport" content="width=device-width"><script type="application/ld+json">{"digitalSourceType":"trainedAlgorithmicMedia"}</script></head><body data-ai-model="gpt">Hi\u200B</body></html>');
    const result = cleanFile("sample.html", html);
    const output = strFromU8(result.bytes);
    expect(output).toContain("viewport");
    expect(output).not.toMatch(/ChatGPT|digitalSourceType|data-ai|\u200B/);
    expect(result.after.hasAiMetadata).toBe(false);
  });

  it("strips SVG metadata without removing the image body", () => {
    const svg = strToU8('<svg xmlns="http://www.w3.org/2000/svg"><metadata>c2pa contentcredentials Anthropic</metadata><circle cx="1" cy="1" r="1"/></svg>');
    const result = cleanFile("sample.svg", svg);
    const output = strFromU8(result.bytes);
    expect(output).toContain("<circle");
    expect(output).not.toContain("<metadata>");
    expect(result.after.hasC2pa).toBe(false);
  });

  it("drops PNG metadata chunks and preserves critical chunks", () => {
    const result = cleanFile("sample.png", samplePng());
    const output = Buffer.from(result.bytes).toString("latin1");
    expect(output).toContain("IHDR");
    expect(output).toContain("IDAT");
    expect(output).toContain("IEND");
    expect(output).not.toContain("tEXt");
    expect(output.toLowerCase()).not.toContain("c2pa");
  });

  it("drops JPEG APP11 while preserving APP0 and the image scan", () => {
    const result = cleanFile("sample.jpg", sampleJpeg());
    const output = Buffer.from(result.bytes).toString("latin1");
    expect(output).toContain("JFIF");
    expect(output).not.toContain("c2pa-manifest-fake");
    expect(result.actions.some((action) => action.includes("APP11"))).toBe(true);
  });

  it("scrubs DOCX properties and custom XML", () => {
    const source = zipSync({
      "[Content_Types].xml": strToU8('<Types><Override PartName="/customXml/item1.xml" ContentType="application/xml"/></Types>'),
      "word/document.xml": strToU8("<document><body>Hello</body></document>"),
      "docProps/app.xml": strToU8("<Properties><Application>Claude AI Writer</Application></Properties>"),
      "customXml/item1.xml": strToU8("<root>c2pa contentcredentials</root>"),
    });
    const result = cleanFile("sample.docx", source);
    const archive = unzipSync(result.bytes);
    expect(archive["word/document.xml"]).toBeDefined();
    expect(Object.keys(archive).some((name) => name.startsWith("customXml/"))).toBe(false);
    expect(strFromU8(archive["docProps/app.xml"])).not.toContain("Claude");
  });

  it("drops ODT generator metadata", () => {
    const source = zipSync({
      mimetype: [strToU8("application/vnd.oasis.opendocument.text"), { level: 0 }],
      "meta.xml": strToU8('<office:document-meta><meta:generator>Anthropic Claude</meta:generator></office:document-meta>'),
      "content.xml": strToU8("<office:document-content/>"),
      "META-INF/manifest.xml": strToU8("<manifest:manifest/>"),
    });
    const result = cleanFile("sample.odt", source);
    const archive = unzipSync(result.bytes);
    expect(strFromU8(archive["meta.xml"])).not.toContain("Claude");
  });

  it("blanks PDF XMP without changing byte length", () => {
    const xmp = "<?xpacket begin=''?><x:xmpmeta><digitalSourceType>trainedAlgorithmicMedia</digitalSourceType></x:xmpmeta><?xpacket end='w'?>";
    const source = strToU8(`%PDF-1.4\n1 0 obj<<>>endobj\n${xmp}\n%%EOF`);
    const result = cleanFile("sample.pdf", source);
    expect(result.bytesOut).toBe(result.bytesIn);
    expect(Buffer.from(result.bytes).toString("latin1")).not.toContain("trainedAlgorithmicMedia");
    expect(result.actions[0]).toContain("Blank PDF XMP");
  });
});

function concat(...parts: Uint8Array[]) {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}
