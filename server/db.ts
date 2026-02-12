import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, horses, userChecks } from "../drizzle/schema";
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

export async function getAllHorses() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get horses: database not available");
    return [];
  }

  try {
    const result = await db.select().from(horses);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get horses:", error);
    return [];
  }
}

export async function getHorseById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get horse: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(horses).where(eq(horses.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get horse:", error);
    return undefined;
  }
}

export async function getUserCheck(userId: number, horseId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user check: database not available");
    return undefined;
  }

  try {
    const result = await db
      .select()
      .from(userChecks)
      .where(and(eq(userChecks.userId, userId), eq(userChecks.horseId, horseId)))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get user check:", error);
    return undefined;
  }
}

export async function saveUserCheck(
  userId: number,
  horseId: number,
  evaluation: '◎' | '○' | '△' | null,
  memo: string,
  isEliminated: boolean
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save user check: database not available");
    return undefined;
  }

  try {
    const existing = await getUserCheck(userId, horseId);

    if (existing) {
      // Update existing
      await db
        .update(userChecks)
        .set({
          evaluation,
          memo,
          isEliminated,
          updatedAt: new Date(),
        })
        .where(
          and(eq(userChecks.userId, userId), eq(userChecks.horseId, horseId))
        );
      return existing;
    } else {
      // Insert new
      const result = await db.insert(userChecks).values({
        userId,
        horseId,
        evaluation,
        memo,
        isEliminated,
      });
      return { userId, horseId, evaluation, memo, isEliminated };
    }
  } catch (error) {
    console.error("[Database] Failed to save user check:", error);
    throw error;
  }
}

export async function getPopularityStats(horseId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get popularity stats: database not available");
    return { countExcellent: 0, countGood: 0, countFair: 0, total: 0, score: 0 };
  }

  try {
    const result = await db
      .select()
      .from(userChecks)
      .where(eq(userChecks.horseId, horseId));

    const countExcellent = result.filter((r) => r.evaluation === '◎').length;
    const countGood = result.filter((r) => r.evaluation === '○').length;
    const countFair = result.filter((r) => r.evaluation === '△').length;
    const total = result.length;

    // Calculate score: ◎=3, ○=2, △=1
    const score = countExcellent * 3 + countGood * 2 + countFair * 1;

    return { countExcellent, countGood, countFair, total, score };
  } catch (error) {
    console.error("[Database] Failed to get popularity stats:", error);
    return { countExcellent: 0, countGood: 0, countFair: 0, total: 0, score: 0 };
  }
}

// TODO: add feature queries here as your schema grows.
