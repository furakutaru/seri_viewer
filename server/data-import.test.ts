import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("dataImport", () => {
  it("createSale returns success message", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        role: "admin",
      },
    } as any);

    const result = await caller.dataImport.createSale({
      name: "2025年サマーセール",
      catalogUrl: "https://example.com/catalog.html",
      jokushaUrl: "https://example.com/jokusha.pdf",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("2025年サマーセール");
  });

  it("getImportStatus returns initial status", async () => {
    const caller = appRouter.createCaller({} as any);

    const result = await caller.dataImport.getImportStatus({
      saleId: 1,
    });

    expect(result.saleId).toBe(1);
    expect(result.catalogStatus).toBe("pending");
    expect(result.jokushaStatus).toBe("pending");
    expect(result.horsesCount).toBe(0);
  });

  it("createSale requires authentication", async () => {
    const caller = appRouter.createCaller({} as any);

    try {
      await caller.dataImport.createSale({
        name: "Test Sale",
        catalogUrl: "https://example.com/catalog.html",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });

  it("createSale validates URL format", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        role: "admin",
      },
    } as any);

    try {
      await caller.dataImport.createSale({
        name: "Test Sale",
        catalogUrl: "invalid-url",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Invalid");
    }
  });

  it("getImportStatus works for different sales", async () => {
    const caller = appRouter.createCaller({} as any);

    const result1 = await caller.dataImport.getImportStatus({ saleId: 1 });
    const result2 = await caller.dataImport.getImportStatus({ saleId: 2 });

    expect(result1.saleId).toBe(1);
    expect(result2.saleId).toBe(2);
  });
});
