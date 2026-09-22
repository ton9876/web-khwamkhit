import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("public social metadata", () => {
  it("exposes an absolute Open Graph image and article URL", () => {
    const html = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

    expect(html).toContain('<meta property="og:type" content="website" />');
    expect(html).toContain('<meta property="og:url" content="https://khwamkhit-gwjjpjtp.manus.space/articles" />');
    expect(html).toContain('property="og:image" content="https://khwamkhit-gwjjpjtp.manus.space/manus-storage/kiddee-hero_4b6562c3.png"');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
  });
});
