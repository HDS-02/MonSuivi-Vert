import { 
  plants, Plant, InsertPlant, 
  tasks, Task, InsertTask,
  plantAnalyses, PlantAnalysis, InsertPlantAnalysis,
  users, User, InsertUser,
  growthJournal, GrowthJournalEntry, InsertGrowthJournalEntry,
  communityTips, CommunityTip, InsertCommunityTip,
  communityComments, CommunityComment, InsertCommunityComment,
  forumPosts, forumVotes, forumComments,
  ForumPost, ForumCategory, ForumComment,
  createForumPostSchema, createForumCommentSchema,
  type CreateForumPost,
  type CreateForumComment,
  forumPostsRelations,
  forumCommentsRelations,
  forumVotesRelations
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { IStorage } from "./storage";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Configuration des relations pour Drizzle
const dbWithRelations = drizzle(pool, {
  schema: {
    forumPosts,
    forumComments,
    forumVotes,
    users,
    communityTips,
    relations: {
      forumPosts: forumPostsRelations,
      forumComments: forumCommentsRelations,
      forumVotes: forumVotesRelations
    }
  }
});

// Tables pour l'espace communautaire
export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  likes: integer("likes").default(0),
  dislikes: integer("dislikes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  approved: boolean("approved").default(false),
  status: text("status").default("active"),
  reports: integer("reports").default(0),
});

export const communityPostComments = pgTable("community_post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  dislikes: integer("dislikes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  status: text("status").default("active"),
});

// Relations pour l'espace communautaire
export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [communityPosts.userId],
    references: [users.id],
  }),
  comments: many(communityPostComments),
}));

export const communityPostCommentsRelations = relations(communityPostComments, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityPostComments.postId],
    references: [communityPosts.id],
  }),
  author: one(users, {
    fields: [communityPostComments.userId],
    references: [users.id],
  }),
}));

// Mise à jour de la table users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  email: text("email"),
  avatar: text("avatar"),
  role: text("role").default("user"),
  status: text("status").default("active"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  reminderTime: text("reminder_time").default("08:00"),
  isAdmin: boolean("is_admin").default(false),
});

interface ForumPostRow {
  id: number;
  title: string;
  content: string;
  category: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
  approved: boolean;
  rejected: boolean;
  rejection_reason: string | null;
  author_id: number;
  author_username: string;
  votes: Array<{
    id: number;
    post_id: number;
    user_id: number;
    vote: 'like' | 'dislike';
  }>;
  comments: Array<{
    id: number;
    post_id: number;
    user_id: number;
    content: string;
    created_at: Date;
  }>;
}

interface ForumPostResult {
  id: number;
  title: string;
  content: string;
  category: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
  approved: boolean;
  rejected: boolean;
  rejection_reason: string | null;
  author_id: number;
  author_username: string;
}

interface ForumVoteResult {
  post_id: number;
  user_id: number;
  vote: 'like' | 'dislike';
}

interface ForumCommentResult {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: Date;
  author_id: number;
  author_username: string;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  private db: typeof db;

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
    this.db = db;
  }

  // User CRUD methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    if (result.length === 0) return undefined;
    const user = result[0];
    return {
      ...user,
      role: user.isAdmin ? 'admin' : 'user',
      status: 'active',
      lastLogin: new Date().toISOString(),
      avatar: user.avatar || undefined
    };
  }

  async getUsers(): Promise<User[]> {
    const result = await this.db.select().from(users);
    return result.map(user => ({
      ...user,
      role: user.isAdmin ? 'admin' : 'user',
      status: 'active',
      lastLogin: new Date().toISOString(),
      avatar: user.avatar || undefined
    }));
  }

  async getUserById(id: number): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    if (result.length === 0) return null;
    const user = result[0];
    return {
      ...user,
      role: user.isAdmin ? 'admin' : 'user',
      status: 'active',
      lastLogin: new Date().toISOString(),
      avatar: user.avatar || undefined
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    if (result.length === 0) return undefined;
    const user = result[0];
    return {
      ...user,
      role: user.isAdmin ? 'admin' : 'user',
      status: 'active',
      lastLogin: new Date().toISOString(),
      avatar: user.avatar || undefined
    };
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await this.db.insert(users).values(user).returning();
    return {
      ...newUser,
      role: newUser.isAdmin ? 'admin' : 'user',
      status: 'active',
      lastLogin: new Date().toISOString(),
      avatar: newUser.avatar || undefined
    };
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await this.db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    if (!updatedUser) return undefined;
    return {
      ...updatedUser,
      role: updatedUser.isAdmin ? 'admin' : 'user',
      status: 'active',
      lastLogin: new Date().toISOString(),
      avatar: updatedUser.avatar || undefined
    };
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id));
    return true;
  }

  async updateUserRole(id: number, role: 'user' | 'admin' | 'moderator'): Promise<void> {
    await this.db.update(users)
      .set({ isAdmin: role === 'admin' })
      .where(eq(users.id, id));
  }

  async updateUserStatus(id: number, status: 'active' | 'banned'): Promise<void> {
    await this.db.update(users)
      .set({ status })
      .where(eq(users.id, id));
  }
  
  // Plant CRUD methods
  async getPlants(): Promise<Plant[]> {
    return await this.db.select().from(plants);
  }

  async getPlantsByUserId(userId: number): Promise<Plant[]> {
    return await this.db.select().from(plants).where(eq(plants.userId, userId));
  }
  
  async getPlantsByIds(ids: number[]): Promise<Plant[]> {
    if (ids.length === 0) return [];
    return await this.db.select().from(plants).where(
      // @ts-ignore
      plants.id.in(ids)
    );
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    const [plant] = await this.db.select().from(plants).where(eq(plants.id, id));
    return plant;
  }

  async createPlant(plant: InsertPlant): Promise<Plant> {
    const [newPlant] = await this.db.insert(plants).values(plant).returning();
    return newPlant;
  }

  async updatePlant(id: number, updates: Partial<Plant>): Promise<Plant | undefined> {
    const [updatedPlant] = await this.db
      .update(plants)
      .set(updates)
      .where(eq(plants.id, id))
      .returning();
    return updatedPlant;
  }

  async deletePlant(id: number): Promise<boolean> {
    const result = await this.db.delete(plants).where(eq(plants.id, id));
    return true;
  }
  
  // Task CRUD methods
  async getTasks(): Promise<Task[]> {
    return await this.db.select().from(tasks);
  }

  async getTasksByPlantId(plantId: number): Promise<Task[]> {
    return await this.db.select().from(tasks).where(eq(tasks.plantId, plantId));
  }
  
  async getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    const allTasks = await this.db.select().from(tasks);
    return allTasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate >= startDate && taskDate < endDate;
    });
  }
  
  async getPendingTasks(): Promise<Task[]> {
    return await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.completed, false));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await this.db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const [updatedTask] = await this.db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }
  
  async completeTask(id: number): Promise<Task | undefined> {
    const [completedTask] = await this.db
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
    const result = await this.db.delete(tasks).where(eq(tasks.id, id));
    return true;
  }
  
  // Plant Analysis CRUD methods
  async getPlantAnalyses(plantId: number): Promise<PlantAnalysis[]> {
    return await this.db
      .select()
      .from(plantAnalyses)
      .where(eq(plantAnalyses.plantId, plantId))
      .orderBy(desc(plantAnalyses.date));
  }
  
  async getLatestPlantAnalysis(plantId: number): Promise<PlantAnalysis | undefined> {
    const [analysis] = await this.db
      .select()
      .from(plantAnalyses)
      .where(eq(plantAnalyses.plantId, plantId))
      .orderBy(desc(plantAnalyses.date))
      .limit(1);
    return analysis;
  }

  async createPlantAnalysis(analysis: InsertPlantAnalysis): Promise<PlantAnalysis> {
    const [newAnalysis] = await this.db
      .insert(plantAnalyses)
      .values({ ...analysis, date: new Date() })
      .returning();
    return newAnalysis;
  }
  
  // Journal de croissance CRUD methods
  async getGrowthJournalEntries(plantId: number): Promise<GrowthJournalEntry[]> {
    return await this.db
      .select()
      .from(growthJournal)
      .where(eq(growthJournal.plantId, plantId))
      .orderBy(desc(growthJournal.date));
  }
  
  async getGrowthJournalEntriesByUserId(userId: number): Promise<GrowthJournalEntry[]> {
    return await this.db
      .select()
      .from(growthJournal)
      .where(eq(growthJournal.userId, userId))
      .orderBy(desc(growthJournal.date));
  }
  
  async getGrowthJournalEntry(id: number): Promise<GrowthJournalEntry | undefined> {
    const [entry] = await this.db
      .select()
      .from(growthJournal)
      .where(eq(growthJournal.id, id));
    return entry;
  }
  
  async createGrowthJournalEntry(entry: InsertGrowthJournalEntry): Promise<GrowthJournalEntry> {
    const [newEntry] = await this.db
      .insert(growthJournal)
      .values({ ...entry, date: new Date() })
      .returning();
    return newEntry;
  }
  
  async updateGrowthJournalEntry(id: number, updates: Partial<GrowthJournalEntry>): Promise<GrowthJournalEntry | undefined> {
    const [updatedEntry] = await this.db
      .update(growthJournal)
      .set(updates)
      .where(eq(growthJournal.id, id))
      .returning();
    return updatedEntry;
  }
  
  async deleteGrowthJournalEntry(id: number): Promise<boolean> {
    const result = await this.db.delete(growthJournal).where(eq(growthJournal.id, id));
    return true;
  }

  // Community CRUD methods
  async getCommunityTips(options?: { approved?: boolean }): Promise<CommunityTip[]> {
    const tips = await this.db.query.communityTips.findMany({
      where: options?.approved !== undefined ? eq(communityTips.approved, options.approved) : undefined,
      orderBy: desc(communityTips.createdAt)
    });
    return tips;
  }

  async getCommunityTipsByUserId(userId: number): Promise<CommunityTip[]> {
    return await this.db
      .select()
      .from(communityTips)
      .where(eq(communityTips.userId, userId))
      .orderBy(desc(communityTips.createdAt));
  }

  async getCommunityTipById(id: number): Promise<CommunityTip | undefined> {
    const [tip] = await this.db
      .select()
      .from(communityTips)
      .where(eq(communityTips.id, id));
    return tip;
  }

  async createCommunityTip(tip: InsertCommunityTip): Promise<CommunityTip> {
    const [newTip] = await this.db
      .insert(communityTips)
      .values(tip)
      .returning();
    return newTip;
  }

  async updateCommunityTip(id: number, updates: Partial<CommunityTip>): Promise<CommunityTip | undefined> {
    const [updatedTip] = await this.db
      .update(communityTips)
      .set(updates)
      .where(eq(communityTips.id, id))
      .returning();
    return updatedTip;
  }

  async deleteCommunityTip(id: number): Promise<boolean> {
    const result = await this.db.delete(communityTips).where(eq(communityTips.id, id));
    return true;
  }

  async voteCommunityTip(id: number, value: 1 | -1): Promise<CommunityTip | undefined> {
    const [tip] = await this.db
      .select()
      .from(communityTips)
      .where(eq(communityTips.id, id));
    
    if (!tip) return undefined;
    
    const currentVotes = tip.votes ?? 0;
    const currentRating = tip.rating ?? 0;
    
    const [updatedTip] = await this.db
      .update(communityTips)
      .set({ 
        votes: currentVotes + value,
        rating: currentVotes > 0 ? 
          Math.max(0, Math.min(5, Math.round((currentRating * currentVotes + (value > 0 ? 5 : 1)) / (currentVotes + 1)))) 
          : (value > 0 ? 5 : 1)
      })
      .where(eq(communityTips.id, id))
      .returning();
    
    return updatedTip;
  }

  async getCommunityCommentsByTipId(tipId: number): Promise<CommunityComment[]> {
    return await this.db
      .select()
      .from(communityComments)
      .where(eq(communityComments.tipId, tipId))
      .orderBy(desc(communityComments.createdAt));
  }

  async createCommunityComment(comment: InsertCommunityComment): Promise<CommunityComment> {
    const [newComment] = await this.db
      .insert(communityComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async deleteCommunityComment(id: number): Promise<boolean> {
    const result = await this.db.delete(communityComments).where(eq(communityComments.id, id));
    return true;
  }

  async likeCommunityComment(id: number): Promise<CommunityComment | undefined> {
    const [comment] = await this.db
      .select()
      .from(communityComments)
      .where(eq(communityComments.id, id));
    
    if (!comment) return undefined;
    
    const [updatedComment] = await this.db
      .update(communityComments)
      .set({ likes: (comment.likes ?? 0) + 1 })
      .where(eq(communityComments.id, id))
      .returning();
    
    return updatedComment;
  }

  async getPopularCommunityTips(limit: number = 5): Promise<CommunityTip[]> {
    const allTips = await this.db
      .select()
      .from(communityTips)
      .where(eq(communityTips.approved, true));
    
    return allTips
      .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
      .slice(0, limit);
  }

  async getCommunityTipsByCategory(category: string): Promise<CommunityTip[]> {
    return await this.db
      .select()
      .from(communityTips)
      .where(
        and(
          eq(communityTips.approved, true),
          eq(communityTips.category, category)
        )
      )
      .orderBy(desc(communityTips.createdAt));
  }

  async searchCommunityTips(query: string): Promise<CommunityTip[]> {
    const allTips = await this.db
      .select()
      .from(communityTips)
      .where(eq(communityTips.approved, true));
    
    const lowerQuery = query.toLowerCase();
    
    return allTips.filter(tip => 
      tip.title.toLowerCase().includes(lowerQuery) || 
      tip.content.toLowerCase().includes(lowerQuery) ||
      (tip.tags as string[]).some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async getForumPosts(): Promise<ForumPost[]> {
    // Récupérer tous les posts avec leurs auteurs
    const posts = await this.db.execute(sql`
      SELECT 
        fp.id,
        fp.title,
        fp.content,
        fp.category,
        fp.user_id,
        fp.created_at,
        fp.updated_at,
        fp.approved,
        fp.rejected,
        fp.rejection_reason,
        u.id as author_id,
        u.username as author_username
      FROM forum_posts fp
      LEFT JOIN users u ON fp.user_id = u.id
      ORDER BY fp.created_at DESC
    `);

    // Récupérer tous les votes
    const votes = await this.db.execute(sql`
      SELECT 
        post_id,
        user_id,
        vote
      FROM forum_votes
    `);

    // Récupérer tous les commentaires avec leurs auteurs
    const comments = await this.db.execute(sql`
      SELECT 
        fc.id,
        fc.post_id,
        fc.user_id,
        fc.content,
        fc.created_at,
        u.id as author_id,
        u.username as author_username
      FROM forum_comments fc
      LEFT JOIN users u ON fc.user_id = u.id
    `);

    // Organiser les votes par post
    const votesByPostId = votes.rows.reduce((acc, vote) => {
      if (!acc[vote.post_id]) {
        acc[vote.post_id] = [];
      }
      acc[vote.post_id].push(vote);
      return acc;
    }, {} as Record<number, typeof votes.rows>);

    // Organiser les commentaires par post
    const commentsByPostId = comments.rows.reduce((acc, comment) => {
      if (!acc[comment.post_id]) {
        acc[comment.post_id] = [];
      }
      acc[comment.post_id].push(comment);
      return acc;
    }, {} as Record<number, typeof comments.rows>);

    // Construire les posts avec leurs votes et commentaires
    return posts.rows.map(post => {
      const postVotes = votesByPostId[post.id] || [];
      const postComments = commentsByPostId[post.id] || [];

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category as ForumCategory,
        userId: post.user_id,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        approved: post.approved,
        rejected: post.rejected,
        rejectionReason: post.rejection_reason || undefined,
        likes: postVotes.filter((v: any) => v.vote === 'like').length,
        dislikes: postVotes.filter((v: any) => v.vote === 'dislike').length,
        userVotes: Object.fromEntries(
          postVotes.map((v: any) => [v.user_id, v.vote])
        ),
        comments: postComments.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          userId: comment.user_id,
          postId: comment.post_id,
          createdAt: comment.created_at,
          updatedAt: comment.created_at,
          author: {
            id: comment.author_id,
            username: comment.author_username,
            avatar: undefined
          }
        })),
        author: {
          id: post.author_id,
          username: post.author_username,
          avatar: undefined
        }
      };
    });
  }

  async getForumPost(postId: number): Promise<ForumPost> {
    // Récupérer le post avec son auteur
    const [post] = await this.db.execute(sql`
      SELECT 
        fp.id,
        fp.title,
        fp.content,
        fp.category,
        fp.user_id,
        fp.created_at,
        fp.updated_at,
        fp.approved,
        fp.rejected,
        fp.rejection_reason,
        u.id as author_id,
        u.username as author_username
      FROM forum_posts fp
      LEFT JOIN users u ON fp.user_id = u.id
      WHERE fp.id = ${postId}
    `);

    if (!post) {
      throw new Error("Post non trouvé");
    }

    // Récupérer les votes du post
    const votes = await this.db.execute(sql`
      SELECT 
        user_id,
        vote
      FROM forum_votes
      WHERE post_id = ${postId}
    `);

    // Récupérer les commentaires du post avec leurs auteurs
    const comments = await this.db.execute(sql`
      SELECT 
        fc.id,
        fc.user_id,
        fc.content,
        fc.created_at,
        u.id as author_id,
        u.username as author_username
      FROM forum_comments fc
      LEFT JOIN users u ON fc.user_id = u.id
      WHERE fc.post_id = ${postId}
    `);

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category as ForumCategory,
      userId: post.user_id,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      approved: post.approved,
      rejected: post.rejected,
      rejectionReason: post.rejection_reason || undefined,
      likes: votes.rows.filter((v: any) => v.vote === 'like').length,
      dislikes: votes.rows.filter((v: any) => v.vote === 'dislike').length,
      userVotes: Object.fromEntries(
        votes.rows.map((v: any) => [v.user_id, v.vote])
      ),
      comments: comments.rows.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        userId: comment.user_id,
        postId: postId,
        createdAt: comment.created_at,
        updatedAt: comment.created_at,
        author: {
          id: comment.author_id,
          username: comment.author_username,
          avatar: undefined
        }
      })),
      author: {
        id: post.author_id,
        username: post.author_username,
        avatar: undefined
      }
    };
  }

  async createForumPost(data: CreateForumPost): Promise<ForumPost> {
    const [post] = await this.db.execute(sql`
      INSERT INTO forum_posts (title, content, category, user_id, approved, rejected)
      VALUES (${data.title}, ${data.content}, ${data.category}, ${data.userId}, false, false)
      RETURNING id
    `);

    return this.getForumPost(post.id);
  }

  async voteForumPost(postId: number, userId: number, vote: "like" | "dislike"): Promise<ForumPost> {
    await this.db.execute(sql`
      INSERT INTO forum_votes (post_id, user_id, vote)
      VALUES (${postId}, ${userId}, ${vote})
      ON CONFLICT (post_id, user_id) DO UPDATE
      SET vote = ${vote}
    `);

    return this.getForumPost(postId);
  }

  async createForumComment(data: CreateForumComment): Promise<ForumPost> {
    await this.db.execute(sql`
      INSERT INTO forum_comments (post_id, user_id, content)
      VALUES (${data.postId}, ${data.userId}, ${data.content})
    `);

    return this.getForumPost(data.postId);
  }

  async approveForumPost(postId: number): Promise<ForumPost> {
    await this.db.execute(sql`
      UPDATE forum_posts
      SET approved = true, rejected = false, rejection_reason = NULL
      WHERE id = ${postId}
    `);

    return this.getForumPost(postId);
  }

  async rejectForumPost(postId: number, reason: string): Promise<ForumPost> {
    await this.db.execute(sql`
      UPDATE forum_posts
      SET approved = false, rejected = true, rejection_reason = ${reason}
      WHERE id = ${postId}
    `);

    return this.getForumPost(postId);
  }

  async getPendingTips(): Promise<CommunityTip[]> {
    const tips = await this.db.query.communityTips.findMany({
      where: eq(communityTips.approved, false)
    });
    return tips;
  }

  async validateTip(id: number): Promise<CommunityTip | undefined> {
    const [validatedTip] = await this.db
      .update(communityTips)
      .set({ approved: true })
      .where(eq(communityTips.id, id))
      .returning();
    return validatedTip;
  }

  async getCommunityPosts(): Promise<CommunitySpacePost[]> {
    const result = await this.db.select().from(communityPosts);
    return result.map(post => ({
      ...post,
      author: {
        id: post.userId,
        username: '', // Nous devrons joindre avec la table users
        avatar: undefined
      },
      comments: [], // Nous devrons joindre avec la table comments
      status: post.status as 'active' | 'reported' | 'banned',
      createdAt: post.createdAt.toISOString()
    }));
  }

  async createCommunityPost(post: Omit<CommunitySpacePost, 'id' | 'createdAt' | 'author' | 'comments' | 'status'>): Promise<CommunitySpacePost> {
    const result = await this.db.insert(communityPosts)
      .values({
        userId: post.author.id,
        title: post.title,
        content: post.content,
        category: post.category,
        likes: post.likes,
        dislikes: post.dislikes,
        approved: post.approved,
        reports: post.reports
      })
      .returning();
    
    return {
      ...result[0],
      author: post.author,
      comments: [],
      status: 'active',
      createdAt: new Date().toISOString()
    };
  }
}