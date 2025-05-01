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
    return true;
  }
  
  // Plant CRUD methods
  async getPlants(): Promise<Plant[]> {
    return await db.select().from(plants);
  }

  async getPlantsByUserId(userId: number): Promise<Plant[]> {
    return await db.select().from(plants).where(eq(plants.userId, userId));
  }
  
  async getPlantsByIds(ids: number[]): Promise<Plant[]> {
    if (ids.length === 0) return [];
    return await db.select().from(plants).where(
      // @ts-ignore
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
    return true;
  }
  
  // Task CRUD methods
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTasksByPlantId(plantId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.plantId, plantId));
  }
  
  async getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    const allTasks = await db.select().from(tasks);
    return allTasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate >= startDate && taskDate < endDate;
    });
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
    return true;
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
    return await db
      .select()
      .from(communityTips)
      .where(eq(communityTips.userId, userId))
      .orderBy(desc(communityTips.createdAt));
  }

  async getCommunityTipById(id: number): Promise<CommunityTip | undefined> {
    const [tip] = await db
      .select()
      .from(communityTips)
      .where(eq(communityTips.id, id));
    return tip;
  }

  async createCommunityTip(tip: InsertCommunityTip): Promise<CommunityTip> {
    const [newTip] = await db
      .insert(communityTips)
      .values(tip)
      .returning();
    return newTip;
  }

  async updateCommunityTip(id: number, updates: Partial<CommunityTip>): Promise<CommunityTip | undefined> {
    const [updatedTip] = await db
      .update(communityTips)
      .set(updates)
      .where(eq(communityTips.id, id))
      .returning();
    return updatedTip;
  }

  async deleteCommunityTip(id: number): Promise<boolean> {
    const result = await db.delete(communityTips).where(eq(communityTips.id, id));
    return true;
  }

  async voteCommunityTip(id: number, value: 1 | -1): Promise<CommunityTip | undefined> {
    const [tip] = await db
      .select()
      .from(communityTips)
      .where(eq(communityTips.id, id));
    
    if (!tip) return undefined;
    
    const currentVotes = tip.votes ?? 0;
    const currentRating = tip.rating ?? 0;
    
    const [updatedTip] = await db
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
    return await db
      .select()
      .from(communityComments)
      .where(eq(communityComments.tipId, tipId))
      .orderBy(desc(communityComments.createdAt));
  }

  async createCommunityComment(comment: InsertCommunityComment): Promise<CommunityComment> {
    const [newComment] = await db
      .insert(communityComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async deleteCommunityComment(id: number): Promise<boolean> {
    const result = await db.delete(communityComments).where(eq(communityComments.id, id));
    return true;
  }

  async likeCommunityComment(id: number): Promise<CommunityComment | undefined> {
    const [comment] = await db
      .select()
      .from(communityComments)
      .where(eq(communityComments.id, id));
    
    if (!comment) return undefined;
    
    const [updatedComment] = await db
      .update(communityComments)
      .set({ likes: (comment.likes ?? 0) + 1 })
      .where(eq(communityComments.id, id))
      .returning();
    
    return updatedComment;
  }

  async getPopularCommunityTips(limit: number = 5): Promise<CommunityTip[]> {
    const allTips = await db
      .select()
      .from(communityTips)
      .where(eq(communityTips.approved, true));
    
    return allTips
      .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
      .slice(0, limit);
  }

  async getCommunityTipsByCategory(category: string): Promise<CommunityTip[]> {
    return await db
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
    const allTips = await db
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
}