import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './shared/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function testUserCreation() {
  try {
    console.log('Création d\'un utilisateur test...');
    
    const newUser = {
      username: 'test_user',
      password: 'test_password',
      firstName: 'Test',
      email: 'test@example.com'
    };

    const [createdUser] = await db.insert(schema.users)
      .values(newUser)
      .returning();

    console.log('Utilisateur créé avec succès:', createdUser);

    // Vérification de la création
    const [retrievedUser] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.username, 'test_user'));

    console.log('\nUtilisateur récupéré de la base de données:');
    console.log(retrievedUser);

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
  } finally {
    await pool.end();
  }
}

testUserCreation(); 