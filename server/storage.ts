import { 
  plants, Plant, InsertPlant, 
  tasks, Task, InsertTask,
  plantAnalyses, PlantAnalysis, InsertPlantAnalysis,
  users, User, InsertUser,
  growthJournal, GrowthJournalEntry, InsertGrowthJournalEntry
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

export interface IStorage {
  // User CRUD methods
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Plant CRUD methods
  getPlants(): Promise<Plant[]>;
  getPlantsByUserId(userId: number): Promise<Plant[]>;
  getPlantsByIds(ids: number[]): Promise<Plant[]>;
  getPlant(id: number): Promise<Plant | undefined>;
  createPlant(plant: InsertPlant): Promise<Plant>;
  updatePlant(id: number, plant: Partial<Plant>): Promise<Plant | undefined>;
  deletePlant(id: number): Promise<boolean>;
  
  // Task CRUD methods
  getTasks(): Promise<Task[]>;
  getTasksByPlantId(plantId: number): Promise<Task[]>;
  getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]>;
  getPendingTasks(): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  completeTask(id: number): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Plant Analysis CRUD methods
  getPlantAnalyses(plantId: number): Promise<PlantAnalysis[]>;
  getLatestPlantAnalysis(plantId: number): Promise<PlantAnalysis | undefined>;
  createPlantAnalysis(analysis: InsertPlantAnalysis): Promise<PlantAnalysis>;
  
  // Journal de croissance CRUD methods
  getGrowthJournalEntries(plantId: number): Promise<GrowthJournalEntry[]>;
  getGrowthJournalEntriesByUserId(userId: number): Promise<GrowthJournalEntry[]>;
  getGrowthJournalEntry(id: number): Promise<GrowthJournalEntry | undefined>;
  createGrowthJournalEntry(entry: InsertGrowthJournalEntry): Promise<GrowthJournalEntry>;
  updateGrowthJournalEntry(id: number, updates: Partial<GrowthJournalEntry>): Promise<GrowthJournalEntry | undefined>;
  deleteGrowthJournalEntry(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private plants: Map<number, Plant>;
  private tasks: Map<number, Task>;
  private plantAnalyses: Map<number, PlantAnalysis>;
  private userIdCounter: number;
  private plantIdCounter: number;
  private taskIdCounter: number;
  private analysisIdCounter: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.plants = new Map();
    this.tasks = new Map();
    this.plantAnalyses = new Map();
    
    this.userIdCounter = 1;
    this.plantIdCounter = 1;
    this.taskIdCounter = 1;
    this.analysisIdCounter = 1;
    
    // Create session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h
    });
    
    // Initialize with sample data
    this.initSampleData();
  }
  
  // User CRUD methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values())
      .find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const newUser: User = { ...user, id, createdAt };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async getPlantsByUserId(userId: number): Promise<Plant[]> {
    return Array.from(this.plants.values())
      .filter(plant => plant.userId === userId);
  }

  private initSampleData() {
    // URL d'image pour la plante de démonstration
    const monsteraImageUrl = "https://images.pexels.com/photos/3571563/pexels-photo-3571563.jpeg?auto=compress&cs=tinysrgb&w=400";
    
    // Une seule plante de démonstration avec une image
    const monstera: InsertPlant = {
      name: "Monstera Deliciosa",
      species: "Monstera deliciosa",
      status: "healthy",
      image: monsteraImageUrl,
      wateringFrequency: 7,
      light: "Indirecte brillante",
      temperature: "18-27°C",
      careNotes: "Arrosez uniquement lorsque les premiers centimètres du sol sont secs. Préfère une lumière vive mais indirecte. Apprécie l'humidité. Nettoyez régulièrement les grandes feuilles pour qu'elles puissent bien respirer.",
      userId: 1 // Associée à l'utilisateur de test
    };
    
    // Créer une seule plante de démonstration
    const plant = this.createPlant(monstera);
    console.log("Plante de démonstration créée avec l'image:", monsteraImageUrl);
    
    // Une tâche d'exemple
    this.createTask({
      plantId: plant.id,
      type: "water",
      description: "Arroser la Monstera cette semaine",
      dueDate: new Date(),
      completed: false
    });
    
    // Une analyse d'exemple
    this.createPlantAnalysis({
      plantId: plant.id,
      status: "healthy",
      image: monsteraImageUrl,
      healthIssues: "",
      recommendations: "La plante est en excellente santé. Continuez avec les soins actuels."
    });
  }

  // Plant CRUD methods
  async getPlants(): Promise<Plant[]> {
    return Array.from(this.plants.values());
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    return this.plants.get(id);
  }

  async createPlant(plant: InsertPlant): Promise<Plant> {
    const id = this.plantIdCounter++;
    const dateAdded = new Date();
    const newPlant: Plant = { ...plant, id, dateAdded };
    this.plants.set(id, newPlant);
    return newPlant;
  }

  async updatePlant(id: number, updates: Partial<Plant>): Promise<Plant | undefined> {
    const plant = this.plants.get(id);
    if (!plant) return undefined;
    
    const updatedPlant = { ...plant, ...updates };
    this.plants.set(id, updatedPlant);
    return updatedPlant;
  }

  async deletePlant(id: number): Promise<boolean> {
    return this.plants.delete(id);
  }
  
  // Task CRUD methods
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByPlantId(plantId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.plantId === plantId);
  }
  
  async getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate >= startDate && taskDate < endDate;
      });
  }
  
  async getPlantsByIds(ids: number[]): Promise<Plant[]> {
    return Array.from(this.plants.values())
      .filter(plant => ids.includes(plant.id));
  }
  
  async getPendingTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => !task.completed);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const newTask: Task = { ...task, id };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async completeTask(id: number): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { 
      ...task, 
      completed: true, 
      dateCompleted: new Date() 
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Plant Analysis CRUD methods
  async getPlantAnalyses(plantId: number): Promise<PlantAnalysis[]> {
    return Array.from(this.plantAnalyses.values())
      .filter(analysis => analysis.plantId === plantId)
      .sort((a, b) => {
        // Sort by date descending (newest first)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }
  
  async getLatestPlantAnalysis(plantId: number): Promise<PlantAnalysis | undefined> {
    const analyses = await this.getPlantAnalyses(plantId);
    return analyses.length > 0 ? analyses[0] : undefined;
  }

  async createPlantAnalysis(analysis: InsertPlantAnalysis): Promise<PlantAnalysis> {
    const id = this.analysisIdCounter++;
    const date = new Date();
    const newAnalysis: PlantAnalysis = { ...analysis, id, date };
    this.plantAnalyses.set(id, newAnalysis);
    return newAnalysis;
  }
}

// Import la version persistante de notre storage avec base de données
import { DatabaseStorage } from "./DatabaseStorage";

// Commentez cette ligne pour utiliser le stockage en mémoire
// export const storage = new MemStorage();

// Utilisez cette ligne pour le stockage en base de données
export const storage = new DatabaseStorage();
