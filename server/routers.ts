import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { TOPICS } from "../shared/editorial";
import * as db from "./db";
import { storagePut } from "./storage";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const topicSchema = z.enum(TOPICS.map((topic) => topic.id) as ["living", "food", "environment", "ethics"]);
const referenceSchema = z.object({
  title: z.string().trim().min(2).max(255),
  author: z.string().trim().max(255).optional(),
  publisher: z.string().trim().max(255).optional(),
  publishedAt: z.string().trim().max(100).optional(),
  url: z.string().url().max(1024),
  note: z.string().trim().max(500).optional(),
});
const articleInputSchema = z.object({
  // Thai titles cannot be transliterated reliably on the client. If the editor
  // leaves the URL blank (or enters only Thai characters), keep publishing
  // safe by assigning a unique, readable fallback slug instead of returning a
  // cryptic Zod "too_small" error.
  slug: z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    return cleaned.length >= 3
      ? cleaned
      : `article-${Date.now().toString(36)}-${nanoid(6).toLowerCase()}`;
  }, z.string().min(3).max(180).regex(/^[a-z0-9-]+$/, "ใช้ตัวอักษรอังกฤษ ตัวเลข และขีดกลางเท่านั้น")),
  title: z.string().trim().min(5).max(255),
  excerpt: z.string().trim().min(15).max(1200),
  topic: topicSchema,
  body: z.array(z.string().trim().min(1).max(5000)).min(1).max(40),
  coverImageKey: z.string().max(520).nullable().optional(),
  coverImageUrl: z.string().max(1024).nullable().optional(),
  coverAlt: z.string().trim().max(300).nullable().optional(),
  videoUrl: z.union([z.string().url().max(1024), z.literal("")]).optional(),
  references: z.array(referenceSchema).max(10),
});
const articleActionSchema = z.enum(["draft", "submit"]);
const reviewActionSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["changes_requested", "approved", "published"]),
  reviewNote: z.string().trim().max(2000).optional(),
});

type ArticleInput = z.infer<typeof articleInputSchema>;

function normalizeArticle(input: ArticleInput, status: "draft" | "published") {
  if (status === "published" && input.references.length === 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "บทความที่เผยแพร่ต้องระบุแหล่งอ้างอิงอย่างน้อยหนึ่งรายการ" });
  }
  return {
    ...input,
    status,
    coverImageKey: input.coverImageKey || null,
    coverImageUrl: input.coverImageUrl || null,
    coverAlt: input.coverAlt || null,
    videoUrl: input.videoUrl || null,
    publishedAt: status === "published" ? new Date() : null,
  };
}

function normalizeSubmission(input: ArticleInput, action: z.infer<typeof articleActionSchema>, authorId: number, authorName: string | null) {
  return {
    ...input,
    status: action === "submit" ? ("submitted" as const) : ("draft" as const),
    authorId,
    authorName,
    reviewNote: null,
    submittedAt: action === "submit" ? new Date() : null,
    reviewedAt: null,
    reviewedById: null,
    coverImageKey: input.coverImageKey || null,
    coverImageUrl: input.coverImageUrl || null,
    coverAlt: input.coverAlt || null,
    videoUrl: input.videoUrl || null,
    publishedAt: null,
  };
}

const allowedImages = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  articles: router({
    listPublished: publicProcedure.input(z.object({ topic: topicSchema.optional() }).nullish().transform((input) => input ?? {})).query(({ input }) => db.listPublishedArticles(input.topic)),
    bySlug: publicProcedure.input(z.object({ slug: z.string().min(3).max(180) })).query(({ input }) => db.getPublishedArticleBySlug(input.slug)),
    adminList: adminProcedure.query(() => db.listArticlesForEditor()),
    reviewQueue: adminProcedure.query(() => db.listArticlesForReview()),
    getForEditor: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => db.getArticleForEditor(input.id)),
    create: adminProcedure.input(z.object({ article: articleInputSchema, publish: z.boolean().default(false) })).mutation(async ({ input }) => {
      const id = await db.createArticle(normalizeArticle(input.article, input.publish ? "published" : "draft"));
      return { id };
    }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), article: articleInputSchema, publish: z.boolean().default(false) })).mutation(async ({ input }) => {
      const existing = await db.getArticleForEditor(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบบทความที่ต้องการแก้ไข" });
      await db.updateArticle(input.id, normalizeArticle(input.article, input.publish ? "published" : "draft"));
      return { success: true };
    }),
    myList: protectedProcedure.query(({ ctx }) => db.listArticlesForAuthor(ctx.user.id)),
    myGet: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const article = await db.getArticleForAuthor(input.id, ctx.user.id);
      if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบบทความของคุณ" });
      return article;
    }),
    myCreate: protectedProcedure.input(z.object({ article: articleInputSchema, action: articleActionSchema.default("draft") })).mutation(async ({ ctx, input }) => {
      const id = await db.createArticle(normalizeSubmission(input.article, input.action, ctx.user.id, ctx.user.name ?? ctx.user.email ?? null));
      return { id };
    }),
    myUpdate: protectedProcedure.input(z.object({ id: z.number().int().positive(), article: articleInputSchema, action: articleActionSchema.default("draft") })).mutation(async ({ ctx, input }) => {
      const existing = await db.getArticleForAuthor(input.id, ctx.user.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบบทความของคุณ" });
      if (!["draft", "changes_requested"].includes(existing.status)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "บทความนี้อยู่ระหว่างตรวจสอบหรือเผยแพร่แล้ว จึงยังแก้ไขไม่ได้" });
      }
      await db.updateArticle(input.id, normalizeSubmission(input.article, input.action, ctx.user.id, ctx.user.name ?? ctx.user.email ?? null));
      return { success: true };
    }),
    review: adminProcedure.input(reviewActionSchema).mutation(async ({ ctx, input }) => {
      const article = await db.getArticleForEditor(input.id);
      if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบบทความที่ต้องการตรวจสอบ" });
      if (input.status === "published" && article.references.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ต้องมีแหล่งอ้างอิงอย่างน้อยหนึ่งรายการก่อนเผยแพร่" });
      }
      if (input.status === "changes_requested" && !input.reviewNote) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "กรุณาระบุเหตุผลหรือคำแนะนำสำหรับการแก้ไข" });
      }
      await db.updateArticleStatus(input.id, input.status, ctx.user.id, input.reviewNote || null);
      return { success: true };
    }),
  }),
  engagement: router({
    get: publicProcedure.input(z.object({ articleId: z.number().int().positive() })).query(({ ctx, input }) => db.getArticleEngagement(input.articleId, ctx.user?.id)),
    rate: protectedProcedure.input(z.object({ articleId: z.number().int().positive(), rating: z.number().int().min(1).max(5) })).mutation(async ({ ctx, input }) => {
      const article = await db.getArticleForEditor(input.articleId);
      if (!article || article.status !== "published") throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบบทความที่เปิดให้มีส่วนร่วม" });
      await db.upsertArticleRating(input.articleId, ctx.user.id, input.rating);
      return db.getArticleEngagement(input.articleId, ctx.user.id);
    }),
    vote: protectedProcedure.input(z.object({ articleId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const article = await db.getArticleForEditor(input.articleId);
      if (!article || article.status !== "published") throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบบทความที่เปิดให้มีส่วนร่วม" });
      await db.toggleArticleVote(input.articleId, ctx.user.id);
      return db.getArticleEngagement(input.articleId, ctx.user.id);
    }),
    comment: protectedProcedure.input(z.object({ articleId: z.number().int().positive(), body: z.string().trim().min(2).max(2000) })).mutation(async ({ ctx, input }) => {
      const article = await db.getArticleForEditor(input.articleId);
      if (!article || article.status !== "published") throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบบทความที่เปิดให้แสดงความคิดเห็น" });
      await db.createArticleComment(input.articleId, ctx.user.id, ctx.user.name ?? ctx.user.email ?? "สมาชิก", input.body);
      return db.getArticleEngagement(input.articleId, ctx.user.id);
    }),
    adminComments: adminProcedure.query(() => db.listArticleCommentsForAdmin()),
    hideComment: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => { await db.hideArticleComment(input.id); return { success: true }; }),
  }),
  media: router({
    uploadImage: protectedProcedure.input(z.object({
      filename: z.string().trim().min(1).max(255),
      mimeType: z.string().trim(),
      base64: z.string().min(1).max(7_000_000),
    })).mutation(async ({ ctx, input }) => {
      const extension = allowedImages.get(input.mimeType);
      if (!extension) throw new TRPCError({ code: "BAD_REQUEST", message: "รองรับเฉพาะไฟล์ JPG, PNG, WEBP และ GIF" });
      const bytes = Buffer.from(input.base64, "base64");
      if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024) {
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "ขนาดไฟล์ภาพต้องไม่เกิน 5 MB" });
      }
      const safeName = nanoid(12);
      const { key, url } = await storagePut(`editorial/${ctx.user.id}/${safeName}.${extension}`, bytes, input.mimeType);
      return { key, url };
    }),
  }),
});

export type AppRouter = typeof appRouter;
