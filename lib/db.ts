import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface Env {
  DB: D1Database;
  LINE_CHANNEL_ACCESS_TOKEN?: string;
  LINE_GROUP_ID?: string;
  ADMIN_SESSION_SECRET?: string;
}

let mockDb: D1Database | null = null;

export function setTestDatabase(db: D1Database | null) {
  mockDb = db;
}

export async function getD1Database(): Promise<D1Database> {
  if (mockDb) {
    return mockDb;
  }
  const { env } = await getCloudflareContext();
  return (env as any).DB as D1Database;
}
