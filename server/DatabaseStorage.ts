import { 
  plants, Plant, InsertPlant, 
  tasks, Task, InsertTask,
  plantAnalyses, PlantAnalysis, InsertPlantAnalysis,
  users, User, InsertUser,
  growthJournal, GrowthJournalEntry, InsertGrowthJournalEntry
} from "@shared/schema";
import { db } from "./db";
import { pool } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session'
    });
  }
  
  // User CRUD methods
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true; // Supposons que la suppression a réussi
  }
  
  // Plant CRUD methods
  async getPlants(): Promise<Plant[]> {
    return await db.select().from(plants);
  }

  async getPlantsByUserId(userId: number): Promise<Plant[]> {
    return await db.select().from(plants).where(eq(plants.userId, userId));
  }
  
  async getPlantsByIds(ids: number[]): Promise<Plant[]> {
    // Si la liste est vide, retourner un tableau vide
    if (ids.length === 0) return [];
    
    // Utiliser la clause "in" pour récupérer les plantes correspondant aux IDs
    return await db.select().from(plants).where(
      // @ts-ignore - Le type n'est pas correctement reconnu mais l'opération est valide
      plants.id.in(ids)
    );
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    const [plant] = await db.select().from(plants).where(eq(plants.id, id));
    return plant;
  }

  async createPlant(plant: InsertPlant): Promise<Plant> {
    const [newPlant] = await db.insert(plants).values(plant).returning();
    return newPlant;
  }

  async updatePlant(id: number, updates: Partial<Plant>): Promise<Plant | undefined> {
    const [updatedPlant] = await db
      .update(plants)
      .set(updates)
      .where(eq(plants.id, id))
      .returning();
    return updatedPlant;
  }

  async deletePlant(id: number): Promise<boolean> {
    const result = await db.delete(plants).where(eq(plants.id, id));
    return true; // Supposons que la suppression a réussi
  }
  
  // Task CRUD methods
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTasksByPlantId(plantId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.plantId, plantId));
  }
  
  async getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          // Les tâches dont la date d'échéance est >= startDate
          tasks.dueDate.gte(startDate),
          // ET dont la date d'échéance est < endDate
          tasks.dueDate.lt(endDate)
        )
      );
  }
  
  async getPendingTasks(): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.completed, false));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }
  
  async completeTask(id: number): Promise<Task | undefined> {
    const [completedTask] = await db
      .update(tasks)
      .set({ 
        completed: true, 
        dateCompleted: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    return completedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return true; // Supposons que la suppression a réussi
  }
  
  // Plant Analysis CRUD methods
  async getPlantAnalyses(plantId: number): Promise<PlantAnalysis[]> {
    return await db
      .select()
      .from(plantAnalyses)
      .where(eq(plantAnalyses.plantId, plantId))
      .orderBy(desc(plantAnalyses.date));
  }
  
  async getLatestPlantAnalysis(plantId: number): Promise<PlantAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(plantAnalyses)
      .where(eq(plantAnalyses.plantId, plantId))
      .orderBy(desc(plantAnalyses.date))
      .limit(1);
    return analysis;
  }

  async createPlantAnalysis(analysis: InsertPlantAnalysis): Promise<PlantAnalysis> {
    const [newAnalysis] = await db
      .insert(plantAnalyses)
      .values({ ...analysis, date: new Date() })
      .returning();
    return newAnalysis;
  }
  
  // Journal de croissance CRUD methods
  async getGrowthJournalEntries(plantId: number): Promise<GrowthJournalEntry[]> {
    return await db
      .select()
      .from(growthJournal)
      .where(eq(growthJournal.plantId, plantId))
      .orderBy(desc(growthJournal.date));
  }
  
  async getGrowthJournalEntriesByUserId(userId: number): Promise<GrowthJournalEntry[]> {
    return await db
      .select()
      .from(growthJournal)
      .where(eq(growthJournal.userId, userId))
      .orderBy(desc(growthJournal.date));
  }
  
  async getGrowthJournalEntry(id: number): Promise<GrowthJournalEntry | undefined> {
    const [entry] = await db
      .select()
      .from(growthJournal)
      .where(eq(growthJournal.id, id));
    return entry;
  }
  
  async createGrowthJournalEntry(entry: InsertGrowthJournalEntry): Promise<GrowthJournalEntry> {
    const [newEntry] = await db
      .insert(growthJournal)
      .values({ ...entry, date: new Date() })
      .returning();
    return newEntry;
  }
  
  async updateGrowthJournalEntry(id: number, updates: Partial<GrowthJournalEntry>): Promise<GrowthJournalEntry | undefined> {
    const [updatedEntry] = await db
      .update(growthJournal)
      .set(updates)
      .where(eq(growthJournal.id, id))
      .returning();
    return updatedEntry;
  }
  
  async deleteGrowthJournalEntry(id: number): Promise<boolean> {
    const result = await db.delete(growthJournal).where(eq(growthJournal.id, id));
    return true; // Supposons que la suppression a réussi
  }
}