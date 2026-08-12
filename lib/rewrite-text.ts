import { cleanText } from "./clean-text";
import type { SourceLabel } from "./clean-text";
import { generateText } from "ai";

export type RewriteStrength = "paraphrase" | "backtranslate" | "structural";

const PROMPTS = {
  paraphrase: (text: string) =>
    "Rewrite the following text so that every sentence uses different wording and structure while preserving all facts, numbers, names, and technical identifiers. Do not add or remove claims. Output only the rewritten text.\n\n---\n" + text,
  backtranslate: (text: string, language: string, originalLanguage: string) =>
    `Translate the text to ${language}, then translate that result back to ${originalLanguage}. Preserve all facts, numbers, and names. Output only the final ${originalLanguage} text.\n\n---\n${text}`,
  structural: (text: string) =>
    "First extract a bullet outline of all claims (no full sentences). Then write a complete document from that outline in a clear professional style without omitting any bullet. Output only the final document.\n\n---\n" + text,
};

export function buildRewritePrompt(
  strength: RewriteStrength,
  text: string,
  language = "French",
  originalLanguage = "English",
) {
  if (strength === "paraphrase") return PROMPTS.paraphrase(text);
  if (strength === "backtranslate") return PROMPTS.backtranslate(text, language, originalLanguage);
  return PROMPTS.structural(text);
}

export function rewriteConfiguration(source: SourceLabel = "unknown") {
  const directApiKey = process.env.WATERMARKS_REWRITE_API_KEY || process.env.OPENAI_API_KEY || "";
  const baseUrl = (process.env.WATERMARKS_REWRITE_BASE_URL || "https://api.openai.com").replace(/\/+$/, "");
  const directModel = process.env.WATERMARKS_REWRITE_MODEL || "gpt-5-mini";
  const gatewayAvailable = Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL === "1");
  const gatewayModels = source === "chatgpt"
    ? ["google/gemini-3-flash", "xai/grok-4.1-fast-non-reasoning"]
    : ["openai/gpt-5-mini", "xai/grok-4.1-fast-non-reasoning"];
  return {
    directApiKey,
    baseUrl,
    directModel,
    gatewayAvailable,
    gatewayModels,
    enabled: Boolean(directApiKey) || gatewayAvailable,
    displayModel: directApiKey ? directModel : gatewayModels[0],
  };
}

export async function rewriteText(input: {
  text: string;
  strength: RewriteStrength;
  source: SourceLabel;
  language?: string;
  originalLanguage?: string;
}) {
  const configuration = rewriteConfiguration(input.source);
  if (!configuration.enabled) throw new Error("Layer B model access is not configured.");
  const prompt = buildRewritePrompt(input.strength, input.text, input.language, input.originalLanguage);
  let content = "";
  let backend: "openai-compatible" | "vercel-ai-gateway";
  let model: string;
  if (configuration.directApiKey) {
    const response = await fetch(`${configuration.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${configuration.directApiKey}` },
      body: JSON.stringify({ model: configuration.directModel, messages: [{ role: "user", content: prompt }], temperature: 0.7 }),
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) {
      const message = (await response.text()).slice(0, 300);
      throw new Error(`Rewrite provider returned ${response.status}: ${message}`);
    }
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    content = payload.choices?.[0]?.message?.content?.trim() || "";
    backend = "openai-compatible";
    model = configuration.directModel;
  } else {
    const generated = await generateText({
      model: configuration.gatewayModels[0],
      prompt,
      temperature: 0.7,
      abortSignal: AbortSignal.timeout(120_000),
      providerOptions: {
        gateway: {
          models: configuration.gatewayModels.slice(1),
          cacheControl: "max-age=0",
          tags: ["feature:watermark-layer-b", `source:${input.source}`, `strength:${input.strength}`],
        },
      },
    });
    content = generated.text.trim();
    backend = "vercel-ai-gateway";
    model = generated.response.modelId;
  }
  if (!content) throw new Error("Rewrite provider returned an empty result.");
  const cleaned = cleanText(content);
  return {
    rewrittenText: cleaned.cleanedText,
    layerAStats: cleaned.stats,
    prompt,
    backend,
    model,
    note: "Layer B is best-effort against statistical token-sampling marks and cannot certify removal against a vendor detector.",
  };
}
