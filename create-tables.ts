import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from './shared/schema';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function createTables() {
  try {
    console.log('Création des tables...');
    await db.execute(sql`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      first_name TEXT,
      email TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      reminder_time TEXT DEFAULT '08:00'
    )`);
    
    await db.execute(sql`CREATE TABLE IF NOT EXISTS plants (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      species TEXT,
      status TEXT NOT NULL DEFAULT 'healthy',
      image TEXT,
      gallery JSONB DEFAULT '[]',
      date_added TIMESTAMP DEFAULT NOW(),
      watering_frequency INTEGER,
      light TEXT,
      temperature TEXT,
      care_notes TEXT,
      pot_size TEXT,
      common_diseases JSONB DEFAULT '[]',
      auto_watering BOOLEAN DEFAULT false,
      reminder_time TEXT DEFAULT '08:00',
      user_id INTEGER NOT NULL DEFAULT 1
    )`);
    
    console.log('Tables créées avec succès !');
  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);
  } finally {
    await pool.end();
  }
}

createTables(); 