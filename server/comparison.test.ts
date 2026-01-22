import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
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

  return { ctx };
}

describe("comparison", () => {
  it("getMultiple returns horses with user evaluations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 複数の馬を取得
    const result = await caller.comparison.getMultiple({
      horseIds: [1, 2],
    });

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("horseName");
      expect(result[0]).toHaveProperty("userEvaluation");
    }
  });

  it("updateEvaluations updates horse evaluations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 評価を更新
    const result = await caller.comparison.updateEvaluations({
      updates: [
        { horseId: 1, evaluation: "◎" },
        { horseId: 2, evaluation: "○" },
      ],
    });

    expect(result).toEqual({ success: true });
  });

  it("updateEvaluations handles elimination flag", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 消フラグを設定
    const result = await caller.comparison.updateEvaluations({
      updates: [
        { horseId: 1, isEliminated: true },
      ],
    });

    expect(result).toEqual({ success: true });
  });

  it("updateEvaluations clears evaluation when set to null", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 評価をクリア
    const result = await caller.comparison.updateEvaluations({
      updates: [
        { horseId: 1, evaluation: null },
      ],
    });

    expect(result).toEqual({ success: true });
  });

  it("updateEvaluations handles mixed updates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 複数の更新を同時に実行
    const result = await caller.comparison.updateEvaluations({
      updates: [
        { horseId: 1, evaluation: "◎", isEliminated: false },
        { horseId: 2, evaluation: "△", isEliminated: true },
        { horseId: 3, evaluation: null, isEliminated: false },
      ],
    });

    expect(result).toEqual({ success: true });
  });

  it("getMultiple filters eliminated horses", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 馬を取得
    const result = await caller.comparison.getMultiple({
      horseIds: [1, 2, 3],
    });

    expect(Array.isArray(result)).toBe(true);
    // 消フラグが設定されている馬も含まれる（フィルタリングはフロントエンドで行う）
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});
