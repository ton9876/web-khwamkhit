import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { TOPICS } from "../shared/editorial";
import * as db from "./db";
import { storagePut } from "./storage";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

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
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9-]+$/, "ใช้ตัวอักษรอังกฤษ ตัวเลข และขีดกลางเท่านั้น"),
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

function normalizeArticle(input: z.infer<typeof articleInputSchema>, isPublished: boolean) {
  if (isPublished && input.references.length === 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "บทความที่เผยแพร่ต้องระบุแหล่งอ้างอิงอย่างน้อยหนึ่งรายการ" });
  }
  return {
    ...input,
    status: isPublished ? ("published" as const) : ("draft" as const),
    coverImageKey: input.coverImageKey || null,
    coverImageUrl: input.coverImageUrl || null,
    coverAlt: input.coverAlt || null,
    videoUrl: input.videoUrl || null,
    publishedAt: isPublished ? new Date() : null,
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
    getForEditor: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => db.getArticleForEditor(input.id)),
    create: adminProcedure.input(z.object({ article: articleInputSchema, publish: z.boolean().default(false) })).mutation(async ({ input }) => {
      const id = await db.createArticle(normalizeArticle(input.article, input.publish));
      return { id };
    }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), article: articleInputSchema, publish: z.boolean().default(false) })).mutation(async ({ input }) => {
      const existing = await db.getArticleForEditor(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบบทความที่ต้องการแก้ไข" });
      await db.updateArticle(input.id, normalizeArticle(input.article, input.publish));
      return { success: true };
    }),
  }),
  media: router({
    uploadImage: adminProcedure.input(z.object({
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
