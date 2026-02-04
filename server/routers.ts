import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "../shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { importCatalogAndMeasurements } from "./import-data";
import { z } from "zod";

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

  // Data import router
  admin: router({
    importData: protectedProcedure
      .input(z.object({
        catalogUrl: z.string().url(),
        pdfUrls: z.array(z.string().url()),
      }))
      .mutation(async ({ input, ctx }) => {
        // Admin only
        if (ctx.user?.role !== 'admin') {
          throw new Error('Admin access required');
        }

        try {
          // Import catalog and measurements
          const result = await importCatalogAndMeasurements(
            1,
            input.catalogUrl,
            input.pdfUrls
          );

          return {
            success: true,
            message: `Successfully imported ${result.insertedCount} horses`,
            details: result,
          };
        } catch (error: any) {
          console.error('Import failed:', error);
          throw new Error(`Import failed: ${error.message}`);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
