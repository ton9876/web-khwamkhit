import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import * as storage from "./storage";
import type { TrpcContext } from "./_core/context";

function createContext(role: "admin" | "user"): TrpcContext {
  return {
    user: { id: 7, openId: `${role}-editor`, name: "Editorial Tester", email: "editor@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUnauthenticatedContext(): TrpcContext {
  return { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const articleWithoutSources = {
  slug: "editorial-test-article",
  title: "บทความทดสอบสำหรับสิทธิ์บรรณาธิการ",
  excerpt: "เนื้อหาสำหรับตรวจสอบการทำงานของการเผยแพร่บทความและการอ้างอิง",
  topic: "living" as const,
  body: ["ย่อหน้าสำหรับทดสอบความถูกต้องของกฎการเผยแพร่บทความ"],
  references: [],
};

describe("editorial authorization and validation", () => {
  it("blocks a non-admin from using the direct publishing endpoint", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.articles.create({ article: articleWithoutSources, publish: false })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("requires a source before an admin can publish an article", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(caller.articles.create({ article: articleWithoutSources, publish: true })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "บทความที่เผยแพร่ต้องระบุแหล่งอ้างอิงอย่างน้อยหนึ่งรายการ" });
  });

  it("requires authentication before rating an article", async () => {
    const caller = appRouter.createCaller(createUnauthenticatedContext());
    await expect(caller.engagement.rate({ articleId: 1, rating: 5 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects unsupported files before storage upload", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(caller.media.uploadImage({ filename: "document.pdf", mimeType: "application/pdf", base64: "dGVzdA==" })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "รองรับเฉพาะไฟล์ JPG, PNG, WEBP และ GIF" });
  });

  it("prevents unauthenticated users from submitting articles or comments", async () => {
    const caller = appRouter.createCaller(createUnauthenticatedContext());
    await expect(caller.articles.myCreate({ article: articleWithoutSources, action: "draft" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.engagement.comment({ articleId: 1, body: "ความคิดเห็นทดสอบ" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("does not expose another user's article through myGet", async () => {
    vi.spyOn(db, "getArticleForAuthor").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.articles.myGet({ id: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("locks a submitted article from owner edits", async () => {
    vi.spyOn(db, "getArticleForAuthor").mockResolvedValue({ status: "submitted" } as never);
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.articles.myUpdate({ id: 999, article: articleWithoutSources, action: "draft" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks review actions from non-admin users", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.articles.review({ id: 1, status: "approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("creates a submitted article owned by the current user", async () => {
    const create = vi.spyOn(db, "createArticle").mockResolvedValue(321);
    const caller = appRouter.createCaller(createContext("user"));
    const result = await caller.articles.myCreate({ article: { ...articleWithoutSources, references: [{ title: "แหล่งอ้างอิงทดสอบ", url: "https://example.com/source" }] }, action: "submit" });
    expect(result).toEqual({ id: 321 });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ authorId: 7, status: "submitted", submittedAt: expect.any(Date) }));
  });

  it("runs the contributor media and submission flow with references", async () => {
    const upload = vi.spyOn(storage, "storagePut").mockResolvedValue({ key: "editorial/7/test.webp", url: "/manus-storage/editorial/7/test.webp" });
    const create = vi.spyOn(db, "createArticle").mockResolvedValue(654);
    const caller = appRouter.createCaller(createContext("user"));
    const media = await caller.media.uploadImage({ filename: "cover.webp", mimeType: "image/webp", base64: "aGVsbG8=" });
    const references = [{ title: "แหล่งอ้างอิงของผู้ส่ง", url: "https://example.com/reference" }];
    const result = await caller.articles.myCreate({ article: { ...articleWithoutSources, coverImageKey: media.key, coverImageUrl: media.url, coverAlt: "ภาพปกบทความ", references }, action: "submit" });
    expect(media).toEqual({ key: "editorial/7/test.webp", url: "/manus-storage/editorial/7/test.webp" });
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^editorial\/7\/[A-Za-z0-9_-]+\.webp$/), expect.any(Buffer), "image/webp");
    expect(result).toEqual({ id: 654 });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ status: "submitted", coverImageKey: media.key, coverImageUrl: media.url, references, authorId: 7 }));
  });

  it("requires a review note when sending an article back", async () => {
    vi.spyOn(db, "getArticleForEditor").mockResolvedValue({ references: [{ title: "source", url: "https://example.com" }] } as never);
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(caller.articles.review({ id: 12, status: "changes_requested" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("records admin review transitions", async () => {
    vi.spyOn(db, "getArticleForEditor").mockResolvedValue({ references: [{ title: "source", url: "https://example.com" }] } as never);
    const updateStatus = vi.spyOn(db, "updateArticleStatus").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(caller.articles.review({ id: 12, status: "changes_requested", reviewNote: "กรุณาเพิ่มข้อมูลอ้างอิง" })).resolves.toEqual({ success: true });
    await expect(caller.articles.review({ id: 12, status: "approved" })).resolves.toEqual({ success: true });
    await expect(caller.articles.review({ id: 12, status: "published" })).resolves.toEqual({ success: true });
    expect(updateStatus).toHaveBeenCalledTimes(3);
    expect(updateStatus).toHaveBeenLastCalledWith(12, "published", 7, null);
  });

  it("supports one editable rating and a toggle vote per user", async () => {
    vi.spyOn(db, "getArticleForEditor").mockResolvedValue({ status: "published" } as never);
    vi.spyOn(db, "upsertArticleRating").mockResolvedValue(undefined);
    vi.spyOn(db, "toggleArticleVote").mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    vi.spyOn(db, "getArticleEngagement").mockResolvedValue({ ratingAverage: 5, ratingCount: 1, voteCount: 1, viewerRating: 5, viewerVoted: true, comments: [] });
    const caller = appRouter.createCaller(createContext("user"));
    await caller.engagement.rate({ articleId: 12, rating: 5 });
    await caller.engagement.rate({ articleId: 12, rating: 4 });
    await caller.engagement.vote({ articleId: 12 });
    await caller.engagement.vote({ articleId: 12 });
    expect(db.upsertArticleRating).toHaveBeenCalledTimes(2);
    expect(db.toggleArticleVote).toHaveBeenCalledTimes(2);
  });

  it("creates and hides comments only through the appropriate roles", async () => {
    vi.spyOn(db, "getArticleForEditor").mockResolvedValue({ status: "published" } as never);
    vi.spyOn(db, "createArticleComment").mockResolvedValue(77);
    vi.spyOn(db, "getArticleEngagement").mockResolvedValue({ ratingAverage: 0, ratingCount: 0, voteCount: 0, viewerRating: null, viewerVoted: false, comments: [] });
    const hide = vi.spyOn(db, "hideArticleComment").mockResolvedValue(undefined);
    const userCaller = appRouter.createCaller(createContext("user"));
    const adminCaller = appRouter.createCaller(createContext("admin"));
    await expect(userCaller.engagement.comment({ articleId: 12, body: "ความคิดเห็นที่มีประโยชน์" })).resolves.toMatchObject({ comments: [] });
    await expect(adminCaller.engagement.hideComment({ id: 77 })).resolves.toEqual({ success: true });
    expect(hide).toHaveBeenCalledWith(77);
    await expect(userCaller.engagement.hideComment({ id: 77 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("unpublishes an article through the admin update flow", async () => {
    vi.spyOn(db, "getArticleForEditor").mockResolvedValue({ status: "published" } as never);
    const update = vi.spyOn(db, "updateArticle").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(caller.articles.update({ id: 12, article: { ...articleWithoutSources, references: [{ title: "source", url: "https://example.com" }] }, publish: false })).resolves.toEqual({ success: true });
    expect(update).toHaveBeenCalledWith(12, expect.objectContaining({ status: "draft", publishedAt: null }));
  });

  it("excludes hidden comments from the public engagement result", async () => {
    const engagement = vi.spyOn(db, "getArticleEngagement").mockResolvedValue({ ratingAverage: 0, ratingCount: 0, voteCount: 0, viewerRating: null, viewerVoted: false, comments: [] });
    const caller = appRouter.createCaller(createUnauthenticatedContext());
    const result = await caller.engagement.get({ articleId: 12 });
    expect(result.comments).toHaveLength(0);
    expect(engagement).toHaveBeenCalledWith(12, undefined);
  });

  it("validates ratings to a five-point scale", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.engagement.rate({ articleId: 1, rating: 6 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
