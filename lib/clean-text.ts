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

function shouldStrip(codepoint: number) {
  return STRIP_CODEPOINTS.has(codepoint)
    || (codepoint >= 0xe0001 && codepoint <= 0xe007f)
    || (codepoint >= 0xe0100 && codepoint <= 0xe01ef);
}

function label(character: string) {
  const cp = character.codePointAt(0) ?? 0;
  return `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
}

function increment(target: Record<string, number>, key: string) {
  target[key] = (target[key] ?? 0) + 1;
}

export function cleanText(input: string, options: CleanOptions = {}): CleanResult {
  const normalizeSpaces = options.normalizeSpaces ?? true;
  const normalizeConfusables = options.normalizeConfusables ?? false;
  const removed: Record<string, number> = {};
  const replaced: Record<string, number> = {};
  const output: string[] = [];

  for (const character of input) {
    const codepoint = character.codePointAt(0) ?? 0;
    if (shouldStrip(codepoint)) {
      increment(removed, label(character));
      continue;
    }
    if (normalizeSpaces && SPACE_HOMOGLYPHS.has(codepoint)) {
      increment(replaced, label(character));
      output.push(" ");
      continue;
    }
    if (normalizeConfusables && CONFUSABLES[codepoint]) {
      increment(replaced, label(character));
      output.push(CONFUSABLES[codepoint]);
      continue;
    }
    if (/\p{Cf}/u.test(character)) {
      increment(removed, label(character));
      continue;
    }
    output.push(character);
  }

  let cleanedText = output.join("");
  if (options.nfkc) {
    const normalized = cleanedText.normalize("NFKC");
    if (normalized !== cleanedText) increment(replaced, "NFKC");
    cleanedText = normalized;
  }

  return {
    cleanedText,
    stats: {
      inputLength: Array.from(input).length,
      outputLength: Array.from(cleanedText).length,
      removedCount: Object.values(removed).reduce((sum, value) => sum + value, 0),
      replacedCount: Object.entries(replaced).reduce((sum, [key, value]) => sum + (key === "NFKC" ? 0 : value), 0),
      removed,
      replaced,
    },
  };
}

export const MAX_TEXT_LENGTH = 50_000;
export const SOURCE_LABELS = new Set<SourceLabel>(["claude", "chatgpt", "gemini", "other", "unknown"]);
