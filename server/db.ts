import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

// Configuration de la base de données
const pool = new Pool({
  connectionString: 'postgresql://postgres:Tugny-02640@db.rrvlihoixjwteiowfgdf.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

// Création de l'instance drizzle
export const db = drizzle(pool, { schema });