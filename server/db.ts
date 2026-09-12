import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { Article, ArticleComment, InsertUser, articleComments, articleRatings, articleVotes, articles, users } from "../drizzle/schema";
import type { ArticleReference, ArticleStatus, TopicId } from "../shared/editorial";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export type ArticleWrite = {
  slug: string;
  title: string;
  excerpt: string;
  topic: TopicId;
  status: ArticleStatus;
  authorId?: number | null;
  authorName?: string | null;
  reviewNote?: string | null;
  submittedAt?: Date | null;
  reviewedAt?: Date | null;
  reviewedById?: number | null;
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

export async function listArticlesForReview() {
  const db = await getDb();
  if (!db) return [] as Article[];
  return db.select().from(articles).where(inArray(articles.status, ["submitted", "approved"])).orderBy(desc(articles.submittedAt), desc(articles.updatedAt));
}

export async function listArticlesForAuthor(authorId: number) {
  const db = await getDb();
  if (!db) return [] as Article[];
  return db.select().from(articles).where(eq(articles.authorId, authorId)).orderBy(desc(articles.updatedAt));
}

export async function getArticleForAuthor(id: number, authorId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(and(eq(articles.id, id), eq(articles.authorId, authorId))).limit(1);
  return result[0];
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

export async function updateArticle(id: number, values: Partial<ArticleWrite>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(articles).set(values).where(eq(articles.id, id));
}

export async function updateArticleStatus(id: number, status: ArticleStatus, reviewerId: number, reviewNote: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(articles).set({
    status,
    reviewNote,
    reviewedAt: new Date(),
    reviewedById: reviewerId,
    publishedAt: status === "published" ? new Date() : null,
  }).where(eq(articles.id, id));
}

export async function getArticleEngagement(articleId: number, userId?: number) {
  const db = await getDb();
  if (!db) return { ratingAverage: 0, ratingCount: 0, voteCount: 0, viewerRating: null, viewerVoted: false, comments: [] as ArticleComment[] };
  const [ratingRows, voteRows, comments] = await Promise.all([
    db.select({ average: sql<number>`COALESCE(AVG(${articleRatings.rating}), 0)`, count: sql<number>`COUNT(*)` }).from(articleRatings).where(eq(articleRatings.articleId, articleId)),
    db.select({ count: sql<number>`COUNT(*)` }).from(articleVotes).where(eq(articleVotes.articleId, articleId)),
    db.select().from(articleComments).where(and(eq(articleComments.articleId, articleId), eq(articleComments.status, "visible"))).orderBy(desc(articleComments.createdAt)),
  ]);
  let viewerRating: number | null = null;
  let viewerVoted = false;
  if (userId) {
    const [rating, vote] = await Promise.all([
      db.select({ rating: articleRatings.rating }).from(articleRatings).where(and(eq(articleRatings.articleId, articleId), eq(articleRatings.userId, userId))).limit(1),
      db.select({ id: articleVotes.id }).from(articleVotes).where(and(eq(articleVotes.articleId, articleId), eq(articleVotes.userId, userId))).limit(1),
    ]);
    viewerRating = rating[0]?.rating ?? null;
    viewerVoted = Boolean(vote[0]);
  }
  return { ratingAverage: Number(ratingRows[0]?.average ?? 0), ratingCount: Number(ratingRows[0]?.count ?? 0), voteCount: Number(voteRows[0]?.count ?? 0), viewerRating, viewerVoted, comments };
}

export async function upsertArticleRating(articleId: number, userId: number, rating: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(articleRatings).values({ articleId, userId, rating }).onDuplicateKeyUpdate({ set: { rating } });
}

export async function toggleArticleVote(articleId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ id: articleVotes.id }).from(articleVotes).where(and(eq(articleVotes.articleId, articleId), eq(articleVotes.userId, userId))).limit(1);
  if (existing[0]) await db.delete(articleVotes).where(eq(articleVotes.id, existing[0].id));
  else await db.insert(articleVotes).values({ articleId, userId });
  return !existing[0];
}

export async function createArticleComment(articleId: number, userId: number, authorName: string, body: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(articleComments).values({ articleId, userId, authorName, body, status: "visible" });
  return Number(result[0].insertId);
}

export async function hideArticleComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(articleComments).set({ status: "hidden" }).where(eq(articleComments.id, id));
}

export async function listArticleCommentsForAdmin() {
  const db = await getDb();
  if (!db) return [] as ArticleComment[];
  return db.select().from(articleComments).orderBy(desc(articleComments.createdAt));
}
