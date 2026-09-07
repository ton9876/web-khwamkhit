import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { Article, InsertUser, articles, users } from "../drizzle/schema";
import type { ArticleReference, ArticleStatus, TopicId } from "../shared/editorial";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export type ArticleWrite = {
  slug: string;
  title: string;
  excerpt: string;
  topic: TopicId;
  status: ArticleStatus;
  body: string[];
  coverImageKey: string | null;
  coverImageUrl: string | null;
  coverAlt: string | null;
  videoUrl: string | null;
  references: ArticleReference[];
  publishedAt: Date | null;
};

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });

  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listPublishedArticles(topic?: TopicId) {
  const db = await getDb();
  if (!db) return [] as Article[];
  const filter = topic ? and(eq(articles.status, "published"), eq(articles.topic, topic)) : eq(articles.status, "published");
  return db.select().from(articles).where(filter).orderBy(desc(articles.publishedAt), desc(articles.createdAt));
}

export async function getPublishedArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(and(eq(articles.slug, slug), eq(articles.status, "published"))).limit(1);
  return result[0];
}

export async function listArticlesForEditor() {
  const db = await getDb();
  if (!db) return [] as Article[];
  return db.select().from(articles).orderBy(desc(articles.updatedAt));
}

export async function getArticleForEditor(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result[0];
}

export async function createArticle(values: ArticleWrite) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(articles).values(values);
  return Number(result[0].insertId);
}

export async function updateArticle(id: number, values: ArticleWrite) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(articles).set(values).where(eq(articles.id, id));
}
