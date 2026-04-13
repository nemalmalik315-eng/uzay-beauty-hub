import { createClient, type Client } from "@libsql/client";

let client: Client;

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:uzay.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export default getDb;
