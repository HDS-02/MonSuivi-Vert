import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

// Configuration de la base de données
const pool = new Pool({
  connectionString: 'postgresql://postgres.rrvlihoixjwteiowfgdf:Tugny-02640@aws-0-eu-west-3.pooler.supabase.com:5432/postgres',
  ssl: false
});

// Création de l'instance drizzle
export const db = drizzle(pool, { schema });