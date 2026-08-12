import "server-only";
import { MongoClient, type Collection, type Document } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var __watermarkCleanerMongo: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var __watermarkCleanerIndexes: Promise<string[]> | undefined;
}

function clientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  if (!global.__watermarkCleanerMongo) {
    global.__watermarkCleanerMongo = new MongoClient(uri, {
      appName: "aiso-watermark-cleaner",
      maxPoolSize: 8,
      serverSelectionTimeoutMS: 5_000,
    }).connect();
  }
  return global.__watermarkCleanerMongo;
}

export async function recordsCollection<T extends Document>(): Promise<Collection<T>> {
  const client = await clientPromise();
  const collection = client
    .db(process.env.MONGODB_DB || "aiso_watermark_cleaner")
    .collection<T>("clean_records");
  if (!global.__watermarkCleanerIndexes) {
    global.__watermarkCleanerIndexes = collection.createIndexes([
      { key: { expiresAt: 1 }, name: "expires_at_ttl", expireAfterSeconds: 0 },
      { key: { createdAt: -1 }, name: "created_at_desc" },
    ]);
  }
  await global.__watermarkCleanerIndexes;
  return collection;
}

export async function pingDatabase() {
  const client = await clientPromise();
  await client.db(process.env.MONGODB_DB || "aiso_watermark_cleaner").command({ ping: 1 });
}
