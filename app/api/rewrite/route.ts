import { NextResponse } from "next/server";
import { MAX_TEXT_LENGTH, SOURCE_LABELS, type SourceLabel } from "@/lib/clean-text";
import { recordsCollection } from "@/lib/mongodb";
import { createDeletionToken, type CleanRecord } from "@/lib/records";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildRewritePrompt, rewriteConfiguration, rewriteText, type RewriteStrength } from "@/lib/rewrite-text";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 150;

const STRENGTHS = new Set<RewriteStrength>(["paraphrase", "backtranslate", "structural"]);

export async function GET() {
  const configuration = rewriteConfiguration();
  return NextResponse.json({ enabled: configuration.enabled, model: configuration.enabled ? configuration.displayModel : null }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site") return error("Cross-site requests are not allowed.", 403);
    const rateLimit = checkRateLimit(request);
    if (!rateLimit.allowed) return error("Too many rewrite requests. Try again shortly.", 429, rateLimit.retryAfter);
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 250_000) return error("Request is too large.", 413);
    const body = await request.json();
    const text = typeof body.text === "string" ? body.text : "";
    const source = SOURCE_LABELS.has(body.source) ? body.source as SourceLabel : "unknown";
    const strength = STRENGTHS.has(body.strength) ? body.strength as RewriteStrength : "paraphrase";
    const language = typeof body.language === "string" && body.language.trim() ? body.language.trim().slice(0, 40) : "French";
    const originalLanguage = typeof body.originalLanguage === "string" && body.originalLanguage.trim() ? body.originalLanguage.trim().slice(0, 40) : "English";
    const promptOnly = body.promptOnly === true;
    if (!text.trim()) return error("Paste text before rewriting.", 400);
    if (Array.from(text).length > MAX_TEXT_LENGTH) return error(`Text is limited to ${MAX_TEXT_LENGTH.toLocaleString()} characters.`, 413);
    if (body.ownsContent !== true) return error("Ownership or authorization is required.", 400);
    if (promptOnly) return NextResponse.json({ prompt: buildRewritePrompt(strength, text, language, originalLanguage) }, { headers: { "Cache-Control": "no-store" } });
    if (body.storageConsent !== true) return error("Storage consent is required for a hosted rewrite.", 400);

    const result = await rewriteText({ text, strength, source, language, originalLanguage });
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000);
    const deletion = createDeletionToken();
    const collection = await recordsCollection<CleanRecord>();
    const inserted = await collection.insertOne({
      schemaVersion: 2,
      operation: "text-rewrite",
      inputText: text,
      cleanedText: result.rewrittenText,
      source,
      stats: result.layerAStats,
      rewrite: { strength, backend: result.backend, model: result.model },
      consent: { ownsContent: true, storage: true, acceptedAt: now },
      deletionTokenHash: deletion.hash,
      createdAt: now,
      expiresAt,
    });
    return NextResponse.json({
      rewrittenText: result.rewrittenText,
      stats: result.layerAStats,
      note: result.note,
      model: result.model,
      record: { id: inserted.insertedId.toHexString(), deletionToken: deletion.token, expiresAt: expiresAt.toISOString() },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("rewrite_request_failed", cause instanceof Error ? cause.message : "unknown");
    const message = cause instanceof Error && cause.message === "Layer B model access is not configured."
      ? "Hosted Layer B rewriting is not configured. Generate the upstream-compatible prompt instead."
      : "The rewrite is temporarily unavailable. Your text was not stored by Aiso.";
    return error(message, 503);
  }
}

function error(message: string, status: number, retryAfter?: number) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store", ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) },
  });
}
