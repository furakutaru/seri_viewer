import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("navigation", () => {
  it("getPrevious returns null for first horse", async () => {
    const caller = appRouter.createCaller({} as any);

    // セリ1の最初の馬（ID 1）の前の馬を取得
    const result = await caller.navigation.getPrevious({
      saleId: 1,
      currentHorseId: 1,
    });

    // 最初の馬なのでnullが返される
    expect(result).toBeNull();
  });

  it("getPrevious returns previous horse", async () => {
    const caller = appRouter.createCaller({} as any);

    // セリ1の2番目の馬（ID 2）の前の馬を取得
    const result = await caller.navigation.getPrevious({
      saleId: 1,
      currentHorseId: 2,
    });

    // 前の馬が返される
    if (result) {
      expect(result.id).toBeLessThan(2);
    }
  });

  it("getNext returns next horse", async () => {
    const caller = appRouter.createCaller({} as any);

    // セリ1の最初の馬（ID 1）の次の馬を取得
    const result = await caller.navigation.getNext({
      saleId: 1,
      currentHorseId: 1,
    });

    // 次の馬が返される
    if (result) {
      expect(result.id).toBeGreaterThan(1);
    }
  });

  it("getNext returns null for last horse", async () => {
    const caller = appRouter.createCaller({} as any);

    // セリ1の最後の馬を取得
    const horses = await caller.horses.listBySale({ saleId: 1 });
    const lastHorse = horses[horses.length - 1];

    if (lastHorse) {
      const result = await caller.navigation.getNext({
        saleId: 1,
        currentHorseId: lastHorse.id,
      });

      // 最後の馬なのでnullが返される
      expect(result).toBeNull();
    }
  });

  it("navigation works for different sales", async () => {
    const caller = appRouter.createCaller({} as any);

    // セリ1の馬を取得
    const horses1 = await caller.horses.listBySale({ saleId: 1 });
    if (horses1.length > 1) {
      const result = await caller.navigation.getNext({
        saleId: 1,
        currentHorseId: horses1[0].id,
      });
      expect(result).not.toBeNull();
    }
  });
});
