import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
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

// Horse data queries
export async function saveSale(sale: { saleCode: string; saleName: string; saleDate: Date; catalogUrl?: string }) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { sales } = await import("../drizzle/schema");
  const result = await db.insert(sales).values({
    saleCode: sale.saleCode,
    saleName: sale.saleName,
    saleDate: sale.saleDate,
    catalogUrl: sale.catalogUrl,
  }).onDuplicateKeyUpdate({
    set: {
      saleName: sale.saleName,
      saleDate: sale.saleDate,
      catalogUrl: sale.catalogUrl,
    },
  });

  return result;
}

export async function saveHorses(horses: any[]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { horses: horsesTable } = await import("../drizzle/schema");
  
  if (horses.length === 0) return;

  // Insert horses in batches
  const batchSize = 100;
  for (let i = 0; i < horses.length; i += batchSize) {
    const batch = horses.slice(i, i + batchSize);
    await db.insert(horsesTable).values(batch).onDuplicateKeyUpdate({
      set: {
        horseName: batch[0].horseName,
        sex: batch[0].sex,
        color: batch[0].color,
        birthDate: batch[0].birthDate,
        sireName: batch[0].sireName,
        damName: batch[0].damName,
        consignor: batch[0].consignor,
        breeder: batch[0].breeder,
        height: batch[0].height,
        girth: batch[0].girth,
        cannon: batch[0].cannon,
        priceEstimate: batch[0].priceEstimate,
      },
    });
  }
}

export async function getHorsesBySale(saleId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const { horses: horsesTable } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  return db.select().from(horsesTable).where(eq(horsesTable.saleId, saleId));
}

// TODO: add feature queries here as your schema grows.
