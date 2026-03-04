import { ForbiddenError } from "../../shared/_core/errors";
import type { TrpcContext } from "./context";

/**
 * 管理者権限を要求するミドルウェア
 * @param ctx tRPCコンテキスト
 * @throws ForbiddenError 管理者権限がない場合
 */
export const requireAdmin = (ctx: TrpcContext) => {
  if (!ctx.user) {
    console.warn(`[SECURITY] 未認証ユーザーによる管理者ページアクセス試行`);
    throw new ForbiddenError("認証が必要です");
  }

  if (ctx.user.role !== 'admin') {
    console.warn(`[SECURITY] 管理者ページへの不正アクセス試行: ${ctx.user.email} (role: ${ctx.user.role})`);
    throw new ForbiddenError("管理者権限が必要です");
  }

  console.log(`[SECURITY] 管理者アクセス確認: ${ctx.user.email}`);
};

/**
 * 管理者権限をチェック（例外を投げないバージョン）
 * @param ctx tRPCコンテキスト
 * @returns 管理者権限があるかどうか
 */
export const checkAdmin = (ctx: TrpcContext): boolean => {
  return ctx.user?.role === 'admin';
};
