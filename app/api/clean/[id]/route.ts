import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { recordsCollection } from "@/lib/mongodb";
import { hashDeletionToken, safeTokenMatch, type CleanRecord } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: RouteContext<"/api/clean/[id]">) {
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site") return response("Cross-site requests are not allowed.", 403);
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) return response("Record not found.", 404);
    const token = request.headers.get("x-deletion-token") || "";
    if (!token) return response("Deletion token is required.", 401);

    const collection = await recordsCollection<CleanRecord>();
    const record = await collection.findOne({ _id: new ObjectId(id) }, { projection: { deletionTokenHash: 1 } });
    if (!record) return response("Record not found.", 404);
    if (!safeTokenMatch(hashDeletionToken(token), record.deletionTokenHash)) return response("Deletion token is invalid.", 403);

    await collection.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("delete_request_failed", cause instanceof Error ? cause.message : "unknown");
    return response("Deletion is temporarily unavailable.", 503);
  }
}

function response(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
