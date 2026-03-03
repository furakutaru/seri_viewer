import type { Express, Request, Response } from "express";
import * as db from "../db";
import { sdk } from "./sdk";

// 簡易的なユーザーストア（開発用）
const mockUsers = new Map<string, any>();

export function registerMockOAuthRoutes(app: Express) {
  // モックOAuth認証ページ
  app.get("/mock-oauth", (req: Request, res: Response) => {
    const { appId, redirectUri, state } = req.query;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>モックOAuthログイン</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; }
          .form-group { margin-bottom: 15px; }
          label { display: block; margin-bottom: 5px; }
          input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
          button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <h2>モックOAuthログイン</h2>
        <p>開発用の認証ページです</p>
        <form method="post" action="/mock-oauth/callback">
          <input type="hidden" name="appId" value="${appId}">
          <input type="hidden" name="redirectUri" value="${redirectUri}">
          <input type="hidden" name="state" value="${state}">
          
          <div class="form-group">
            <label>ユーザー名:</label>
            <input type="text" name="username" required placeholder="テストユーザー名">
          </div>
          
          <div class="form-group">
            <label>メール:</label>
            <input type="email" name="email" required placeholder="test@example.com">
          </div>
          
          <button type="submit">ログイン</button>
        </form>
      </body>
      </html>
    `);
  });

  // モックOAuthコールバック
  app.post("/mock-oauth/callback", async (req: Request, res: Response) => {
    const { appId, redirectUri, state, username, email } = req.body;
    
    if (!username || !email) {
      res.status(400).send("ユーザー名とメールは必須です");
      return;
    }

    try {
      // モックユーザーを作成
      const openId = `mock_${username}_${Date.now()}`;
      
      await db.upsertUser({
        openId,
        name: username,
        email: email,
        loginMethod: "mock_oauth",
        lastSignedIn: new Date(),
      });

      // モック認証コードを生成
      const authCode = `mock_code_${Date.now()}`;
      mockUsers.set(authCode, { openId, username, email });

      // 本物のOAuthコールバックURLにリダイレクト
      const callbackUrl = new URL(redirectUri as string);
      callbackUrl.searchParams.set("code", authCode);
      callbackUrl.searchParams.set("state", state as string);
      
      res.redirect(302, callbackUrl.toString());
    } catch (error) {
      console.error("[MockOAuth] Error:", error);
      res.status(500).send("認証処理に失敗しました");
    }
  });

  // モックトークン交換エンドポイント
  app.post("/mock-oauth/token", (req: Request, res: Response) => {
    const { code, grantType, clientId, redirectUri } = req.body;
    
    if (grantType !== "authorization_code") {
      res.status(400).json({ error: "invalid_grant" });
      return;
    }

    const userData = mockUsers.get(code);
    if (!userData) {
      res.status(400).json({ error: "invalid_grant" });
      return;
    }

    // モックアクセストークンを生成
    const accessToken = `mock_token_${Date.now()}`;
    
    res.json({
      accessToken,
      tokenType: "Bearer",
      expiresIn: 3600,
    });

    // 使用済みコードは削除
    mockUsers.delete(code);
  });

  // モックユーザー情報エンドポイント
  app.post("/mock-oauth/userinfo", (req: Request, res: Response) => {
    const { accessToken } = req.body;
    
    if (!accessToken || !accessToken.startsWith("mock_token_")) {
      res.status(401).json({ error: "invalid_token" });
      return;
    }

    // モックユーザー情報を返す
    res.json({
      openId: `mock_user_${Date.now()}`,
      name: "モックユーザー",
      email: "mock@example.com",
      platforms: ["REGISTERED_PLATFORM_EMAIL"],
      loginMethod: "email",
    });
  });
}
