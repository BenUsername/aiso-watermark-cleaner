export type SourceLabel = "claude" | "chatgpt" | "gemini" | "other" | "unknown";

export type CleanOptions = {
  normalizeSpaces?: boolean;
  normalizeConfusables?: boolean;
  nfkc?: boolean;
};

export type CleanStats = {
  inputLength: number;
  outputLength: number;
  removedCount: number;
  replacedCount: number;
  removed: Record<string, number>;
  replaced: Record<string, number>;
};

export type InspectKind =
  | "strip"
  | "bidi"
  | "tag_chars"
  | "variation_selector"
  | "zwj_family"
  | "space"
  | "confusable"
  | "other_cf";

export type InspectHit = {
  codepoint: string;
  label: string;
  count: number;
  kind: InspectKind;
  sampleOffsets: number[];
};

export type TextInspectReport = {
  length: number;
  suspiciousTotal: number;
  hits: InspectHit[];
  notes: string[];
};

export type CleanResult = { cleanedText: string; stats: CleanStats };

const STRIP_CODEPOINTS = new Set([
  0x00ad, 0x034f, 0x061c, 0x115f, 0x1160, 0x17b4, 0x17b5,
  0x180b, 0x180c, 0x180d, 0x180e, 0x200b, 0x200c, 0x200d,
  0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e,
  0x2060, 0x2061, 0x2062, 0x2063, 0x2064, 0x2066, 0x2067,
  0x2068, 0x2069, 0x206a, 0x206b, 0x206c, 0x206d, 0x206e,
  0x206f, 0xfeff, 0xfe00, 0xfe01, 0xfe02, 0xfe03, 0xfe04,
  0xfe05, 0xfe06, 0xfe07, 0xfe08, 0xfe09, 0xfe0a, 0xfe0b,
  0xfe0c, 0xfe0d, 0xfe0e, 0xfe0f, 0xfff9, 0xfffa, 0xfffb,
]);

const SPACE_HOMOGLYPHS = new Set([
  0x00a0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004,
  0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x202f,
  0x205f, 0x3000,
]);

const CONFUSABLES: Record<number, string> = {
  0x0410: "A", 0x0412: "B", 0x0415: "E", 0x041a: "K", 0x041c: "M",
  0x041d: "H", 0x041e: "O", 0x0420: "P", 0x0421: "C", 0x0422: "T",
  0x0425: "X", 0x0430: "a", 0x0435: "e", 0x043e: "o", 0x0440: "p",
  0x0441: "c", 0x0443: "y", 0x0445: "x", 0x0456: "i",
};

for (let cp = 0xff21; cp <= 0xff3a; cp += 1) CONFUSABLES[cp] = String.fromCharCode(0x41 + cp - 0xff21);
for (let cp = 0xff41; cp <= 0xff5a; cp += 1) CONFUSABLES[cp] = String.fromCharCode(0x61 + cp - 0xff41);

const BIDI_CODEPOINTS = new Set([
  0x061c, 0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d,
  0x202e, 0x2066, 0x2067, 0x2068, 0x2069,
]);

const ZERO_WIDTH_CODEPOINTS = new Set([0x200b, 0x200c, 0x200d, 0x2060, 0xfeff, 0x180e]);

const CHARACTER_NAMES: Record<number, string> = {
  0x00ad: "SOFT HYPHEN", 0x00a0: "NO-BREAK SPACE", 0x034f: "COMBINING GRAPHEME JOINER",
  0x061c: "ARABIC LETTER MARK", 0x115f: "HANGUL CHOSEONG FILLER", 0x1160: "HANGUL JUNGSEONG FILLER",
  0x1680: "OGHAM SPACE MARK", 0x17b4: "KHMER VOWEL INHERENT AQ", 0x17b5: "KHMER VOWEL INHERENT AA",
  0x180b: "MONGOLIAN FREE VARIATION SELECTOR ONE", 0x180c: "MONGOLIAN FREE VARIATION SELECTOR TWO",
  0x180d: "MONGOLIAN FREE VARIATION SELECTOR THREE", 0x180e: "MONGOLIAN VOWEL SEPARATOR",
  0x2000: "EN QUAD", 0x2001: "EM QUAD", 0x2002: "EN SPACE", 0x2003: "EM SPACE",
  0x2004: "THREE-PER-EM SPACE", 0x2005: "FOUR-PER-EM SPACE", 0x2006: "SIX-PER-EM SPACE",
  0x2007: "FIGURE SPACE", 0x2008: "PUNCTUATION SPACE", 0x2009: "THIN SPACE", 0x200a: "HAIR SPACE",
  0x200b: "ZERO WIDTH SPACE", 0x200c: "ZERO WIDTH NON-JOINER", 0x200d: "ZERO WIDTH JOINER",
  0x200e: "LEFT-TO-RIGHT MARK", 0x200f: "RIGHT-TO-LEFT MARK", 0x202a: "LEFT-TO-RIGHT EMBEDDING",
  0x202b: "RIGHT-TO-LEFT EMBEDDING", 0x202c: "POP DIRECTIONAL FORMATTING", 0x202d: "LEFT-TO-RIGHT OVERRIDE",
  0x202e: "RIGHT-TO-LEFT OVERRIDE", 0x202f: "NARROW NO-BREAK SPACE", 0x205f: "MEDIUM MATHEMATICAL SPACE",
  0x2060: "WORD JOINER", 0x2061: "FUNCTION APPLICATION", 0x2062: "INVISIBLE TIMES",
  0x2063: "INVISIBLE SEPARATOR", 0x2064: "INVISIBLE PLUS", 0x2066: "LEFT-TO-RIGHT ISOLATE",
  0x2067: "RIGHT-TO-LEFT ISOLATE", 0x2068: "FIRST STRONG ISOLATE", 0x2069: "POP DIRECTIONAL ISOLATE",
  0x3000: "IDEOGRAPHIC SPACE", 0xfeff: "ZERO WIDTH NO-BREAK SPACE", 0xfff9: "INTERLINEAR ANNOTATION ANCHOR",
  0xfffa: "INTERLINEAR ANNOTATION SEPARATOR", 0xfffb: "INTERLINEAR ANNOTATION TERMINATOR",
};

function isStripCodepoint(codepoint: number) {
  return STRIP_CODEPOINTS.has(codepoint)
    || (codepoint >= 0xe0001 && codepoint <= 0xe007f)
    || (codepoint >= 0xe0100 && codepoint <= 0xe01ef);
}

function stripKind(codepoint: number): InspectKind {
  if (codepoint >= 0xe0001 && codepoint <= 0xe007f) return "tag_chars";
  if ((codepoint >= 0xe0100 && codepoint <= 0xe01ef) || (codepoint >= 0xfe00 && codepoint <= 0xfe0f) || (codepoint >= 0x180b && codepoint <= 0x180d)) return "variation_selector";
  if (BIDI_CODEPOINTS.has(codepoint)) return "bidi";
  if (ZERO_WIDTH_CODEPOINTS.has(codepoint)) return "zwj_family";
  return "strip";
}

function codepointLabel(codepoint: number) {
  return `U+${codepoint.toString(16).toUpperCase().padStart(4, "0")}`;
}

function unicodeName(codepoint: number) {
  if (CHARACTER_NAMES[codepoint]) return CHARACTER_NAMES[codepoint];
  if (codepoint >= 0xfe00 && codepoint <= 0xfe0f) return `VARIATION SELECTOR-${codepoint - 0xfdff}`;
  if (codepoint >= 0xe0100 && codepoint <= 0xe01ef) return `VARIATION SELECTOR-${codepoint - 0xe00ef}`;
  if (codepoint >= 0xe0020 && codepoint <= 0xe007e) return `TAG ${String.fromCodePoint(codepoint - 0xe0000).toUpperCase()}`;
  if (codepoint >= 0x206a && codepoint <= 0x206f) return "DEPRECATED DIRECTIONAL FORMAT CONTROL";
  if (CONFUSABLES[codepoint]) return "LATIN LOOKALIKE";
  return "UNICODE FORMAT CHARACTER";
}

function unicodeCategory(codepoint: number, character: string) {
  if ((codepoint >= 0xfe00 && codepoint <= 0xfe0f) || (codepoint >= 0xe0100 && codepoint <= 0xe01ef) || (codepoint >= 0x180b && codepoint <= 0x180d)) return "Mn";
  if (SPACE_HOMOGLYPHS.has(codepoint)) return "Zs";
  if (/\p{Cf}/u.test(character)) return "Cf";
  if (/\p{L}/u.test(character)) return "L";
  return "Cn";
}

function fullLabel(character: string) {
  const cp = character.codePointAt(0) ?? 0;
  return `${codepointLabel(cp)} ${unicodeName(cp)} (${unicodeCategory(cp, character)})`;
}

function increment(target: Record<string, number>, key: string) {
  target[key] = (target[key] ?? 0) + 1;
}

export function inspectText(input: string, options: { aggressive?: boolean } = {}): TextInspectReport {
  const buckets = new Map<string, { cp: number; character: string; kind: InspectKind; offsets: number[] }>();
  let offset = 0;
  for (const character of input) {
    const cp = character.codePointAt(0) ?? 0;
    let kind: InspectKind | null = null;
    if (isStripCodepoint(cp)) kind = stripKind(cp);
    else if (SPACE_HOMOGLYPHS.has(cp)) kind = "space";
    else if (options.aggressive && CONFUSABLES[cp]) kind = "confusable";
    else if (/\p{Cf}/u.test(character) && cp !== 0x00ad) kind = "other_cf";
    if (kind) {
      const key = `${cp}:${kind}`;
      const bucket = buckets.get(key) ?? { cp, character, kind, offsets: [] };
      if (bucket.offsets.length < 10) bucket.offsets.push(offset);
      buckets.set(key, bucket);
    }
    offset += 1;
  }
  const hits = [...buckets.values()]
    .map((bucket) => ({
      codepoint: codepointLabel(bucket.cp),
      label: fullLabel(bucket.character),
      count: countCodepoint(input, bucket.cp, bucket.kind, options.aggressive === true),
      kind: bucket.kind,
      sampleOffsets: bucket.offsets,
    }))
    .sort((a, b) => b.count - a.count || a.codepoint.localeCompare(b.codepoint));
  const suspiciousTotal = hits.reduce((sum, hit) => sum + hit.count, 0);
  const notes = [
    "Layer A only: invisible and format Unicode plus space lookalikes.",
    "Statistical token-sampling marks are not detectable here; Layer B is a separate best-effort rewrite.",
  ];
  if (hits.length === 0) notes.push("No suspicious Unicode characters found.");
  return { length: Array.from(input).length, suspiciousTotal, hits, notes };
}

function countCodepoint(input: string, codepoint: number, kind: InspectKind, aggressive: boolean) {
  let count = 0;
  for (const character of input) {
    const cp = character.codePointAt(0) ?? 0;
    if (cp !== codepoint) continue;
    if (kind === "confusable" && !aggressive) continue;
    count += 1;
  }
  return count;
}

export function cleanText(input: string, options: CleanOptions = {}): CleanResult {
  const normalizeSpaces = options.normalizeSpaces ?? true;
  const normalizeConfusables = options.normalizeConfusables ?? false;
  const removed: Record<string, number> = {};
  const replaced: Record<string, number> = {};
  const output: string[] = [];

  for (const character of input) {
    const codepoint = character.codePointAt(0) ?? 0;
    if (isStripCodepoint(codepoint)) {
      increment(removed, fullLabel(character));
      continue;
    }
    if (normalizeSpaces && SPACE_HOMOGLYPHS.has(codepoint)) {
      increment(replaced, fullLabel(character));
      output.push(" ");
      continue;
    }
    if (normalizeConfusables && CONFUSABLES[codepoint]) {
      increment(replaced, fullLabel(character));
      output.push(CONFUSABLES[codepoint]);
      continue;
    }
    if (/\p{Cf}/u.test(character)) {
      increment(removed, fullLabel(character));
      continue;
    }
    output.push(character);
  }

  let cleanedText = output.join("");
  if (options.nfkc) {
    const normalized = cleanedText.normalize("NFKC");
    if (normalized !== cleanedText) increment(replaced, "NFKC normalization");
    cleanedText = normalized;
  }

  return {
    cleanedText,
    stats: {
      inputLength: Array.from(input).length,
      outputLength: Array.from(cleanedText).length,
      removedCount: Object.values(removed).reduce((sum, value) => sum + value, 0),
      replacedCount: Object.entries(replaced).reduce((sum, [key, value]) => sum + (key === "NFKC normalization" ? 0 : value), 0),
      removed,
      replaced,
    },
  };
}

export const MAX_TEXT_LENGTH = 50_000;
export const SOURCE_LABELS = new Set<SourceLabel>(["claude", "chatgpt", "gemini", "other", "unknown"]);
