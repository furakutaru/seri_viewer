import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    if (process.env.NODE_ENV === "development") {
      // Bypass auth in development to allow local testing
      // Try to get from DB first, if fails, use a mock
      try {
        const { getUserByOpenId } = await import("../db");
        const { ENV } = await import("./env");
        user = (await getUserByOpenId(ENV.ownerOpenId)) || null;
      } catch (e) {
        console.warn("[Auth] DB lookup for dev user failed, using mock");
      }

      // If still no user, provide a mock admin user for dev
      if (!user) {
        user = {
          id: 1,
          openId: "admin",
          name: "Local Admin (Mock)",
          email: "admin@local.test",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        } as User;
      }
    } else {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    console.error("[Auth] Authentication failed:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
