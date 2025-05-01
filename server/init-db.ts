import { db } from "./db";
import { users, plants, tasks, plantAnalyses, growthJournal, communityTips, communityComments } from "@shared/schema";

async function initDatabase() {
  try {
    // Créer les tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        firstName TEXT,
        email TEXT UNIQUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reminderTime TEXT,
        resetToken TEXT,
        resetTokenExpiry TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS plants (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        species TEXT,
        description TEXT,
        imageUrl TEXT,
        image TEXT,
        userId INTEGER REFERENCES users(id),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lastWatered TIMESTAMP,
        nextWatering TIMESTAMP,
        watering_frequency INTEGER,
        sunlight TEXT,
        temperature TEXT,
        humidity TEXT,
        soilType TEXT,
        fertilizer TEXT,
        notes TEXT,
        status TEXT DEFAULT 'active',
        gallery JSONB DEFAULT '[]'::jsonb
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        plantId INTEGER REFERENCES plants(id),
        type TEXT NOT NULL,
        dueDate TIMESTAMP NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS plant_analyses (
        id SERIAL PRIMARY KEY,
        plantId INTEGER REFERENCES plants(id),
        analysis TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS growth_journal (
        id SERIAL PRIMARY KEY,
        plantId INTEGER REFERENCES plants(id),
        userId INTEGER REFERENCES users(id),
        entry TEXT NOT NULL,
        imageUrl TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS community_tips (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        votes INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS community_comments (
        id SERIAL PRIMARY KEY,
        tipId INTEGER REFERENCES community_tips(id),
        userId INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        likes INTEGER DEFAULT 0
      );
    `);

    console.log("Base de données initialisée avec succès");
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données:", error);
  }
}

initDatabase(); 