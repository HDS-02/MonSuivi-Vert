import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum, varchar, primaryKey } from "drizzle-orm/pg-core";
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
  posts: many(communityPosts),
  postComments: many(communityPostComments),
  postVotes: many(communityPostVotes)
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
export type User = typeof users.$inferSelect & {
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'banned';
  lastLogin: string;
  avatar?: string;
};
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

// Types pour l'espace communautaire
export const communityCategories = ['conseils', 'experiences', 'questions', 'astuces'] as const;
export type CommunityCategory = typeof communityCategories[number];

export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  approved: boolean("approved").default(false).notNull(),
  status: varchar("status", { length: 20 }).default('active').notNull(),
  reports: integer("reports").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const communityPostVotes = pgTable("community_post_votes", {
  postId: integer("post_id").notNull().references(() => communityPosts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  vote: varchar("vote", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => {
  return {
    pk: primaryKey(table.postId, table.userId)
  };
});

export const communityPostComments = pgTable("community_post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => communityPosts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  status: varchar("status", { length: 20 }).default('active').notNull(),
  likes: integer("likes").default(0).notNull(),
  dislikes: integer("dislikes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations
export const communityPostsRelations = relations(communityPosts, ({ many, one }) => ({
  votes: many(communityPostVotes),
  comments: many(communityPostComments),
  author: one(users, {
    fields: [communityPosts.userId],
    references: [users.id]
  })
}));

export const communityPostCommentsRelations = relations(communityPostComments, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityPostComments.postId],
    references: [communityPosts.id]
  }),
  author: one(users, {
    fields: [communityPostComments.userId],
    references: [users.id]
  })
}));

export const communityPostVotesRelations = relations(communityPostVotes, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityPostVotes.postId],
    references: [communityPosts.id]
  }),
  user: one(users, {
    fields: [communityPostVotes.userId],
    references: [users.id]
  })
}));

// Types
export type CommunityPost = typeof communityPosts.$inferSelect & {
  author: {
    id: number;
    username: string;
    avatar?: string;
  };
  likes: number;
  dislikes: number;
  comments: CommunityPostComment[];
};

export type CommunityPostComment = typeof communityPostComments.$inferSelect & {
  author: {
    id: number;
    username: string;
    avatar?: string;
  };
};

// Schemas pour l'insertion de données
export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approved: true,
  status: true,
  reports: true,
});

export const insertCommunityPostCommentSchema = createInsertSchema(communityPostComments).omit({
  id: true,
  createdAt: true,
  status: true,
  likes: true,
  dislikes: true,
});

export const voteCommunityPostSchema = z.object({
  vote: z.enum(['like', 'dislike']),
});
