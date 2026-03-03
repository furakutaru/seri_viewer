#!/usr/bin/env node

/**
 * 管理者権限設定スクリプト（直接SQL版）
 * Googleアカウントでログインしたユーザーに管理者権限を付与
 */

import { config } from 'dotenv';
import postgres from 'postgres';

// .envファイルを読み込み
config({ path: '.env' });

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

  const sql = postgres(process.env.DATABASE_URL);

  try {
    const ownerOpenId = process.env.OWNER_OPEN_ID;
    console.log(`🔍 ユーザーを検索中: ${ownerOpenId}`);

    // まず全ユーザーを確認
    const allUsers = await sql`SELECT "openId", name, email, role FROM users`;
    console.log(`📋 現在のユーザー一覧 (${allUsers.length}人):`);
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - role: ${user.role} - openId: ${user.openId}`);
    });

    // ユーザーを検索
    const users = await sql`
      SELECT * FROM users WHERE "openId" = ${ownerOpenId}
    `;

    if (users.length === 0) {
      console.log('❌ 指定されたopenIdのユーザーが見つかりません');
      console.log(`🔍 OWNER_OPEN_ID: ${ownerOpenId}`);
      console.log('💡 ヒント: 上記のユーザー一覧から正しいopenIdを.envファイルに設定してください');
      console.log('または、既存のユーザーを管理者に設定しますか？');
      process.exit(1);
    }

    const user = users[0];
    console.log(`👤 ユーザーが見つかりました: ${user.name} (${user.email})`);

    // 管理者権限を更新
    await sql`
      UPDATE users 
      SET role = 'admin', "updatedAt" = NOW() 
      WHERE "openId" = ${ownerOpenId}
    `;

    console.log('✅ 管理者権限を設定しました！');
    console.log(`📧 ユーザー: ${user.name} (${user.email})`);
    console.log('🔐 管理者ページにアクセスできるようになりました');
    console.log(`🌐 管理者ページ: http://localhost:3000/admin/import`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 ヒント: データベースサーバーが起動しているか確認してください');
    }
    process.exit(1);
  } finally {
    await sql.end();
  }
}

setupAdmin();
