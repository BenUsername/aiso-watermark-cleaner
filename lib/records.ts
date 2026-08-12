import "server-only";
import crypto from "node:crypto";
import type { ObjectId } from "mongodb";
import type { CleanStats, SourceLabel } from "@/lib/clean-text";

export type CleanRecord = {
  _id?: ObjectId;
  schemaVersion: 1;
  inputText: string;
  cleanedText: string;
  source: SourceLabel;
  stats: CleanStats;
  consent: { ownsContent: true; storage: true; acceptedAt: Date };
  deletionTokenHash: string;
  createdAt: Date;
  expiresAt: Date;
};

export function createDeletionToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, hash: hashDeletionToken(token) };
}

export function hashDeletionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function safeTokenMatch(actual: string, expected: string) {
  const a = Buffer.from(actual, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
