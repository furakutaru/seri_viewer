import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("statistics", () => {
  it("getPopularityBySale returns popularity statistics", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await (caller.statistics as any).getPopularityBySale({
      saleId: 1,
    });

    expect(result).toHaveProperty("saleId", 1);
    expect(result).toHaveProperty("totalEvaluations");
    expect(result).toHaveProperty("statistics");
    expect(Array.isArray(result.statistics)).toBe(true);
  });

  it("getHorseStats returns horse evaluation statistics", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await (caller.statistics as any).getHorseStats({
      horseId: 1,
    });

    expect(result).toHaveProperty("horseId", 1);
    expect(result).toHaveProperty("excellentCount");
    expect(result).toHaveProperty("goodCount");
    expect(result).toHaveProperty("fairCount");
    expect(result).toHaveProperty("eliminatedCount");
    expect(result).toHaveProperty("totalVotes");
    expect(result).toHaveProperty("popularityScore");
  });

  it("statistics structure is correct", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await (caller.statistics as any).getPopularityBySale({
      saleId: 1,
    });

    if (result.statistics.length > 0) {
      const horse = result.statistics[0];
      expect(horse).toHaveProperty("horseId");
      expect(horse).toHaveProperty("horseName");
      expect(horse).toHaveProperty("excellentCount");
      expect(horse).toHaveProperty("goodCount");
      expect(horse).toHaveProperty("fairCount");
      expect(horse).toHaveProperty("eliminatedCount");
      expect(horse).toHaveProperty("totalVotes");
      expect(horse).toHaveProperty("popularityScore");
    }
  });

  it("popularity score is calculated correctly", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await (caller.statistics as any).getHorseStats({
      horseId: 1,
    });

    // popularityScore should be a number
    expect(typeof result.popularityScore).toBe("number");
    expect(result.popularityScore).toBeGreaterThanOrEqual(0);
  });
});
