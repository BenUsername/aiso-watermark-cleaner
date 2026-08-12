import { NextResponse } from "next/server";
import { cleanFile, inspectFile, MAX_FILE_BYTES } from "@/lib/clean-file";
import { SOURCE_LABELS, type SourceLabel } from "@/lib/clean-text";
import { recordsCollection } from "@/lib/mongodb";
import { createDeletionToken, type CleanRecord } from "@/lib/records";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site") return error("Cross-site requests are not allowed.", 403);
    const rateLimit = checkRateLimit(request);
    if (!rateLimit.allowed) return error("Too many file requests. Try again shortly.", 429, rateLimit.retryAfter);
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_FILE_BYTES + 256_000) return error("File is too large for the hosted cleaner.", 413);
    const form = await request.formData();
    const file = form.get("file");
    const mode = form.get("mode") === "clean" ? "clean" : "inspect";
    if (!(file instanceof File)) return error("Choose a file to inspect or clean.", 400);
    if (file.size > MAX_FILE_BYTES) return error(`Files are limited to ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB.`, 413);
    if (form.get("ownsContent") !== "true") return error("Ownership or authorization is required.", 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const normalizeConfusables = form.get("normalizeConfusables") === "true";
    const nfkc = form.get("nfkc") === "true";
    if (mode === "inspect") {
      const inspection = inspectFile(file.name, bytes, { aggressive: normalizeConfusables });
      return NextResponse.json({ inspection }, { headers: { "Cache-Control": "no-store" } });
    }
    if (form.get("storageConsent") !== "true") return error("Storage consent is required for file cleaning.", 400);
    const sourceValue = String(form.get("source") || "unknown");
    const source = SOURCE_LABELS.has(sourceValue as SourceLabel) ? sourceValue as SourceLabel : "unknown";
    const result = cleanFile(file.name, bytes, { normalizeSpaces: true, normalizeConfusables, nfkc });
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000);
    const deletion = createDeletionToken();
    const collection = await recordsCollection<CleanRecord>();
    const textLike = ["text", "markdown", "html", "svg"].includes(result.format);
    const inserted = await collection.insertOne({
      schemaVersion: 2,
      operation: "file-clean",
      ...(textLike ? { inputText: new TextDecoder().decode(bytes), cleanedText: new TextDecoder().decode(result.bytes) } : {}),
      source,
      file: {
        name: file.name,
        outputName: result.outputName,
        format: result.format,
        mimeType: file.type || "application/octet-stream",
        bytesIn: result.bytesIn,
        bytesOut: result.bytesOut,
        findings: result.before.findings.slice(0, 30),
        actions: result.actions.slice(0, 60),
        residual: {
          hasC2pa: result.after.hasC2pa,
          hasAiMetadata: result.after.hasAiMetadata,
          suspiciousUnicode: result.after.text?.suspiciousTotal ?? 0,
        },
      },
      consent: { ownsContent: true, storage: true, acceptedAt: now },
      deletionTokenHash: deletion.hash,
      createdAt: now,
      expiresAt,
    });
    const report = {
      format: result.format,
      actions: result.actions.slice(0, 30),
      before: inspectionSummary(result.before),
      after: inspectionSummary(result.after),
      bytesIn: result.bytesIn,
      bytesOut: result.bytesOut,
      record: { id: inserted.insertedId.toHexString(), deletionToken: deletion.token, expiresAt: expiresAt.toISOString() },
    };
    return new Response(Uint8Array.from(result.bytes).buffer, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": outputMime(result.format),
        "Content-Disposition": `attachment; filename="${result.outputName.replace(/["\\\r\n]/g, "_")}"`,
        "X-Aiso-Clean-Report": Buffer.from(JSON.stringify(report)).toString("base64url"),
      },
    });
  } catch (cause) {
    console.error("file_request_failed", cause instanceof Error ? cause.message : "unknown");
    const message = cause instanceof Error && /Unsupported|not a valid|truncated|Archive is too large|limited to/.test(cause.message)
      ? cause.message
      : "The file cleaner is temporarily unavailable. Your file was not stored.";
    return error(message, /too large|limited to/i.test(message) ? 413 : 400);
  }
}

function inspectionSummary(inspection: ReturnType<typeof inspectFile>) {
  return {
    kind: inspection.kind,
    format: inspection.format,
    hasC2pa: inspection.hasC2pa,
    hasAiMetadata: inspection.hasAiMetadata,
    findings: inspection.findings.slice(0, 20),
    suspiciousUnicode: inspection.text?.suspiciousTotal ?? 0,
  };
}

function outputMime(format: string) {
  return ({
    png: "image/png", jpeg: "image/jpeg", svg: "image/svg+xml", pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    odt: "application/vnd.oasis.opendocument.text", html: "text/html; charset=utf-8",
    markdown: "text/markdown; charset=utf-8", text: "text/plain; charset=utf-8",
  } as Record<string, string>)[format] || "application/octet-stream";
}

function error(message: string, status: number, retryAfter?: number) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store", ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) },
  });
}
