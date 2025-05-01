import { 
  plants, Plant, InsertPlant, 
  tasks, Task, InsertTask,
  plantAnalyses, PlantAnalysis, InsertPlantAnalysis,
  users, User, InsertUser,
  growthJournal, GrowthJournalEntry, InsertGrowthJournalEntry,
  communityTips, CommunityTip, InsertCommunityTip,
  communityComments, CommunityComment, InsertCommunityComment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
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
    let query = db.select().from(communityTips);
    
    if (options?.approved !== undefined) {
      query = query.where(eq(communityTips.approved, options.approved));
    }
    
    return await query.orderBy(desc(communityTips.createdAt));
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
    const result = await this.db.query(
      `SELECT 
        p.*,
        u.username as author_username,
        u.avatar_url as author_avatar,
        COALESCE(v.likes, 0) as likes,
        COALESCE(v.dislikes, 0) as dislikes,
        COALESCE(c.comment_count, 0) as comment_count
      FROM forum_posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN (
        SELECT 
          post_id,
          SUM(CASE WHEN vote = 'like' THEN 1 ELSE 0 END) as likes,
          SUM(CASE WHEN vote = 'dislike' THEN 1 ELSE 0 END) as dislikes
        FROM forum_votes
        GROUP BY post_id
      ) v ON p.id = v.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count
        FROM forum_comments
        GROUP BY post_id
      ) c ON p.id = c.post_id
      ORDER BY p.created_at DESC`
    );

    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      approved: row.approved,
      rejected: row.rejected,
      rejectionReason: row.rejection_reason,
      likes: row.likes,
      dislikes: row.dislikes,
      userVotes: {},
      comments: [],
      author: {
        username: row.author_username,
        avatarUrl: row.author_avatar,
      },
    }));
  }

  async createForumPost(data: CreateForumPost): Promise<ForumPost> {
    const result = await this.db.query(
      `INSERT INTO forum_posts (title, content, category, user_id, approved)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.title, data.content, data.category, data.userId, false]
    );

    const post = result.rows[0];
    const author = await this.getUser(data.userId);

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      userId: post.user_id,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      approved: post.approved,
      rejected: post.rejected,
      rejectionReason: post.rejection_reason,
      likes: 0,
      dislikes: 0,
      userVotes: {},
      comments: [],
      author: {
        username: author?.username || "",
        avatarUrl: author?.avatarUrl || "",
      },
    };
  }

  async voteForumPost(postId: number, userId: number, vote: "like" | "dislike"): Promise<ForumPost> {
    await this.db.query(
      `INSERT INTO forum_votes (post_id, user_id, vote)
       VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_id) DO UPDATE SET vote = $3`,
      [postId, userId, vote]
    );

    return this.getForumPost(postId);
  }

  async createForumComment(data: CreateForumComment): Promise<ForumPost> {
    await this.db.query(
      `INSERT INTO forum_comments (post_id, user_id, content)
       VALUES ($1, $2, $3)`,
      [data.postId, data.userId, data.content]
    );

    return this.getForumPost(data.postId);
  }

  async approveForumPost(postId: number): Promise<ForumPost> {
    await this.db.query(
      `UPDATE forum_posts
       SET approved = true, rejected = false, rejection_reason = NULL
       WHERE id = $1`,
      [postId]
    );

    return this.getForumPost(postId);
  }

  async rejectForumPost(postId: number, reason: string): Promise<ForumPost> {
    await this.db.query(
      `UPDATE forum_posts
       SET approved = false, rejected = true, rejection_reason = $2
       WHERE id = $1`,
      [postId, reason]
    );

    return this.getForumPost(postId);
  }

  async getForumPost(postId: number): Promise<ForumPost> {
    const result = await this.db.query(
      `SELECT 
        p.*,
        u.username as author_username,
        u.avatar_url as author_avatar,
        COALESCE(v.likes, 0) as likes,
        COALESCE(v.dislikes, 0) as dislikes,
        COALESCE(c.comment_count, 0) as comment_count,
        json_agg(
          json_build_object(
            'id', fc.id,
            'content', fc.content,
            'userId', fc.user_id,
            'createdAt', fc.created_at,
            'author', json_build_object(
              'username', cu.username,
              'avatarUrl', cu.avatar_url
            )
          )
        ) as comments
      FROM forum_posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN (
        SELECT 
          post_id,
          SUM(CASE WHEN vote = 'like' THEN 1 ELSE 0 END) as likes,
          SUM(CASE WHEN vote = 'dislike' THEN 1 ELSE 0 END) as dislikes
        FROM forum_votes
        GROUP BY post_id
      ) v ON p.id = v.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count
        FROM forum_comments
        GROUP BY post_id
      ) c ON p.id = c.post_id
      LEFT JOIN forum_comments fc ON p.id = fc.post_id
      LEFT JOIN users cu ON fc.user_id = cu.id
      WHERE p.id = $1
      GROUP BY p.id, u.username, u.avatar_url, v.likes, v.dislikes, c.comment_count`,
      [postId]
    );

    if (result.rows.length === 0) {
      throw new Error("Post non trouvé");
    }

    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      approved: row.approved,
      rejected: row.rejected,
      rejectionReason: row.rejection_reason,
      likes: row.likes,
      dislikes: row.dislikes,
      userVotes: {},
      comments: row.comments || [],
      author: {
        username: row.author_username,
        avatarUrl: row.author_avatar,
      },
    };
  }
}