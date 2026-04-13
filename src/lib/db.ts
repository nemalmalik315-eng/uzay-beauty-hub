import { createClient, type Client } from "@libsql/client";

let client: Client;

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || "file:uzay.db";
    const authToken = process.env.TURSO_AUTH_TOKEN;

    client = createClient({ url, authToken });
  }
  return client;
}

export default getDb;
