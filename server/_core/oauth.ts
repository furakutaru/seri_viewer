import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      console.log("[OAuth] Code received, exchanging for token...");
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);

      const accessToken = (tokenResponse as any).access_token || tokenResponse.accessToken;
      if (!accessToken) {
        console.error("[OAuth] Failed to get access token from response:", tokenResponse);
        throw new Error("Access token missing");
      }

      console.log("[OAuth] Fetching user info...");
      const userInfo = await sdk.getUserInfo(accessToken);
      console.log("[OAuth] User info obtained for:", userInfo.email);

      if (!userInfo.openId) {
        throw new Error("openId missing from user info");
      }

      console.log("[OAuth] Updating database user...");
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      console.log("[OAuth] Creating session token...");
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[OAuth] Success, redirecting to home.");
      res.redirect(302, "/");
    } catch (error: any) {
      console.error("[OAuth] CRITICAL ERROR:", error.message);
      if (error.stack) console.error(error.stack);
      res.status(500).json({
        error: "OAuth callback failed",
        message: error.message,
        env_check: {
          has_app_id: !!process.env.VITE_APP_ID,
          has_secret: !!process.env.GOOGLE_CLIENT_SECRET,
          has_db: !!process.env.DATABASE_URL
        }
      });
    }

  });
}
