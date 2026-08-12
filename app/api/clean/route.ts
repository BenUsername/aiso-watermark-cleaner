import { NextResponse } from "next/server";
import { cleanText, MAX_TEXT_LENGTH, SOURCE_LABELS, type SourceLabel } from "@/lib/clean-text";
import { recordsCollection } from "@/lib/mongodb";
import { createDeletionToken, type CleanRecord } from "@/lib/records";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site") return error("Cross-site requests are not allowed.", 403);
    const rateLimit = checkRateLimit(request);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many cleaning requests. Try again shortly." }, {
        status: 429,
        headers: { "Cache-Control": "no-store", "Retry-After": String(rateLimit.retryAfter) },
      });
    }
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 250_000) return error("Request is too large.", 413);

    const body = await request.json();
    const text = typeof body.text === "string" ? body.text : "";
    const source = SOURCE_LABELS.has(body.source) ? body.source as SourceLabel : "unknown";
    const ownsContent = body.ownsContent === true;
    const storageConsent = body.storageConsent === true;

    if (!text.trim()) return error("Paste text before cleaning.", 400);
    if (Array.from(text).length > MAX_TEXT_LENGTH) return error(`Text is limited to ${MAX_TEXT_LENGTH.toLocaleString()} characters.`, 413);
    if (!ownsContent || !storageConsent) return error("Ownership and storage consent are required.", 400);

    const result = cleanText(text, {
      normalizeSpaces: true,
      normalizeConfusables: body.normalizeConfusables === true,
      nfkc: body.nfkc === true,
    });
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000);
    const deletion = createDeletionToken();
    const collection = await recordsCollection<CleanRecord>();
    const inserted = await collection.insertOne({
      schemaVersion: 2,
      operation: "text-clean",
      inputText: text,
      cleanedText: result.cleanedText,
      source,
      stats: result.stats,
      consent: { ownsContent: true, storage: true, acceptedAt: now },
      deletionTokenHash: deletion.hash,
      createdAt: now,
      expiresAt,
    });

    return NextResponse.json({
      cleanedText: result.cleanedText,
      stats: result.stats,
      record: { id: inserted.insertedId.toHexString(), deletionToken: deletion.token, expiresAt: expiresAt.toISOString() },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("clean_request_failed", cause instanceof Error ? cause.message : "unknown");
    return error("The cleaner is temporarily unavailable. Your text was not stored.", 503);
  }
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
