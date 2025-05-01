import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:Tugny-02640@db.rrvlihoixjwteiowfgdf.supabase.co:5432/postgres'
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Connexion à Supabase réussie !');
    
    const result = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log('Tables disponibles :', result.rows.map(row => row.table_name));
    
    // Vérification spécifique de la table users
    const usersResult = await client.query('SELECT COUNT(*) FROM users');
    console.log('Nombre d\'utilisateurs enregistrés :', usersResult.rows[0].count);
    
    client.release();
  } catch (err) {
    console.error('Erreur de connexion à Supabase :', err);
  } finally {
    await pool.end();
  }
}

testConnection(); 