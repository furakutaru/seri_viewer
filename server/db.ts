import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, horses, userChecks, sales, userCheckItems, userCheckResults, pedigreeUrls } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
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

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
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

export async function getAllSales() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get sales: database not available");
    return [];
  }

  try {
    const result = await db.select().from(sales).orderBy(sales.saleDate);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get sales:", error);
    return [];
  }
}

export async function getAllHorsesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Get all horses with sales info
    const allHorses = await db
      .select({
        horse: horses,
        sale: sales,
      })
      .from(horses)
      .leftJoin(sales, eq(horses.saleId, sales.id));

    // Get only current user's checks - much more efficient!
    const myChecks = await db
      .select()
      .from(userChecks)
      .where(eq(userChecks.userId, userId));

    // Get all checks for stats calculation (but only what we need)
    const allChecksForStats = await db
      .select({
        horseId: userChecks.horseId,
        evaluation: userChecks.evaluation,
        isEliminated: userChecks.isEliminated,
      })
      .from(userChecks);

    return allHorses.map(({ horse, sale }) => {
      // Find current user's check
      const myCheck = myChecks.find(c => c.horseId === horse.id);

      // Calculate global stats using only the data we need
      const horseChecks = allChecksForStats.filter(c => c.horseId === horse.id);
      const validChecks = horseChecks.filter(c => !c.isEliminated);
      const countExcellent = validChecks.filter(c => c.evaluation === '◎').length;
      const countGood = validChecks.filter(c => c.evaluation === '○').length;
      const countFair = validChecks.filter(c => c.evaluation === '△').length;
      const total = validChecks.length;
      const score = countExcellent * 3 + countGood * 2 + countFair * 1;

      return {
        ...horse,
        sale,
        stats: {
          countExcellent,
          countGood,
          countFair,
          total,
          score
        },
        userCheck: myCheck ? {
          evaluation: myCheck.evaluation,
          memo: myCheck.memo,
          isEliminated: myCheck.isEliminated,
          totalScore: myCheck.totalScore
        } : null
      };
    });
  } catch (error) {
    console.error("[Database] Failed to get horses for user:", error);
    return [];
  }
}

export async function getHorseById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get horse: database not available");
    return null;
  }

  try {
    const result = await db
      .select({
        horse: horses,
        sale: sales,
      })
      .from(horses)
      .leftJoin(sales, eq(horses.saleId, sales.id))
      .where(eq(horses.id, id))
      .limit(1);

    if (result.length === 0) return null;

    return {
      ...result[0].horse,
      sale: result[0].sale,
    };
  } catch (error) {
    console.error("[Database] Failed to get horse:", error);
    return null;
  }
}

export async function getUserCheck(userId: number, horseId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user check: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(userChecks)
      .where(and(eq(userChecks.userId, userId), eq(userChecks.horseId, horseId)))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get user check:", error);
    return null;
  }
}

export async function saveUserCheck(
  userId: number,
  horseId: number,
  evaluation: '◎' | '○' | '△' | null,
  memo: string,
  isEliminated: boolean
): Promise<{
  id: number;
  userId: number;
  horseId: number;
  evaluation: "◎" | "○" | "△" | null;
  memo: string | null;
  isEliminated: boolean;
  totalScore: number;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save user check: database not available");
    return null;
  }

  try {
    const existing = await getUserCheck(userId, horseId);

    if (existing) {
      // Update existing
      const result = await db
        .update(userChecks)
        .set({
          evaluation,
          memo,
          isEliminated,
          updatedAt: new Date(),
        })
        .where(
          and(eq(userChecks.userId, userId), eq(userChecks.horseId, horseId))
        )
        .returning();
      return result[0];
    } else {
      // Insert new
      const result = await db.insert(userChecks).values({
        userId,
        horseId,
        evaluation,
        memo,
        isEliminated,
      }).returning();

      return result[0];
    }
  } catch (error) {
    console.error("[Database] Failed to save user check:", error);
    throw error;
  }
}

export async function bulkSaveUserCheck(
  userId: number,
  horseIds: number[],
  evaluation: '◎' | '○' | '△' | null,
  isEliminated: boolean
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const results = [];
    for (const horseId of horseIds) {
      const existing = await getUserCheck(userId, horseId);
      if (existing) {
        const updateResult = await db
          .update(userChecks)
          .set({
            evaluation,
            isEliminated,
            updatedAt: new Date(),
          })
          .where(and(eq(userChecks.userId, userId), eq(userChecks.horseId, horseId)))
          .returning();
        results.push(updateResult[0]);
      } else {
        const insertResult = await db.insert(userChecks).values({
          userId,
          horseId,
          evaluation,
          isEliminated,
          memo: "",
        }).returning();
        results.push(insertResult[0]);
      }
    }
    return results;
  } catch (error) {
    console.error("[Database] Failed to bulk save user check:", error);
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

    const validChecks = result.filter((r) => !r.isEliminated);
    const countExcellent = validChecks.filter((r) => r.evaluation === '◎').length;
    const countGood = validChecks.filter((r) => r.evaluation === '○').length;
    const countFair = validChecks.filter((r) => r.evaluation === '△').length;
    const total = validChecks.length;

    // Calculate score: ◎=3, ○=2, △=1
    const score = countExcellent * 3 + countGood * 2 + countFair * 1;

    return { countExcellent, countGood, countFair, total, score };
  } catch (error) {
    console.error("[Database] Failed to get popularity stats:", error);
    return { countExcellent: 0, countGood: 0, countFair: 0, total: 0, score: 0 };
  }
}

export async function getUniqueSires() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({ sireName: horses.sireName })
      .from(horses)
      .groupBy(horses.sireName)
      .orderBy(horses.sireName);

    return result.map(r => r.sireName).filter(Boolean) as string[];
  } catch (error) {
    console.error("[Database] Failed to get unique sires:", error);
    return [];
  }
}

// TODO: add feature queries here as your schema grows.

// User Check Items functions
export async function getUserCheckItems(userId: number, saleId?: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    let result;
    if (saleId) {
      result = await db
        .select()
        .from(userCheckItems)
        .where(and(eq(userCheckItems.userId, userId), eq(userCheckItems.saleId, saleId)))
        .orderBy(userCheckItems.createdAt);
    } else {
      result = await db
        .select()
        .from(userCheckItems)
        .where(eq(userCheckItems.userId, userId))
        .orderBy(userCheckItems.createdAt);
    }

    return result;
  } catch (error) {
    console.error("[Database] Failed to get user check items:", error);
    return [];
  }
}

export async function createUserCheckItem(
  userId: number,
  saleId: number | undefined,
  itemName: string,
  itemType: "boolean" | "numeric",
  score: number,
  criteria?: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(userCheckItems).values({
      userId,
      saleId: saleId || null,
      itemName,
      itemType,
      score,
      criteria: criteria || null,
    }).returning();

    return result[0];
  } catch (error) {
    console.error("[Database] Failed to create user check item:", error);
    throw error;
  }
}

export async function updateUserCheckItem(
  itemId: number,
  itemName?: string,
  itemType?: "boolean" | "numeric",
  score?: number,
  criteria?: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const updateData: any = {};
    if (itemName !== undefined) updateData.itemName = itemName;
    if (itemType !== undefined) updateData.itemType = itemType;
    if (score !== undefined) updateData.score = score;
    if (criteria !== undefined) updateData.criteria = criteria;
    updateData.updatedAt = new Date();

    const result = await db
      .update(userCheckItems)
      .set(updateData)
      .where(eq(userCheckItems.id, itemId))
      .returning();

    return result[0];
  } catch (error) {
    console.error("[Database] Failed to update user check item:", error);
    throw error;
  }
}

export async function deleteUserCheckItem(itemId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // First verify the item belongs to the user
    const item = await db
      .select()
      .from(userCheckItems)
      .where(and(eq(userCheckItems.id, itemId), eq(userCheckItems.userId, userId)))
      .limit(1);

    if (item.length === 0) {
      throw new Error("Item not found or access denied");
    }

    await db.delete(userCheckItems).where(eq(userCheckItems.id, itemId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete user check item:", error);
    throw error;
  }
}

// User Check Results functions
export async function getUserCheckResults(userCheckId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        result: userCheckResults,
        item: userCheckItems,
      })
      .from(userCheckResults)
      .leftJoin(userCheckItems, eq(userCheckResults.checkItemId, userCheckItems.id))
      .where(eq(userCheckResults.userCheckId, userCheckId));

    return result;
  } catch (error) {
    console.error("[Database] Failed to get user check results:", error);
    return [];
  }
}

export async function saveUserCheckResults(
  userCheckId: number,
  results: { checkItemId: number; isChecked: boolean; scoreApplied?: number }[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Delete existing results for this userCheck
    await db.delete(userCheckResults).where(eq(userCheckResults.userCheckId, userCheckId));

    // Insert new results
    if (results.length > 0) {
      await db.insert(userCheckResults).values(
        results.map(r => ({
          userCheckId,
          checkItemId: r.checkItemId,
          isChecked: r.isChecked,
          scoreApplied: r.scoreApplied || 0,
        }))
      );
    }

    // Calculate and update totalScore
    const totalScore = results.reduce((sum, r) => sum + (r.scoreApplied || 0), 0);
    await db
      .update(userChecks)
      .set({ totalScore, updatedAt: new Date() })
      .where(eq(userChecks.id, userCheckId));

    return true;
  } catch (error) {
    console.error("[Database] Failed to save user check results:", error);
    throw error;
  }
}

// Pedigree URL functions
export async function getPedigreeUrl(horseName: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(pedigreeUrls)
      .where(eq(pedigreeUrls.horseName, horseName))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get pedigree URL:", error);
    return null;
  }
}

export async function savePedigreeUrl(horseName: string, jbisUrl?: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    // First try to get existing record
    const existing = await getPedigreeUrl(horseName);

    if (existing) {
      // Update existing record
      const result = await db
        .update(pedigreeUrls)
        .set({
          jbisUrl,
          updatedAt: new Date(),
        })
        .where(eq(pedigreeUrls.horseName, horseName))
        .returning();
      return result[0];
    } else {
      // Insert new record
      const result = await db
        .insert(pedigreeUrls)
        .values({
          horseName,
          jbisUrl,
        })
        .returning();
      return result[0];
    }
  } catch (error) {
    console.error("[Database] Failed to save pedigree URL:", error);
    return null;
  }
}

export async function getAllPedigreeUrls() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(pedigreeUrls);
  } catch (error) {
    console.error("[Database] Failed to get all pedigree URLs:", error);
    return [];
  }
}
