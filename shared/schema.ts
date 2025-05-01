import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
  reminderTime: text("reminder_time").default("08:00"), // Heure à laquelle envoyer les rappels (format HH:MM)
  isAdmin: boolean("is_admin").default(false), // Indique si l'utilisateur est administrateur
});

// Plant table
export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  species: text("species"),
  status: text("status").notNull().default("healthy"), // healthy, warning, danger
  image: text("image"),
  gallery: json("gallery").default('[]'), // Array of image URLs
  dateAdded: timestamp("date_added").defaultNow(),
  wateringFrequency: integer("watering_frequency"), // days
  light: text("light"), // indirect, direct, shade
  temperature: text("temperature"), // optimal temperature range
  careNotes: text("care_notes"),
  potSize: text("pot_size"), // Taille du pot recommandée
  commonDiseases: json("common_diseases").default('[]'), // Maladies fréquentes (tableau)
  autoWatering: boolean("auto_watering").default(false), // Arrosage automatique programmé
  reminderTime: text("reminder_time").default("08:00"), // Heure de rappel personnalisée (format HH:MM)
  userId: integer("user_id").notNull().default(1), // Foreign key to users table
});

// Plant analysis history
export const plantAnalyses = pgTable("plant_analyses", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").notNull(),
  date: timestamp("date").defaultNow(),
  status: text("status").notNull(),
  image: text("image"),
  aiAnalysis: json("ai_analysis"), // Store full AI response
  healthIssues: text("health_issues"),
  recommendations: text("recommendations"),
});

// Tasks table for reminders and actions
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").notNull(),
  type: text("type").notNull(), // water, fertilize, repot, move, etc.
  description: text("description").notNull(),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  dateCompleted: timestamp("date_completed"),
});

// Journal de croissance
export const growthJournal = pgTable("growth_journal", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").notNull(),
  date: timestamp("date").defaultNow(),
  title: text("title").notNull(),
  notes: text("notes"),
  imageUrl: text("image_url"),
  height: integer("height"), // hauteur en cm
  leaves: integer("leaves"), // nombre de feuilles
  healthRating: integer("health_rating"), // note de santé de 1 à 5
  userId: integer("user_id").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  plants: many(plants),
  growthEntries: many(growthJournal),
  tips: many(communityTips),
  comments: many(communityComments),
}));

export const plantsRelations = relations(plants, ({ one, many }) => ({
  user: one(users, {
    fields: [plants.userId],
    references: [users.id],
  }),
  analyses: many(plantAnalyses),
  tasks: many(tasks),
  growthEntries: many(growthJournal),
}));

export const plantAnalysesRelations = relations(plantAnalyses, ({ one }) => ({
  plant: one(plants, {
    fields: [plantAnalyses.plantId],
    references: [plants.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  plant: one(plants, {
    fields: [tasks.plantId],
    references: [plants.id],
  }),
}));

export const growthJournalRelations = relations(growthJournal, ({ one }) => ({
  plant: one(plants, {
    fields: [growthJournal.plantId],
    references: [plants.id],
  }),
  user: one(users, {
    fields: [growthJournal.userId],
    references: [users.id],
  }),
}));

// Schemas for inserting data
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPlantSchema = createInsertSchema(plants).omit({
  id: true,
  dateAdded: true,
});

export const insertPlantAnalysisSchema = createInsertSchema(plantAnalyses).omit({
  id: true,
  date: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  dateCompleted: true, // On omet la date de complétion puisqu'elle n'est définie que lorsque la tâche est complétée
}).extend({
  completed: z.boolean().default(false).optional(), // On rend le champ "completed" optionnel avec false par défaut
  dueDate: z.string().transform(str => new Date(str)).or(z.date()).optional(), // Accepte une date ou une chaîne (qui sera convertie en date)
});

// Types 
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Plant = typeof plants.$inferSelect;
export type InsertPlant = z.infer<typeof insertPlantSchema>;

export type PlantAnalysis = typeof plantAnalyses.$inferSelect;
export type InsertPlantAnalysis = z.infer<typeof insertPlantAnalysisSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export const insertGrowthJournalSchema = createInsertSchema(growthJournal).omit({
  id: true,
  date: true,
});

export type GrowthJournalEntry = typeof growthJournal.$inferSelect;
export type InsertGrowthJournalEntry = z.infer<typeof insertGrowthJournalSchema>;

// Badges types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "entretien" | "analyse" | "collection" | "progression";
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

// Tables pour les fonctionnalités communautaires
export const communityTips = pgTable("community_tips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  plantSpecies: text("plant_species"),
  rating: integer("rating").default(0),
  votes: integer("votes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  tags: json("tags").$type<string[]>().default([]),
  imageUrl: text("image_url"),
  category: text("category"), // Entretien, Maladies, Arrosage, etc.
  approved: boolean("approved").default(false),
  validated: boolean("validated").default(false),
});

export const communityComments = pgTable("community_comments", {
  id: serial("id").primaryKey(),
  tipId: integer("tip_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  likes: integer("likes").default(0),
});

// Relations pour les tables communautaires
export const communityTipsRelations = relations(communityTips, ({ one, many }) => ({
  author: one(users, {
    fields: [communityTips.userId],
    references: [users.id],
  }),
  comments: many(communityComments),
}));

export const communityCommentsRelations = relations(communityComments, ({ one }) => ({
  tip: one(communityTips, {
    fields: [communityComments.tipId],
    references: [communityTips.id],
  }),
  author: one(users, {
    fields: [communityComments.userId],
    references: [users.id],
  }),
}));

// Les relations des utilisateurs sont déjà définies plus haut

// Schemas pour l'insertion de données
export const insertCommunityTipSchema = createInsertSchema(communityTips).omit({
  id: true,
  createdAt: true,
  votes: true,
  rating: true,
});

export const insertCommunityCommentSchema = createInsertSchema(communityComments).omit({
  id: true,
  createdAt: true,
  likes: true,
});

// Types
export type CommunityTip = typeof communityTips.$inferSelect;
export type InsertCommunityTip = z.infer<typeof insertCommunityTipSchema>;

export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;

// API response types for AI analysis
export interface PlantAnalysisResponse {
  plantName?: string;
  species?: string;
  status: "healthy" | "warning" | "danger";
  healthIssues?: string[];
  recommendations: string[];
  careInstructions: {
    watering?: string;
    light?: string;
    temperature?: string;
    additional?: string[];
  };
}

export const forumCategories = [
  'conseils',
  'questions',
  'partage',
  'identification',
  'maladies',
  'autres'
] as const;

export type ForumCategory = typeof forumCategories[number];

export interface ForumPost {
  id: number;
  title: string;
  content: string;
  category: ForumCategory;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  approved: boolean;
  rejected: boolean;
  rejectionReason?: string;
  likes: number;
  dislikes: number;
  userVote?: 'like' | 'dislike';
  comments: ForumComment[];
  author: {
    id: number;
    username: string;
    avatar?: string;
  };
}

export interface ForumComment {
  id: number;
  content: string;
  userId: number;
  postId: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    username: string;
    avatar?: string;
  };
}

export const createForumPostSchema = z.object({
  title: z.string().min(5).max(100),
  content: z.string().min(20).max(5000),
  category: z.enum(forumCategories),
});

export const createForumCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  postId: z.number(),
});

export const voteForumPostSchema = z.object({
  vote: z.enum(['like', 'dislike']),
});

export const rejectForumPostSchema = z.object({
  reason: z.string().min(10).max(500),
});
