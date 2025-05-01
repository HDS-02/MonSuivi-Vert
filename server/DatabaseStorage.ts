import { db } from "./db";
import { plants, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

export class DatabaseStorage {
  public sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      },
      createTableIfMissing: true,
      tableName: 'session',
      ttl: 30 * 24 * 60 * 60, // 30 jours en secondes
      pruneSessionInterval: 60 * 60 // Vérifier toutes les heures
    });
  }

  // ... existing code ...
}