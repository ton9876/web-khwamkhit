import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, uniqueIndex } from "drizzle-orm/mysql-core";
import type { ArticleReference, TopicId } from "../shared/editorial";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt").notNull(),
  topic: mysqlEnum("topic", ["living", "food", "environment", "ethics"]).$type<TopicId>().notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "changes_requested", "approved", "published"]).default("draft").notNull(),
  authorId: int("authorId"),
  authorName: varchar("authorName", { length: 255 }),
  reviewNote: text("reviewNote"),
  submittedAt: timestamp("submittedAt"),
  reviewedAt: timestamp("reviewedAt"),
  reviewedById: int("reviewedById"),
  body: json("body").$type<string[]>().notNull(),
  coverImageKey: varchar("coverImageKey", { length: 520 }),
  coverImageUrl: varchar("coverImageUrl", { length: 1024 }),
  coverAlt: varchar("coverAlt", { length: 300 }),
  videoUrl: varchar("videoUrl", { length: 1024 }),
  references: json("references").$type<ArticleReference[]>().notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const articleRatings = mysqlTable("articleRatings", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ uniqueArticleUser: uniqueIndex("articleRatings_article_user_unique").on(table.articleId, table.userId) }));

export const articleVotes = mysqlTable("articleVotes", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ uniqueArticleUser: uniqueIndex("articleVotes_article_user_unique").on(table.articleId, table.userId) }));

export const articleComments = mysqlTable("articleComments", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  userId: int("userId").notNull(),
  authorName: varchar("authorName", { length: 255 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["visible", "hidden"]).default("visible").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type ArticleRating = typeof articleRatings.$inferSelect;
export type ArticleVote = typeof articleVotes.$inferSelect;
export type ArticleComment = typeof articleComments.$inferSelect;
