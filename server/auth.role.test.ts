import { describe, expect, it } from "vitest";
import { resolveRoleUpdate } from "./db";

describe("user role persistence", () => {
  it("does not update an existing role for a normal OAuth callback", () => {
    expect(resolveRoleUpdate(undefined, false)).toBeUndefined();
  });

  it("restores admin for the configured owner when the callback has no role", () => {
    expect(resolveRoleUpdate(undefined, true)).toBe("admin");
  });

  it("honors an explicit role when one is provided", () => {
    expect(resolveRoleUpdate("admin", false)).toBe("admin");
    expect(resolveRoleUpdate("user", true)).toBe("user");
  });
});
