import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: 7,
      openId: `${role}-editor`,
      name: "Editorial Tester",
      email: "editor@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
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
  it("blocks a non-admin from creating an article", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.articles.create({ article: articleWithoutSources, publish: false })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("requires a source before an admin can publish an article", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.articles.create({ article: articleWithoutSources, publish: true })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "บทความที่เผยแพร่ต้องระบุแหล่งอ้างอิงอย่างน้อยหนึ่งรายการ",
    });
  });

  it("rejects unsupported files before storage upload", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.media.uploadImage({ filename: "document.pdf", mimeType: "application/pdf", base64: "dGVzdA==" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "รองรับเฉพาะไฟล์ JPG, PNG, WEBP และ GIF",
    });
  });
});
