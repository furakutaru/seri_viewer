#!/usr/bin/env node

/**
 * 管理者権限設定スクリプト（シンプル版）
 * Googleアカウントでログインしたユーザーに管理者権限を付与
 */

import { config } from 'dotenv';

// .envファイルを読み込み
config({ path: '.env' });

// 既存のデータベース関数をインポート
async function getUserByOpenId(openId) {
  try {
    const { getDb } = await import('../server/db.ts');
    const { users } = await import('../drizzle/schema.ts');
    const { eq } = await import('drizzle-orm');
    
    const db = await getDb();
    if (!db) return undefined;
    
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error('Error getting user:', error);
    return undefined;
  }
}

async function updateUserRole(openId, role) {
  try {
    const { getDb } = await import('../server/db.ts');
    const { users } = await import('../drizzle/schema.ts');
    const { eq } = await import('drizzle-orm');
    
    const db = await getDb();
    if (!db) return false;
    
    await db.update(users)
      .set({ 
        role: role,
        updatedAt: new Date()
      })
      .where(eq(users.openId, openId));
    
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
}

async function setupAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL環境変数が設定されていません');
    console.log('現在の環境変数:');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL || '未設定');
    console.log('- OWNER_OPEN_ID:', process.env.OWNER_OPEN_ID || '未設定');
    process.exit(1);
  }

  if (!process.env.OWNER_OPEN_ID) {
    console.error('❌ OWNER_OPEN_ID環境変数が設定されていません');
    console.error('GoogleアカウントのIDを.envファイルに設定してください');
    process.exit(1);
  }

  try {
    const ownerOpenId = process.env.OWNER_OPEN_ID;
    console.log(`🔍 ユーザーを検索中: ${ownerOpenId}`);

    // ユーザーを検索
    const user = await getUserByOpenId(ownerOpenId);

    if (!user) {
      console.log('❌ ユーザーが見つかりません');
      console.log('まずGoogleアカウントでログインしてください');
      console.log(`ログインURL: http://localhost:3000/login`);
      process.exit(1);
    }

    console.log(`👤 ユーザーが見つかりました: ${user.name} (${user.email})`);

    // 管理者権限を更新
    const success = await updateUserRole(ownerOpenId, 'admin');

    if (success) {
      console.log('✅ 管理者権限を設定しました！');
      console.log(`📧 ユーザー: ${user.name} (${user.email})`);
      console.log('🔐 管理者ページにアクセスできるようになりました');
      console.log(`🌐 管理者ページ: http://localhost:3000/admin/import`);
    } else {
      console.log('❌ 管理者権限の設定に失敗しました');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

setupAdmin();
