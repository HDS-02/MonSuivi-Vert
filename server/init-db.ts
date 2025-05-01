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
        first_name TEXT,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reminder_time TEXT DEFAULT '08:00'
      );

      CREATE TABLE IF NOT EXISTS plants (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        species TEXT,
        status TEXT NOT NULL DEFAULT 'healthy',
        image TEXT,
        gallery JSONB DEFAULT '[]',
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        watering_frequency INTEGER,
        light TEXT,
        temperature TEXT,
        care_notes TEXT,
        pot_size TEXT,
        common_diseases JSONB DEFAULT '[]',
        auto_watering BOOLEAN DEFAULT false,
        reminder_time TEXT DEFAULT '08:00',
        user_id INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        plant_id INTEGER REFERENCES plants(id),
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        due_date TIMESTAMP,
        completed BOOLEAN DEFAULT FALSE,
        date_completed TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS plant_analyses (
        id SERIAL PRIMARY KEY,
        plant_id INTEGER NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL,
        image TEXT,
        ai_analysis JSONB,
        health_issues TEXT,
        recommendations TEXT
      );

      CREATE TABLE IF NOT EXISTS growth_journal (
        id SERIAL PRIMARY KEY,
        plant_id INTEGER NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        title TEXT NOT NULL,
        notes TEXT,
        image_url TEXT,
        height INTEGER,
        leaves INTEGER,
        health_rating INTEGER,
        user_id INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS community_tips (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        plant_species TEXT,
        rating INTEGER DEFAULT 0,
        votes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tags JSONB DEFAULT '[]',
        image_url TEXT,
        category TEXT,
        approved BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS community_comments (
        id SERIAL PRIMARY KEY,
        tip_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        likes INTEGER DEFAULT 0
      );
    `);

    console.log("Base de données initialisée avec succès");
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données:", error);
  }
}

initDatabase(); 