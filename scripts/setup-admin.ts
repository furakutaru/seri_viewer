#!/usr/bin/env tsx

import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// .envファイルを読み込み
config({ path: '.env' });

/**
 * 管理者権限設定スクリプト
 * Googleアカウントでログインしたユーザーに管理者権限を付与
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function setupAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL環境変数が設定されていません');
    process.exit(1);
  }

  if (!process.env.OWNER_OPEN_ID) {
    console.error('OWNER_OPEN_ID環境変数が設定されていません');
    console.error('GoogleアカウントのIDを設定してください');
    process.exit(1);
  }

  try {
    // データベース接続
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);

    const ownerOpenId = process.env.OWNER_OPEN_ID;

    console.log(`管理者権限を設定します: ${ownerOpenId}`);

    // ユーザーを検索
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, ownerOpenId))
      .limit(1);

    if (existingUser.length === 0) {
      console.log('ユーザーが見つかりません。まずGoogleアカウントでログインしてください。');
      process.exit(1);
    }

    // 管理者権限を更新
    await db
      .update(users)
      .set({ 
        role: 'admin',
        updatedAt: new Date()
      })
      .where(eq(users.openId, ownerOpenId));

    console.log('✅ 管理者権限を設定しました！');
    console.log(`ユーザー: ${existingUser[0].name} (${existingUser[0].email})`);
    console.log('管理者ページにアクセスできるようになりました。');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  setupAdmin();
}
