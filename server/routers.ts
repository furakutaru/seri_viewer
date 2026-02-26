import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { importCatalogAndMeasurements } from "./import-data";
import { getAllHorses, getAllHorsesWithStats, getHorseById, getUserCheck, saveUserCheck, getPopularityStats, getAllSales } from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  horses: router({
    getAll: publicProcedure.query(async () => {
      return await getAllHorses();
    }),
    getAllWithStats: publicProcedure.query(async () => {
      return await getAllHorsesWithStats();
    }),
    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await getHorseById(input);
      }),
    getUserCheck: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        return await getUserCheck(ctx.user.id, input);
      }),
    saveUserCheck: protectedProcedure
      .input(z.object({
        horseId: z.number(),
        evaluation: z.enum(["◎", "○", "△"]).nullable(),
        memo: z.string(),
        isEliminated: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await saveUserCheck(
          ctx.user.id,
          input.horseId,
          input.evaluation,
          input.memo,
          input.isEliminated
        );
      }),
    getPopularityStats: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await getPopularityStats(input);
      }),
  }),

  sales: router({
    getAll: publicProcedure.query(async () => {
      return await getAllSales();
    }),
  }),

  admin: router({
    importData: publicProcedure
      .input(z.object({
        catalogUrl: z.string().url(),
        pdfUrls: z.array(z.string().url()),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await importCatalogAndMeasurements(
            1,
            input.catalogUrl,
            input.pdfUrls
          );
          return result;
        } catch (error: any) {
          throw new Error(`Import failed: ${error.message}`);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
