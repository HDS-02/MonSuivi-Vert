import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './shared/schema';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function verifyTables() {
  try {
    console.log('Vérification des tables...');
    
    // Vérifier la table users
    const usersResult = await db.select().from(schema.users);
    console.log('Table users:', usersResult.length > 0 ? 'OK' : 'Vide');
    
    // Vérifier la table plants
    const plantsResult = await db.select().from(schema.plants);
    console.log('Table plants:', plantsResult.length > 0 ? 'OK' : 'Vide');
    
    // Vérifier la structure des tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\nTables disponibles dans la base de données:');
    console.log(tablesResult.rows.map(row => row.table_name).join('\n'));
    
  } catch (error) {
    console.error('Erreur lors de la vérification des tables:', error);
  } finally {
    await pool.end();
  }
}

verifyTables(); 