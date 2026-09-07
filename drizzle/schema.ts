import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
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
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Article = typeof articles.$inferSelect;
