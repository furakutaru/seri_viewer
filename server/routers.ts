import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { importCatalogAndMeasurements } from "./import-data";
import { 
  getAllHorses, 
  getAllHorsesForUser, 
  getHorseById, 
  getUserCheck, 
  saveUserCheck, 
  getPopularityStats, 
  getAllSales,
  getUserCheckItems,
  createUserCheckItem,
  updateUserCheckItem,
  deleteUserCheckItem,
  getUserCheckResults,
  saveUserCheckResults
} from "./db";

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
    getAllWithStats: protectedProcedure.query(async ({ ctx }) => {
      return await getAllHorsesForUser(ctx.user.id);
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
    checkListItems: router({
      getAll: protectedProcedure
        .input(z.object({
          saleId: z.number().optional(),
        }))
        .query(async ({ input, ctx }) => {
          return await getUserCheckItems(ctx.user.id, input.saleId);
        }),
      create: protectedProcedure
        .input(z.object({
          saleId: z.number(),
          itemName: z.string().min(1).max(256),
          itemType: z.enum(["boolean", "numeric"]),
          score: z.number().min(0).max(100),
          criteria: z.any().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return await createUserCheckItem(
            ctx.user.id,
            input.saleId,
            input.itemName,
            input.itemType,
            input.score,
            input.criteria
          );
        }),
      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          itemName: z.string().min(1).max(256).optional(),
          itemType: z.enum(["boolean", "numeric"]).optional(),
          score: z.number().min(0).max(100).optional(),
          criteria: z.any().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return await updateUserCheckItem(
            input.id,
            input.itemName,
            input.itemType,
            input.score,
            input.criteria
          );
        }),
      delete: protectedProcedure
        .input(z.number())
        .mutation(async ({ input, ctx }) => {
          return await deleteUserCheckItem(input);
        }),
    }),
    checkListResults: router({
      getForHorse: protectedProcedure
        .input(z.number())
        .query(async ({ input, ctx }) => {
          // First get userCheckId for this horse and user
          const userCheck = await getUserCheck(ctx.user.id, input);
          if (!userCheck) return [];
          
          return await getUserCheckResults(userCheck.id);
        }),
      getTotalScore: protectedProcedure
        .input(z.number())
        .query(async ({ input, ctx }) => {
          // First get userCheckId for this horse and user
          const userCheck = await getUserCheck(ctx.user.id, input);
          if (!userCheck) return 0;
          
          const results = await getUserCheckResults(userCheck.id);
          return results.reduce((total, { result }) => total + (result?.scoreApplied || 0), 0);
        }),
      save: protectedProcedure
        .input(z.object({
          horseId: z.number(),
          results: z.array(z.object({
            checkItemId: z.number(),
            isChecked: z.boolean(),
            scoreApplied: z.number().optional(),
          })),
        }))
        .mutation(async ({ input, ctx }) => {
          // First get or create userCheck for this horse
          let userCheck = await getUserCheck(ctx.user.id, input.horseId);
          
          if (!userCheck) {
            // Create a basic userCheck if it doesn't exist
            userCheck = await saveUserCheck(
              ctx.user.id,
              input.horseId,
              null,
              "",
              false
            );
          }
          
          if (!userCheck) {
            throw new Error("Failed to create or retrieve user check");
          }
          
          return await saveUserCheckResults(userCheck.id, input.results);
        }),
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
