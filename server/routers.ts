import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getHorsesBySale,
  getHorseById,
  insertHorse,
  getUserCheckByUserAndHorse,
  upsertUserCheck,
  getUserCheckItems,
  createUserCheckItem,
  getPopularityStats,
  updatePopularityStats,
  getUserCheckResults,
  upsertUserCheckResult,
  deleteUserCheckItem,
  updateUserCheckItem,
} from "./db";

export const appRouter = router({
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

  // 馬データ関連
  horses: router({
    // セリの馬一覧を取得（フィルタリング対応）
    listBySale: publicProcedure
      .input(
        z.object({
          saleId: z.number(),
          sireName: z.string().optional(),
          breeder: z.string().optional(),
          heightMin: z.number().optional(),
          heightMax: z.number().optional(),
          girthMin: z.number().optional(),
          girthMax: z.number().optional(),
          cannonMin: z.number().optional(),
          cannonMax: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        const horses = await getHorsesBySale(input.saleId, {
          sireName: input.sireName,
          breeder: input.breeder,
          heightMin: input.heightMin,
          heightMax: input.heightMax,
          girthMin: input.girthMin,
          girthMax: input.girthMax,
          cannonMin: input.cannonMin,
          cannonMax: input.cannonMax,
        });

        // 各馬の人気度統計を取得
        const horsesWithStats = await Promise.all(
          horses.map(async (horse: any) => {
            const stats = await getPopularityStats(horse.id);
            return {
              ...horse,
              stats: stats || {
                countExcellent: 0,
                countGood: 0,
                countFair: 0,
              },
            };
          })
        );

        return horsesWithStats;
      }),

    // 馬の詳細情報を取得
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const horse = await getHorseById(input.id);
        if (!horse) return null;

        const stats = await getPopularityStats(horse.id);
        return {
          ...horse,
          stats: stats || {
            countExcellent: 0,
            countGood: 0,
            countFair: 0,
          },
        };
      }),
  }),

  // ユーザー評価関連
  userChecks: router({
    // ユーザーの馬に対する評価を取得
    getByHorse: protectedProcedure
      .input(z.object({ horseId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await getUserCheckByUserAndHorse(ctx.user.id, input.horseId);
      }),

    // ユーザーの評価を更新（◎○△、メモ、消フラグ）
    update: protectedProcedure
      .input(
        z.object({
          horseId: z.number(),
          evaluation: z.enum(["◎", "○", "△"]).nullable().optional(),
          memo: z.string().optional(),
          isEliminated: z.boolean().optional(),
          totalScore: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await upsertUserCheck(ctx.user.id, input.horseId, {
          evaluation: input.evaluation ?? null,
          memo: input.memo,
          isEliminated: input.isEliminated,
          totalScore: input.totalScore,
        });

        // 統計を更新
        await updatePopularityStats(input.horseId);

        return { success: true };
      }),
  }),

  // チェックリスト関連
  checkItems: router({
    // ユーザーのチェック項目一覧を取得
    list: protectedProcedure
      .input(z.object({ saleId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await getUserCheckItems(ctx.user.id, input.saleId);
      }),

    // チェック項目を作成
    create: protectedProcedure
      .input(
        z.object({
          saleId: z.number(),
          itemName: z.string(),
          itemType: z.enum(["boolean", "numeric"]),
          score: z.number(),
          criteria: z.any().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await createUserCheckItem(ctx.user.id, input.saleId, {
          itemName: input.itemName,
          itemType: input.itemType,
          score: input.score,
          criteria: input.criteria,
        });

        return { success: true };
      }),

    // チェック項目を更新
    update: protectedProcedure
      .input(
        z.object({
          itemId: z.number(),
          itemName: z.string().optional(),
          score: z.number().optional(),
          criteria: z.any().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updateUserCheckItem(input.itemId, {
          itemName: input.itemName,
          score: input.score,
          criteria: input.criteria,
        });
        return { success: true };
      }),

    // チェック項目を削除
    delete: protectedProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteUserCheckItem(input.itemId);
        return { success: true };
      }),
  }),

  // チェック結果関連
  checkResults: router({
    // ユーザーのチェック結果一覧を取得
    list: protectedProcedure
      .input(z.object({ userCheckId: z.number() }))
      .query(async ({ input }) => {
        return await getUserCheckResults(input.userCheckId);
      }),

    // チェック結果を更新
    update: protectedProcedure
      .input(
        z.object({
          userCheckId: z.number(),
          checkItemId: z.number(),
          isChecked: z.boolean(),
          scoreApplied: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await upsertUserCheckResult(
          input.userCheckId,
          input.checkItemId,
          input.isChecked,
          input.scoreApplied
        );

        return { success: true };
      }),
  }),

  // 比較機能関連
  comparison: router({
    // 複数の馬の詳細情報を取得（比較用）
    getMultiple: protectedProcedure
      .input(z.object({ horseIds: z.array(z.number()) }))
      .query(async ({ input, ctx }) => {
        const horses = await Promise.all(
          input.horseIds.map((id) => getHorseById(id))
        );

        // 各馬のユーザー評価を取得
        const evaluations = await Promise.all(
          input.horseIds.map((id) => getUserCheckByUserAndHorse(ctx.user.id, id))
        );

        return horses.map((horse, index) => ({
          ...horse,
          userEvaluation: evaluations[index],
        }));
      }),

    // 比較画面での評価を一括更新
    updateEvaluations: protectedProcedure
      .input(
        z.object({
          updates: z.array(
            z.object({
              horseId: z.number(),
              evaluation: z.enum(["◎", "○", "△"]).nullable().optional(),
              isEliminated: z.boolean().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await Promise.all(
          input.updates.map((update) =>
            upsertUserCheck(ctx.user.id, update.horseId, {
              evaluation: update.evaluation ?? null,
              isEliminated: update.isEliminated,
            })
          )
        );

        // 統計を更新
        await Promise.all(
          input.updates.map((update) => updatePopularityStats(update.horseId))
        );

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
