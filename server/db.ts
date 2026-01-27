import { eq, and, like, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  horses,
  userChecks,
  userCheckItems,
  userCheckResults,
  popularityStats,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * 馬データ関連のクエリ
 */
export async function getHorsesBySale(saleId: number, filters?: {
  sireName?: string;
  breeder?: string;
  heightMin?: number;
  heightMax?: number;
  girthMin?: number;
  girthMax?: number;
  cannonMin?: number;
  cannonMax?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query: any = db.select().from(horses).where(eq(horses.saleId, saleId));

  if (filters?.sireName) {
    query = query.where(like(horses.sireName, `%${filters.sireName}%`));
  }
  if (filters?.breeder) {
    query = query.where(like(horses.breeder, `%${filters.breeder}%`));
  }
  if (filters?.heightMin) {
    query = query.where(gte(horses.height, String(filters.heightMin)));
  }
  if (filters?.heightMax) {
    query = query.where(lte(horses.height, String(filters.heightMax)));
  }
  if (filters?.girthMin) {
    query = query.where(gte(horses.girth, String(filters.girthMin)));
  }
  if (filters?.girthMax) {
    query = query.where(lte(horses.girth, String(filters.girthMax)));
  }
  if (filters?.cannonMin) {
    query = query.where(gte(horses.cannon, String(filters.cannonMin)));
  }
  if (filters?.cannonMax) {
    query = query.where(lte(horses.cannon, String(filters.cannonMax)));
  }

  return await query;
}

export async function getHorseById(horseId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(horses).where(eq(horses.id, horseId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function insertHorse(data: any) {
  const db = await getDb();
  if (!db) return;

  await db.insert(horses).values(data);
}

/**
 * ユーザー評価関連のクエリ
 */
export async function getUserCheckByUserAndHorse(userId: number, horseId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(userChecks)
    .where(and(eq(userChecks.userId, userId), eq(userChecks.horseId, horseId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserCheck(
  userId: number,
  horseId: number,
  data: {
    evaluation?: '◎' | '○' | '△' | null;
    memo?: string;
    isEliminated?: boolean;
    totalScore?: number;
  }
) {
  const db = await getDb();
  if (!db) return;

  const existing = await getUserCheckByUserAndHorse(userId, horseId);

  const updateData: any = {
    updatedAt: new Date(),
  };
  if (data.evaluation !== undefined) updateData.evaluation = data.evaluation;
  if (data.memo !== undefined) updateData.memo = data.memo;
  if (data.isEliminated !== undefined) updateData.isEliminated = data.isEliminated;
  if (data.totalScore !== undefined) updateData.totalScore = data.totalScore;

  if (existing) {
    await db
      .update(userChecks)
      .set(updateData)
      .where(
        and(eq(userChecks.userId, userId), eq(userChecks.horseId, horseId))
      );
  } else {
    await db.insert(userChecks).values({
      userId,
      horseId,
      evaluation: data.evaluation ?? null,
      memo: data.memo ?? null,
      isEliminated: data.isEliminated ?? false,
      totalScore: data.totalScore ?? 0,
    });
  }
}

/**
 * チェックリスト関連のクエリ
 */
export async function getUserCheckItems(userId: number, saleId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(userCheckItems)
    .where(and(eq(userCheckItems.userId, userId), eq(userCheckItems.saleId, saleId)));
}

export async function createUserCheckItem(
  userId: number,
  saleId: number,
  data: {
    itemName: string;
    itemType: 'boolean' | 'numeric';
    score: number;
    criteria?: any;
  }
) {
  const db = await getDb();
  if (!db) return;

  await db.insert(userCheckItems).values({
    userId,
    saleId,
    ...data,
  });
}

/**
 * 統計関連のクエリ
 */
export async function getPopularityStats(horseId: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db
      .select()
      .from(popularityStats)
      .where(eq(popularityStats.horseId, horseId))
      .limit(1);

    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    // popularityStats テーブルが存在しない場合はエラーを無視
    console.warn('getPopularityStats error:', error);
    return undefined;
  }
}

export async function updatePopularityStats(horseId: number) {
  const db = await getDb();
  if (!db) return;

  const counts = await db
    .select({
      evaluation: userChecks.evaluation,
      count: sql<number>`COUNT(*) as count`,
    })
    .from(userChecks)
    .where(eq(userChecks.horseId, horseId))
    .groupBy(userChecks.evaluation);

  const stats = {
    countExcellent: 0,
    countGood: 0,
    countFair: 0,
  };

  counts.forEach((c) => {
    if (c.evaluation === '◎') stats.countExcellent = c.count;
    if (c.evaluation === '○') stats.countGood = c.count;
    if (c.evaluation === '△') stats.countFair = c.count;
  });

  const existing = await getPopularityStats(horseId);

  if (existing) {
    await db
      .update(popularityStats)
      .set({
        ...stats,
        lastUpdated: new Date(),
      })
      .where(eq(popularityStats.horseId, horseId));
  } else {
    await db.insert(popularityStats).values({
      horseId,
      ...stats,
    });
  }
}

/**
 * チェック結果関連のクエリ
 */
export async function getUserCheckResults(userCheckId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(userCheckResults)
    .where(eq(userCheckResults.userCheckId, userCheckId));
}

export async function upsertUserCheckResult(
  userCheckId: number,
  checkItemId: number,
  isChecked: boolean,
  scoreApplied: number
) {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(userCheckResults)
    .where(
      and(
        eq(userCheckResults.userCheckId, userCheckId),
        eq(userCheckResults.checkItemId, checkItemId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userCheckResults)
      .set({
        isChecked,
        scoreApplied,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userCheckResults.userCheckId, userCheckId),
          eq(userCheckResults.checkItemId, checkItemId)
        )
      );
  } else {
    await db.insert(userCheckResults).values({
      userCheckId,
      checkItemId,
      isChecked,
      scoreApplied,
    });
  }
}

/**
 * チェックリスト項目の削除
 */
export async function deleteUserCheckItem(itemId: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(userCheckItems).where(eq(userCheckItems.id, itemId));
}

/**
 * チェックリスト項目の更新
 */
export async function updateUserCheckItem(
  itemId: number,
  data: {
    itemName?: string;
    score?: number;
    criteria?: any;
  }
) {
  const db = await getDb();
  if (!db) return;

  const updateData: any = {
    updatedAt: new Date(),
  };
  if (data.itemName !== undefined) updateData.itemName = data.itemName;
  if (data.score !== undefined) updateData.score = data.score;
  if (data.criteria !== undefined) updateData.criteria = data.criteria;

  await db.update(userCheckItems).set(updateData).where(eq(userCheckItems.id, itemId));
}

// TODO: add feature queries here as your schema grows.
