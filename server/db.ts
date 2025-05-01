import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Forcer l'utilisation d'IPv4
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  host: '127.0.0.1' // Utiliser l'adresse IPv4 locale
});

export { pool };
export const db = drizzle(pool, { schema });