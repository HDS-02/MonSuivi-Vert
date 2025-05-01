import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  host: 'db.rrvlihoixjwteiowfgdf.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'Tugny-02640',
  database: 'postgres'
});

// Création de l'instance drizzle
export const db = drizzle(pool, { schema });