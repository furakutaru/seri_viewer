import { COOKIE_NAME } from "../shared/const";
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
  bulkSaveUserCheck,
  getPopularityStats,
  getAllSales,
  createSale,
  updateSale,
  updateSaleStatus,
  deleteSale,
  getUserCheckItems,
  createUserCheckItem,
  updateUserCheckItem,
  deleteUserCheckItem,
  getUserCheckResults,
  saveUserCheckResults,
  getPedigreeUrl,
  savePedigreeUrl,
  getDb,
  getAllPedigreeUrls,
  getUniqueSires
} from "./db";
import { horses, sales, userChecks, userCheckItems, userCheckResults, pedigreeUrls } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { googleSearchService } from "./_core/googleSearch";
import { jbisImportService } from "./_core/jbisImport";
import { jbisHorseLinkerService } from "./_core/jbisHorseLinker";

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
    getAll: publicProcedure.query(async ({ ctx }) => {
      return await getAllHorses(ctx.user?.role);
    }),
    getAllWithStats: protectedProcedure.query(async ({ ctx }) => {
      return await getAllHorsesForUser(ctx.user.id, ctx.user.role);
    }),
    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await getHorseById(input);
      }),
    getByLotNumber: publicProcedure
      .input(z.object({ lotNumber: z.number(), saleId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        try {
          const conditions = input.saleId
            ? and(eq(horses.lotNumber, input.lotNumber), eq(horses.saleId, input.saleId))
            : eq(horses.lotNumber, input.lotNumber);

          const result = await db
            .select({
              horse: horses,
              sale: sales,
            })
            .from(horses)
            .leftJoin(sales, eq(horses.saleId, sales.id))
            .where(conditions)
            .limit(1);

          if (result.length === 0) return null;

          return {
            ...result[0].horse,
            sale: result[0].sale,
          };
        } catch (error) {
          console.error("[Database] Failed to get horse by lot number:", error);
          return null;
        }
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
    bulkSaveUserCheck: protectedProcedure
      .input(z.object({
        horseIds: z.array(z.number()),
        evaluation: z.enum(["◎", "○", "△"]).nullable(),
        isEliminated: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await bulkSaveUserCheck(
          ctx.user.id,
          input.horseIds,
          input.evaluation,
          input.isEliminated
        );
      }),
    getSires: protectedProcedure
      .query(async () => {
        return await getUniqueSires();
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
          saleId: z.number().optional(),
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
          return await deleteUserCheckItem(input, ctx.user.id);
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
    pedigreeUrls: router({
      getByName: protectedProcedure
        .input(z.string())
        .query(async ({ input }) => {
          return await getPedigreeUrl(input);
        }),
      searchAndSave: publicProcedure
        .input(z.string())
        .mutation(async ({ input }) => {
          console.log('[DEBUG] searchAndSave called with:', input);

          // Check if already exists
          const existing = await getPedigreeUrl(input);
          if (existing && existing.jbisUrl) {
            console.log('[DEBUG] Found existing URL:', existing);
            return existing;
          }

          // Try Google Search
          console.log('[DEBUG] Trying Google Search...');
          const googleUrl = await googleSearchService.searchJbisUrl(input);
          console.log('[DEBUG] Google Search result:', googleUrl);

          // Save to database (even if null)
          return await savePedigreeUrl(input, googleUrl || undefined);
        }),
      getAll: protectedProcedure
        .query(async () => {
          return await getAllPedigreeUrls();
        }),
    }),
  }),

  sales: router({
    getAll: publicProcedure.query(async ({ ctx }) => {
      return await getAllSales(ctx.user?.role);
    }),
  }),

  admin: router({
    importData: publicProcedure
      .input(z.object({
        saleId: z.number(),
        catalogUrl: z.string().url(),
        pdfUrls: z.array(z.string().url()),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await importCatalogAndMeasurements(
            input.saleId,
            input.catalogUrl,
            input.pdfUrls
          );
          return result;
        } catch (error: any) {
          throw new Error(`Import failed: ${error.message}`);
        }
      }),

    // セリの新規作成
    createSale: protectedProcedure
      .input(z.object({
        saleCode: z.string().min(1).max(32),
        saleName: z.string().min(1).max(256),
        saleDate: z.date(),
        status: z.enum(["draft", "published", "hidden"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error("Unauthorized");
        return await createSale(input);
      }),

    // セリ情報の更新
    updateSale: protectedProcedure
      .input(z.object({
        id: z.number(),
        saleCode: z.string().min(1).max(32).optional(),
        saleName: z.string().min(1).max(256).optional(),
        saleDate: z.date().optional(),
        catalogUrl: z.string().url().optional(),
        status: z.enum(["draft", "published", "hidden"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error("Unauthorized");
        const { id, ...data } = input;
        return await updateSale(id, data);
      }),

    // セリのステータス更新
    updateSaleStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "published", "hidden"]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error("Unauthorized");
        return await updateSaleStatus(input.id, input.status);
      }),

    // セリの削除
    deleteSale: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error("Unauthorized");
        return await deleteSale(input);
      }),

    // JBIS URLをインポート（バッチ処理）
    importJbisUrls: publicProcedure
      .input(z.object({
        saleUrl: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        console.log(`[API] Starting batch JBIS import for single URL: ${input.saleUrl}`);

        try {
          // JBISデータを取得
          const { jbisScraperService } = await import('./_core/jbisScraper');
          console.log(`[API] Scraper imported successfully`);
          
          const horseData = await jbisScraperService.scrapeSalePage(input.saleUrl);
          console.log(`[API] Scraped ${horseData.length} horses`);
          
          if (horseData.length === 0) {
            console.log(`[API] No horse data found for ${input.saleUrl}`);
            return { success: 0, skipped: 0, errors: ['No horse data found'], total: 0 };
          }
          
          // 高速バッチ処理を実行（30件ずつ）
          console.log(`[API] Starting batch processing for ${horseData.length} horses`);
          const batchResult = await jbisHorseLinkerService.linkJbisUrlsToHorsesBatch(horseData, 30, 1);
          console.log(`[API] Batch processing completed`);
          
          const result = {
            success: batchResult.summary.updated + batchResult.summary.sireUpdated + batchResult.summary.damUpdated,
            skipped: batchResult.summary.notFound,
            errors: batchResult.summary.errors,
            total: batchResult.totalProcessed
          };
          
          console.log(`[API] Final result: ${result.success} updated, ${result.total} total`);
          return result;
          
        } catch (error: any) {
          console.error('[API] JBIS import failed:', error);
          console.error('[API] Error stack:', error.stack);
          
          // tRPCの標準エラー処理を使用
          throw new Error(`JBIS import failed: ${error.message || 'Unknown error'}`);
        }
      }),

    // 複数のJBISセールURLを一括インポート（バッチ処理）
    importMultipleJbisUrls: publicProcedure
      .input(z.object({
        saleUrls: z.array(z.string().url()),
      }))
      .mutation(async ({ input }) => {
        try {
          console.log(`[API] Starting batch JBIS import for ${input.saleUrls.length} URLs`);
          
          let totalResult = { success: 0, skipped: 0, errors: [] as string[], total: 0 };
          
          for (const saleUrl of input.saleUrls) {
            console.log(`[API] Processing: ${saleUrl}`);
            
            // JBISデータを取得
            const { jbisScraperService } = await import('./_core/jbisScraper');
            const horseData = await jbisScraperService.scrapeSalePage(saleUrl);
            
            if (horseData.length === 0) {
              totalResult.errors.push(`No horse data found for ${saleUrl}`);
              continue;
            }
            
            // 高速バッチ処理を実行（30件ずつ）
            const batchResult = await jbisHorseLinkerService.linkJbisUrlsToHorsesBatch(horseData, 30, 1);
            
            totalResult.success += batchResult.summary.updated + batchResult.summary.sireUpdated + batchResult.summary.damUpdated;
            totalResult.total += batchResult.totalProcessed;
            totalResult.errors.push(...batchResult.summary.errors);
            
            console.log(`[API] Completed ${saleUrl}: ${batchResult.summary.updated} horses updated, ${batchResult.totalProcessed} total processed`);
          }
          
          console.log(`[API] All URLs processed: ${totalResult.success} total updates, ${totalResult.errors.length} errors`);
          return totalResult;
        } catch (error: any) {
          console.error('[API] Multiple JBIS import failed:', error);
          throw new Error(`Multiple JBIS import failed: ${error.message}`);
        }
      }),

    // JBIS URLの紐付け状況を確認
    checkJbisStatus: publicProcedure
      .query(async () => {
        try {
          const status = await jbisHorseLinkerService.checkExistingJbisUrls();
          return status;
        } catch (error: any) {
          throw new Error(`JBIS status check failed: ${error.message}`);
        }
      }),

    // バッチ処理でJBIS URLを紐付け
    importJbisUrlsBatch: publicProcedure
      .input(z.object({
        saleUrl: z.string().url(),
        batchSize: z.number().min(10).max(200).default(100),
        startFrom: z.number().min(1).default(1),
        endAt: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          console.log(`[API] Starting batch JBIS import: ${input.saleUrl}, batch size: ${input.batchSize}, start from: ${input.startFrom}`);
          
          // JBISデータを取得
          const { jbisScraperService } = await import('./_core/jbisScraper');
          const horseData = await jbisScraperService.scrapeSalePage(input.saleUrl);
          
          // 指定範囲でデータをフィルタリング
          let filteredData = horseData;
          if (input.startFrom > 1 || input.endAt) {
            filteredData = horseData.filter((horse: any) => {
              const lotNumber = parseInt(horse.horseName);
              if (isNaN(lotNumber)) return false;
              
              const inRange = lotNumber >= input.startFrom && (!input.endAt || lotNumber <= input.endAt);
              return inRange;
            });
            
            console.log(`[API] Filtered to ${filteredData.length} horses (lot ${input.startFrom}${input.endAt ? `-${input.endAt}` : '+'})`);
          }
          
          // バッチ処理を実行
          const result = await jbisHorseLinkerService.linkJbisUrlsToHorsesBatch(
            filteredData, 
            input.batchSize, 
            Math.ceil(input.startFrom / input.batchSize)
          );
          
          return {
            success: true,
            ...result,
            input: {
              totalHorses: horseData.length,
              filteredHorses: filteredData.length,
              batchSize: input.batchSize,
              startFrom: input.startFrom,
              endAt: input.endAt
            }
          };
        } catch (error: any) {
          console.error('[API] Batch JBIS import failed:', error);
          throw new Error(`Batch JBIS import failed: ${error.message}`);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
