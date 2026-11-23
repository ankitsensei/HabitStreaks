import { lookup, Resolver } from "node:dns/promises";
import type { PoolClient } from "pg";
import pkg from "pg";
import dotenv from "dotenv";

const { Pool } = pkg;

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const url = new URL(connectionString);

// Some routers/firewalls refuse DNS queries for Neon endpoints, which makes
// pg fail with ENOTFOUND. If the system resolver can't find the host, retry
// through public DNS and connect by IP while keeping the hostname for TLS SNI
// (Neon needs the hostname to route to the right endpoint).
async function resolveDatabaseHost() {
  try {
    await lookup(url.hostname);
    return { host: url.hostname, usedFallback: false };
  } catch {
    const resolver = new Resolver();
    resolver.setServers(["1.1.1.1", "8.8.8.8"]);

    const addresses = await resolver.resolve4(url.hostname);
    if (addresses.length === 0) {
      throw new Error(`Could not resolve database host ${url.hostname}`);
    }

    console.warn(
      `System DNS could not resolve ${url.hostname}. Using public DNS (${addresses[0]}).`,
    );

    return { host: addresses[0], usedFallback: true };
  }
}

const { host, usedFallback } = await resolveDatabaseHost();

const pool = usedFallback
  ? new Pool({
      host,
      port: Number(url.port || 5432),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      ssl: { rejectUnauthorized: false, servername: url.hostname },
    })
  : new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Required for secure Neon connections
      },
    });

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),

  // Runs `work` on a single dedicated connection inside BEGIN/COMMIT, so its
  // statements see each other's writes and nothing else can interleave
  // between them. Rolls back and rethrows if `work` fails.
  transaction: async <T>(work: (client: PoolClient) => Promise<T>): Promise<T> => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // The connection is already broken; releasing it below is enough.
      }
      throw error;
    } finally {
      client.release();
    }
  },
};
