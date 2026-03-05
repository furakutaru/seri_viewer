var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
import { integer, pgEnum, pgTable, text, timestamp, varchar, decimal, boolean, jsonb, index } from "drizzle-orm/pg-core";
var users, sexEnum, evaluationEnum, saleStatusEnum, sales, horses, userCheckItems, userChecks, userCheckResults, popularityStats, pedigreeUrls;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: text("role").$type().default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    sexEnum = pgEnum("sex", ["\u7261", "\u725D", "\u30BB\u30F3"]);
    evaluationEnum = pgEnum("evaluation", ["\u25CE", "\u25CB", "\u25B3"]);
    saleStatusEnum = pgEnum("sale_status", ["draft", "published", "hidden"]);
    sales = pgTable("sales", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      saleCode: varchar("saleCode", { length: 32 }).notNull().unique(),
      saleName: varchar("saleName", { length: 256 }).notNull(),
      saleDate: timestamp("saleDate").notNull(),
      catalogUrl: varchar("catalogUrl", { length: 512 }),
      status: saleStatusEnum("status").default("draft").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    horses = pgTable("horses", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      saleId: integer("saleId").notNull(),
      lotNumber: integer("lotNumber").notNull(),
      sex: sexEnum("sex"),
      color: varchar("color", { length: 64 }),
      birthDate: timestamp("birthDate"),
      sireName: varchar("sireName", { length: 256 }),
      damName: varchar("damName", { length: 256 }),
      consignor: varchar("consignor", { length: 256 }),
      breeder: varchar("breeder", { length: 256 }),
      height: decimal("height", { precision: 5, scale: 2 }),
      girth: decimal("girth", { precision: 5, scale: 2 }),
      cannon: decimal("cannon", { precision: 5, scale: 2 }),
      priceEstimate: integer("priceEstimate"),
      photoUrl: varchar("photoUrl", { length: 512 }),
      imageUrls: varchar("imageUrls", { length: 512 }).array(),
      videoUrl: varchar("videoUrl", { length: 512 }),
      pedigreePdfUrl: varchar("pedigreePdfUrl", { length: 512 }),
      jbisUrl: varchar("jbisUrl", { length: 512 }),
      sireUrl: varchar("sireUrl", { length: 512 }),
      damUrl: varchar("damUrl", { length: 512 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    userCheckItems = pgTable("userCheckItems", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      userId: integer("userId").notNull(),
      saleId: integer("saleId"),
      itemName: varchar("itemName", { length: 256 }).notNull(),
      itemType: text("itemType").$type().notNull(),
      score: integer("score").notNull(),
      criteria: jsonb("criteria"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    }, (table) => ({
      userIdIdx: index("userCheckItems_userId_idx").on(table.userId),
      userIdSaleIdIdx: index("userCheckItems_userId_saleId_idx").on(table.userId, table.saleId)
    }));
    userChecks = pgTable("userChecks", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      userId: integer("userId").notNull(),
      horseId: integer("horseId").notNull(),
      evaluation: evaluationEnum("evaluation"),
      memo: text("memo"),
      isEliminated: boolean("isEliminated").default(false).notNull(),
      totalScore: integer("totalScore").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    }, (table) => ({
      userIdIdx: index("userChecks_userId_idx").on(table.userId),
      horseIdIdx: index("userChecks_horseId_idx").on(table.horseId),
      userIdHorseIdIdx: index("userChecks_userId_horseId_idx").on(table.userId, table.horseId)
    }));
    userCheckResults = pgTable("userCheckResults", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      userCheckId: integer("userCheckId").notNull(),
      checkItemId: integer("checkItemId").notNull(),
      isChecked: boolean("isChecked").notNull(),
      scoreApplied: integer("scoreApplied").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    popularityStats = pgTable("popularityStats", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      horseId: integer("horseId").notNull(),
      countExcellent: integer("countExcellent").default(0).notNull(),
      countGood: integer("countGood").default(0).notNull(),
      countFair: integer("countFair").default(0).notNull(),
      lastUpdated: timestamp("lastUpdated").defaultNow().notNull()
    });
    pedigreeUrls = pgTable("pedigreeUrls", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      horseName: varchar("horseName", { length: 256 }).notNull(),
      jbisUrl: varchar("jbisUrl", { length: 512 }),
      lastVerified: timestamp("lastVerified").defaultNow().notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
  }
});

// server/_core/env.ts
var env_exports = {};
__export(env_exports, {
  ENV: () => ENV
});
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET || process.env.COOKIE_SECRET || "default-dev-secret-keep-it-safe",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL || "https://accounts.google.com",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      googleSearchApiKey: process.env.GOOGLE_SEARCH_API_KEY ?? "",
      googleSearchCx: process.env.GOOGLE_SEARCH_CX ?? "",
      bingSearchApiKey: process.env.BING_SEARCH_API_KEY ?? "",
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  bulkSaveUserCheck: () => bulkSaveUserCheck,
  createSale: () => createSale,
  createUserCheckItem: () => createUserCheckItem,
  deleteSale: () => deleteSale,
  deleteUserCheckItem: () => deleteUserCheckItem,
  getAllHorses: () => getAllHorses,
  getAllHorsesForUser: () => getAllHorsesForUser,
  getAllPedigreeUrls: () => getAllPedigreeUrls,
  getAllSales: () => getAllSales,
  getDb: () => getDb,
  getHorseById: () => getHorseById,
  getPedigreeUrl: () => getPedigreeUrl,
  getPopularityStats: () => getPopularityStats,
  getUniqueSires: () => getUniqueSires,
  getUserByOpenId: () => getUserByOpenId,
  getUserCheck: () => getUserCheck,
  getUserCheckItems: () => getUserCheckItems,
  getUserCheckResults: () => getUserCheckResults,
  savePedigreeUrl: () => savePedigreeUrl,
  saveUserCheck: () => saveUserCheck,
  saveUserCheckResults: () => saveUserCheckResults,
  updateSale: () => updateSale,
  updateSaleStatus: () => updateSaleStatus,
  updateUserCheckItem: () => updateUserCheckItem,
  upsertUser: () => upsertUser
});
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllHorses(role) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get horses: database not available");
    return [];
  }
  try {
    let query = db.select({ horse: horses }).from(horses).innerJoin(sales, eq(horses.saleId, sales.id));
    if (role !== "admin") {
      query = query.where(eq(sales.status, "published"));
    }
    const result = await query;
    return result.map((r) => r.horse);
  } catch (error) {
    console.error("[Database] Failed to get horses:", error);
    return [];
  }
}
async function getAllSales(role) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get sales: database not available");
    return [];
  }
  try {
    let query = db.select().from(sales);
    if (role !== "admin") {
      query = query.where(eq(sales.status, "published"));
    }
    const result = await query.orderBy(sales.saleDate);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get sales:", error);
    return [];
  }
}
async function createSale(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(sales).values({
      ...data,
      status: data.status || "draft"
    }).returning();
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to create sale:", error);
    throw error;
  }
}
async function updateSale(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.update(sales).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(sales.id, id)).returning();
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to update sale:", error);
    throw error;
  }
}
async function updateSaleStatus(id, status) {
  return await updateSale(id, { status });
}
async function deleteSale(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(horses).where(eq(horses.saleId, id));
    await db.delete(sales).where(eq(sales.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete sale:", error);
    throw error;
  }
}
async function getAllHorsesForUser(userId, role) {
  const db = await getDb();
  if (!db) return [];
  try {
    let baseQuery = db.select({
      horse: horses,
      sale: sales
    }).from(horses).innerJoin(sales, eq(horses.saleId, sales.id));
    if (role !== "admin") {
      baseQuery = baseQuery.where(eq(sales.status, "published"));
    }
    const allHorses = await baseQuery;
    const myChecks = await db.select().from(userChecks).where(eq(userChecks.userId, userId));
    const allChecksForStats = await db.select({
      horseId: userChecks.horseId,
      evaluation: userChecks.evaluation,
      isEliminated: userChecks.isEliminated
    }).from(userChecks);
    return allHorses.map(({ horse, sale }) => {
      const myCheck = myChecks.find((c) => c.horseId === horse.id);
      const horseChecks = allChecksForStats.filter((c) => c.horseId === horse.id);
      const validChecks = horseChecks.filter((c) => !c.isEliminated);
      const countExcellent = validChecks.filter((c) => c.evaluation === "\u25CE").length;
      const countGood = validChecks.filter((c) => c.evaluation === "\u25CB").length;
      const countFair = validChecks.filter((c) => c.evaluation === "\u25B3").length;
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
async function getHorseById(id) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get horse: database not available");
    return null;
  }
  try {
    const result = await db.select({
      horse: horses,
      sale: sales
    }).from(horses).leftJoin(sales, eq(horses.saleId, sales.id)).where(eq(horses.id, id)).limit(1);
    if (result.length === 0) return null;
    return {
      ...result[0].horse,
      sale: result[0].sale
    };
  } catch (error) {
    console.error("[Database] Failed to get horse:", error);
    return null;
  }
}
async function getUserCheck(userId, horseId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user check: database not available");
    return null;
  }
  try {
    const result = await db.select().from(userChecks).where(and(eq(userChecks.userId, userId), eq(userChecks.horseId, horseId))).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get user check:", error);
    return null;
  }
}
async function saveUserCheck(userId, horseId, evaluation, memo, isEliminated) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save user check: database not available");
    return null;
  }
  try {
    const existing = await getUserCheck(userId, horseId);
    if (existing) {
      const result = await db.update(userChecks).set({
        evaluation,
        memo,
        isEliminated,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(
        and(eq(userChecks.userId, userId), eq(userChecks.horseId, horseId))
      ).returning();
      return result[0];
    } else {
      const result = await db.insert(userChecks).values({
        userId,
        horseId,
        evaluation,
        memo,
        isEliminated
      }).returning();
      return result[0];
    }
  } catch (error) {
    console.error("[Database] Failed to save user check:", error);
    throw error;
  }
}
async function bulkSaveUserCheck(userId, horseIds, evaluation, isEliminated) {
  const db = await getDb();
  if (!db) return null;
  try {
    const results = [];
    for (const horseId of horseIds) {
      const existing = await getUserCheck(userId, horseId);
      if (existing) {
        const updateResult = await db.update(userChecks).set({
          evaluation,
          isEliminated,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and(eq(userChecks.userId, userId), eq(userChecks.horseId, horseId))).returning();
        results.push(updateResult[0]);
      } else {
        const insertResult = await db.insert(userChecks).values({
          userId,
          horseId,
          evaluation,
          isEliminated,
          memo: ""
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
async function getPopularityStats(horseId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get popularity stats: database not available");
    return { countExcellent: 0, countGood: 0, countFair: 0, total: 0, score: 0 };
  }
  try {
    const result = await db.select().from(userChecks).where(eq(userChecks.horseId, horseId));
    const validChecks = result.filter((r) => !r.isEliminated);
    const countExcellent = validChecks.filter((r) => r.evaluation === "\u25CE").length;
    const countGood = validChecks.filter((r) => r.evaluation === "\u25CB").length;
    const countFair = validChecks.filter((r) => r.evaluation === "\u25B3").length;
    const total = validChecks.length;
    const score = countExcellent * 3 + countGood * 2 + countFair * 1;
    return { countExcellent, countGood, countFair, total, score };
  } catch (error) {
    console.error("[Database] Failed to get popularity stats:", error);
    return { countExcellent: 0, countGood: 0, countFair: 0, total: 0, score: 0 };
  }
}
async function getUniqueSires() {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select({ sireName: horses.sireName }).from(horses).groupBy(horses.sireName).orderBy(horses.sireName);
    return result.map((r) => r.sireName).filter(Boolean);
  } catch (error) {
    console.error("[Database] Failed to get unique sires:", error);
    return [];
  }
}
async function getUserCheckItems(userId, saleId) {
  const db = await getDb();
  if (!db) return [];
  try {
    let result;
    if (saleId) {
      result = await db.select().from(userCheckItems).where(and(eq(userCheckItems.userId, userId), eq(userCheckItems.saleId, saleId))).orderBy(userCheckItems.createdAt);
    } else {
      result = await db.select().from(userCheckItems).where(eq(userCheckItems.userId, userId)).orderBy(userCheckItems.createdAt);
    }
    return result;
  } catch (error) {
    console.error("[Database] Failed to get user check items:", error);
    return [];
  }
}
async function createUserCheckItem(userId, saleId, itemName, itemType, score, criteria) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(userCheckItems).values({
      userId,
      saleId: saleId || null,
      itemName,
      itemType,
      score,
      criteria: criteria || null
    }).returning();
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to create user check item:", error);
    throw error;
  }
}
async function updateUserCheckItem(itemId, itemName, itemType, score, criteria) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const updateData = {};
    if (itemName !== void 0) updateData.itemName = itemName;
    if (itemType !== void 0) updateData.itemType = itemType;
    if (score !== void 0) updateData.score = score;
    if (criteria !== void 0) updateData.criteria = criteria;
    updateData.updatedAt = /* @__PURE__ */ new Date();
    const result = await db.update(userCheckItems).set(updateData).where(eq(userCheckItems.id, itemId)).returning();
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to update user check item:", error);
    throw error;
  }
}
async function deleteUserCheckItem(itemId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const item = await db.select().from(userCheckItems).where(and(eq(userCheckItems.id, itemId), eq(userCheckItems.userId, userId))).limit(1);
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
async function getUserCheckResults(userCheckId) {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select({
      result: userCheckResults,
      item: userCheckItems
    }).from(userCheckResults).leftJoin(userCheckItems, eq(userCheckResults.checkItemId, userCheckItems.id)).where(eq(userCheckResults.userCheckId, userCheckId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get user check results:", error);
    return [];
  }
}
async function saveUserCheckResults(userCheckId, results) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(userCheckResults).where(eq(userCheckResults.userCheckId, userCheckId));
    if (results.length > 0) {
      await db.insert(userCheckResults).values(
        results.map((r) => ({
          userCheckId,
          checkItemId: r.checkItemId,
          isChecked: r.isChecked,
          scoreApplied: r.scoreApplied || 0
        }))
      );
    }
    const totalScore = results.reduce((sum, r) => sum + (r.scoreApplied || 0), 0);
    await db.update(userChecks).set({ totalScore, updatedAt: /* @__PURE__ */ new Date() }).where(eq(userChecks.id, userCheckId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to save user check results:", error);
    throw error;
  }
}
async function getPedigreeUrl(horseName) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(pedigreeUrls).where(eq(pedigreeUrls.horseName, horseName)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get pedigree URL:", error);
    return null;
  }
}
async function savePedigreeUrl(horseName, jbisUrl) {
  const db = await getDb();
  if (!db) return null;
  try {
    const existing = await getPedigreeUrl(horseName);
    if (existing) {
      const result = await db.update(pedigreeUrls).set({
        jbisUrl,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(pedigreeUrls.horseName, horseName)).returning();
      return result[0];
    } else {
      const result = await db.insert(pedigreeUrls).values({
        horseName,
        jbisUrl
      }).returning();
      return result[0];
    }
  } catch (error) {
    console.error("[Database] Failed to save pedigree URL:", error);
    return null;
  }
}
async function getAllPedigreeUrls() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(pedigreeUrls);
  } catch (error) {
    console.error("[Database] Failed to get all pedigree URLs:", error);
    return [];
  }
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
  }
});

// server/_core/index.ts
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function getSessionCookieOptions(req) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isSecure = isDevelopment ? false : req.secure;
  return {
    httpOnly: true,
    path: "/",
    // The frontend and backend are on the identical origin, so "lax" is standard and secure.
    sameSite: "lax",
    secure: isSecure
  };
}

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var SDKServer = class {
  client;
  constructor() {
    this.client = axios.create({
      baseURL: ENV.oAuthServerUrl || "https://accounts.google.com",
      timeout: AXIOS_TIMEOUT_MS
    });
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl || "https://accounts.google.com");
  }
  decodeState(state) {
    try {
      return Buffer.from(state, "base64").toString("utf-8");
    } catch (e) {
      console.warn("[OAuth] Failed to decode state as base64, using as-is");
      return state;
    }
  }
  /**
   * Exchange OAuth authorization code for access token (Google)
   */
  async exchangeCodeForToken(code, state) {
    const redirectUri = this.decodeState(state);
    const params = new URLSearchParams({
      code,
      client_id: ENV.appId,
      client_secret: ENV.googleClientSecret || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    });
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Google OAuth] Token exchange failed:", {
        status: response.status,
        error: errorText
      });
      throw new Error(`Google token exchange failed: ${errorText}`);
    }
    return await response.json();
  }
  /**
   * Get user information using access token (Google)
   */
  async getUserInfo(accessToken) {
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google user info failed: ${errorText}`);
    }
    const userData = await response.json();
    return {
      openId: userData.id,
      name: userData.name,
      email: userData.email,
      platform: "google",
      loginMethod: "google"
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  async createSessionToken(openId, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId,
      appId: ENV.appId,
      name: options.name || ""
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) return null;
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId)) {
        console.warn("[Auth] Session validation failed: openId is missing");
        return null;
      }
      return {
        openId,
        appId: typeof appId === "string" ? appId : "",
        name: typeof name === "string" ? name : ""
      };
    } catch (error) {
      console.warn("[Auth] JWT Verify Error:", error);
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      { jwtToken, projectId: ENV.appId }
    );
    return data;
  }
  async authenticateRequest(req) {
    const cookieHeader = req.headers.cookie;
    const cookies = this.parseCookies(cookieHeader);
    const sessionCookie = cookies.get(COOKIE_NAME);
    if (process.env.NODE_ENV !== "production") {
      console.log("[Auth] Cookie header present:", !!cookieHeader);
      console.log("[Auth] Session cookie present:", !!sessionCookie);
    } else {
      console.log("[Auth] Authenticating request, cookie present:", !!sessionCookie);
    }
    if (!sessionCookie) {
      console.log("[Auth] No session cookie found. Cookie names present:", cookieHeader ? cookieHeader.split(";").map((c) => c.split("=")[0].trim()) : []);
      return null;
    }
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      console.log("[Auth] Session verification failed for cookie value (JWT invalid or expired)");
      return null;
    }
    console.log("[Auth] Session verified for openId:", session.openId);
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      console.log("[Auth] User not found in DB for openId:", sessionUserId);
      return null;
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    console.log("[Auth] Authentication successful for:", user.email);
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      console.log("[OAuth] Code received, exchanging for token...");
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const accessToken = tokenResponse.access_token || tokenResponse.accessToken;
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
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      console.log("[OAuth] Creating session token...");
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      console.log("[OAuth] Success, redirecting to home.");
      res.redirect(302, "/");
    } catch (error) {
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

// server/_core/mockOAuth.ts
init_db();
var mockUsers = /* @__PURE__ */ new Map();
function registerMockOAuthRoutes(app2) {
  app2.get("/mock-oauth", (req, res) => {
    const { appId, redirectUri, state } = req.query;
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>\u30E2\u30C3\u30AFOAuth\u30ED\u30B0\u30A4\u30F3</title>
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
        <h2>\u30E2\u30C3\u30AFOAuth\u30ED\u30B0\u30A4\u30F3</h2>
        <p>\u958B\u767A\u7528\u306E\u8A8D\u8A3C\u30DA\u30FC\u30B8\u3067\u3059</p>
        <form method="post" action="/mock-oauth/callback">
          <input type="hidden" name="appId" value="${appId}">
          <input type="hidden" name="redirectUri" value="${redirectUri}">
          <input type="hidden" name="state" value="${state}">
          
          <div class="form-group">
            <label>\u30E6\u30FC\u30B6\u30FC\u540D:</label>
            <input type="text" name="username" required placeholder="\u30C6\u30B9\u30C8\u30E6\u30FC\u30B6\u30FC\u540D">
          </div>
          
          <div class="form-group">
            <label>\u30E1\u30FC\u30EB:</label>
            <input type="email" name="email" required placeholder="test@example.com">
          </div>
          
          <button type="submit">\u30ED\u30B0\u30A4\u30F3</button>
        </form>
      </body>
      </html>
    `);
  });
  app2.post("/mock-oauth/callback", async (req, res) => {
    const { appId, redirectUri, state, username, email } = req.body;
    if (!username || !email) {
      res.status(400).send("\u30E6\u30FC\u30B6\u30FC\u540D\u3068\u30E1\u30FC\u30EB\u306F\u5FC5\u9808\u3067\u3059");
      return;
    }
    try {
      const openId = `mock_${username}_${Date.now()}`;
      await upsertUser({
        openId,
        name: username,
        email,
        loginMethod: "mock_oauth",
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const authCode = `mock_code_${Date.now()}`;
      mockUsers.set(authCode, { openId, username, email });
      const callbackUrl = new URL(redirectUri);
      callbackUrl.searchParams.set("code", authCode);
      callbackUrl.searchParams.set("state", state);
      res.redirect(302, callbackUrl.toString());
    } catch (error) {
      console.error("[MockOAuth] Error:", error);
      res.status(500).send("\u8A8D\u8A3C\u51E6\u7406\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    }
  });
  app2.post("/mock-oauth/token", (req, res) => {
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
    const accessToken = `mock_token_${Date.now()}`;
    res.json({
      accessToken,
      tokenType: "Bearer",
      expiresIn: 3600
    });
    mockUsers.delete(code);
  });
  app2.post("/mock-oauth/userinfo", (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken || !accessToken.startsWith("mock_token_")) {
      res.status(401).json({ error: "invalid_token" });
      return;
    }
    res.json({
      openId: `mock_user_${Date.now()}`,
      name: "\u30E2\u30C3\u30AF\u30E6\u30FC\u30B6\u30FC",
      email: "mock@example.com",
      platforms: ["REGISTERED_PLATFORM_EMAIL"],
      loginMethod: "email"
    });
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      console.warn(`[SECURITY] \u672A\u8A8D\u8A3C\u30E6\u30FC\u30B6\u30FC\u306B\u3088\u308B\u7BA1\u7406\u8005API\u30A2\u30AF\u30BB\u30B9\u8A66\u884C`);
      throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (ctx.user.role !== "admin") {
      console.warn(`[SECURITY] \u7BA1\u7406\u8005API\u3078\u306E\u4E0D\u6B63\u30A2\u30AF\u30BB\u30B9\u8A66\u884C: ${ctx.user.email} (role: ${ctx.user.role})`);
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    console.log(`[SECURITY] \u7BA1\u7406\u8005API\u30A2\u30AF\u30BB\u30B9\u78BA\u8A8D: ${ctx.user.email}`);
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z2 } from "zod";

// server/import-data.ts
init_schema();
init_db();
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import crypto from "crypto";
import fetch2 from "node-fetch";
import * as cheerio from "cheerio";
import iconv from "iconv-lite";
import { eq as eq2 } from "drizzle-orm";
var CACHE_DIR = path.join(process.env.VERCEL ? os.tmpdir() : process.cwd(), ".cache");
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("[Warning] Could not create CACHE_DIR", e);
}
function getCacheKey(url) {
  return crypto.createHash("md5").update(url).digest("hex");
}
async function fetchAndCacheHtml(url) {
  const cacheKey = getCacheKey(url);
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.html`);
  if (fs.existsSync(cachePath)) {
    console.log(`\u2713 Using cached HTML for ${url}`);
    return fs.readFileSync(cachePath, "utf-8");
  }
  console.log(`Downloading HTML from ${url}...`);
  const response = await fetch2(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  console.log(`Testing encoding conversions for ${url}`);
  const asUtf8 = Buffer.from(uint8Array).toString("utf-8");
  const hasVuInUtf8 = asUtf8.includes("\u30F4");
  if (hasVuInUtf8) {
    console.log(`Found \u30F4 characters in UTF-8, using UTF-8 decoding for ${url}`);
    const decodedHtml2 = asUtf8;
    fs.writeFileSync(cachePath, decodedHtml2, "utf-8");
    console.log(`\u2713 Cached HTML to ${cachePath}`);
    return decodedHtml2;
  }
  const asShiftJis = iconv.decode(Buffer.from(uint8Array), "Shift_JIS");
  const hasVuInShiftJis = asShiftJis.includes("\u30F4");
  if (hasVuInShiftJis) {
    console.log(`Found \u30F4 characters in Shift_JIS conversion, using Shift_JIS to UTF-8 for ${url}`);
    const decodedHtml2 = asShiftJis;
    fs.writeFileSync(cachePath, decodedHtml2, "utf-8");
    console.log(`\u2713 Cached HTML to ${cachePath}`);
    return decodedHtml2;
  }
  console.log(`No \u30F4 characters found, using UTF-8 fallback for ${url}`);
  const decodedHtml = asUtf8;
  fs.writeFileSync(cachePath, decodedHtml, "utf-8");
  console.log(`\u2713 Cached HTML to ${cachePath}`);
  return decodedHtml;
}
async function fetchAndCachePdf(url) {
  const cacheKey = getCacheKey(url);
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.pdf`);
  if (fs.existsSync(cachePath)) {
    console.log(`\u2713 Using cached PDF for ${url}`);
    return fs.readFileSync(cachePath);
  }
  console.log(`Downloading PDF from ${url}...`);
  const response = await fetch2(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF ${url}: ${response.statusText}`);
  }
  const buffer = await response.buffer();
  fs.writeFileSync(cachePath, buffer);
  console.log(`\u2713 Cached PDF to ${cachePath}`);
  return buffer;
}
async function parseCatalog(catalogUrl) {
  try {
    const html = await fetchAndCacheHtml(catalogUrl);
    const $ = cheerio.load(html);
    const horseList = [];
    const table = $("table").first();
    if (table.length === 0) {
      throw new Error("No table found in catalog HTML");
    }
    table.find("tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 15) return;
      const lotNumber = parseInt($(cells[0]).text().trim());
      if (isNaN(lotNumber)) return;
      let sireName = "";
      let damName = "";
      let photoLinkForName = $(row).find(`a[uma-name*="No.${lotNumber} "]`).first();
      if (photoLinkForName.length === 0) {
        photoLinkForName = $(row).find(`a[uma-name*="No.${lotNumber}\u3000"]`).first();
      }
      if (photoLinkForName.length === 0) {
        photoLinkForName = $(row).find("a[uma-name]").first();
      }
      const umaName = photoLinkForName.attr("uma-name");
      if (umaName) {
        const sireMatch = umaName.match(/父馬：([^　\s]+)/);
        const damMatch = umaName.match(/母馬：([^　\s]+)/);
        if (sireMatch) sireName = sireMatch[1];
        if (damMatch) damName = damMatch[1];
      }
      if (!sireName) sireName = cleanText($(cells[7]).text());
      if (!damName) damName = cleanText($(cells[8]).text());
      const fixDuplicate = (name) => {
        if (!name) return name;
        const parts = name.split(" ");
        if (parts.length >= 2 && parts.length % 2 === 0) {
          const mid = parts.length / 2;
          const firstHalf = parts.slice(0, mid).join(" ");
          const secondHalf = parts.slice(mid).join(" ");
          const normalize = (s) => s.replace(/ウァ/g, "\u30F4\u30A1").replace(/ウル/g, "\u30F4\u30EB").replace(/ウィ/g, "\u30F4\u30A3").replace(/ウェ/g, "\u30F4\u30A7").replace(/ウォ/g, "\u30F4\u30A9").replace(/ルウァ/g, "\u30EB\u30F4\u30A1").replace(/スワーウ/g, "\u30B9\u30EF\u30FC\u30F4");
          if (firstHalf === secondHalf || normalize(firstHalf) === normalize(secondHalf)) {
            return secondHalf;
          }
        }
        return name;
      };
      sireName = fixDuplicate(sireName);
      damName = fixDuplicate(damName);
      const rawSex = cleanText($(cells[4]).text());
      let sex = null;
      if (rawSex.includes("\u7261")) sex = "\u7261";
      else if (rawSex.includes("\u725D")) sex = "\u725D";
      else if (rawSex.includes("\u30BB")) sex = "\u30BB\u30F3";
      const photoCell = $(cells[1]);
      const photoLink = photoCell.find("a[data-lightbox]").attr("href") || photoCell.find("a").attr("href");
      const photoImg = photoCell.find("img").attr("src");
      const baseUrl = catalogUrl.replace(/\/[^\/]*$/, "/");
      let imageUrls = [];
      const dataTitle = photoCell.find("a[data-lightbox]").attr("data-title");
      if (dataTitle) {
        try {
          const title$ = cheerio.load(dataTitle);
          title$("img").each((_2, img) => {
            const imgSrc = title$(img).attr("src");
            if (imgSrc) {
              const cleanedSrc = imgSrc.split("?")[0];
              const absoluteImgSrc = cleanedSrc.startsWith("http") ? cleanedSrc : baseUrl + cleanedSrc;
              imageUrls.push(absoluteImgSrc);
            }
          });
        } catch (e) {
        }
      }
      if (imageUrls.length === 0) {
        const rawPhoto = photoImg || photoLink || "";
        const highResPhoto = rawPhoto.split("?")[0];
        if (highResPhoto) {
          const absoluteImgSrc = highResPhoto.startsWith("http") ? highResPhoto : baseUrl + highResPhoto;
          imageUrls.push(absoluteImgSrc);
        }
      }
      const photoUrl = imageUrls.length > 0 ? imageUrls[0] : "";
      const pedigreePdfUrl = ($(cells[0]).find("a").attr("href") || "").split("?")[0];
      const absolutePhotoUrl = photoUrl && !photoUrl.startsWith("http") ? baseUrl + photoUrl : photoUrl;
      const absolutePdfUrl = pedigreePdfUrl && !pedigreePdfUrl.startsWith("http") ? baseUrl + pedigreePdfUrl : pedigreePdfUrl;
      if (lotNumber <= 3) {
        console.log(`[Import Debug] Lot ${lotNumber}: photo=${absolutePhotoUrl}, pdf=${absolutePdfUrl}`);
      }
      horseList.push({
        lotNumber,
        sex,
        color: cleanText($(cells[5]).text()),
        birthDate: cleanText($(cells[6]).text()) || null,
        sireName,
        damName,
        consignor: cleanText($(cells[10]).text()),
        breeder: cleanText($(cells[11]).text()),
        priceEstimate: parseInt(cleanText($(cells[14]).text()).replace(/[^0-9]/g, "")) || null,
        photoUrl,
        imageUrls,
        // 複数画像URLを保存
        videoUrl: $(cells[2]).find("a").attr("href") || null,
        pedigreePdfUrl: absolutePdfUrl
      });
    });
    return horseList;
  } catch (error) {
    console.error("Error parsing catalog:", error);
    throw error;
  }
}
function cleanText(text2) {
  return text2.trim().replace(/\s+/g, " ");
}
async function parsePdfMeasurements(pdfUrl) {
  try {
    const buffer = await fetchAndCachePdf(pdfUrl);
    const tmpDir = os.tmpdir();
    const pdfPath = path.join(tmpDir, `temp_${Date.now()}.pdf`);
    const txtPath = path.join(tmpDir, `temp_${Date.now()}.txt`);
    if (buffer) {
      fs.writeFileSync(pdfPath, buffer instanceof Buffer ? buffer : Buffer.from(buffer));
    } else {
      throw new Error("Failed to fetch PDF");
    }
    try {
      execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`, { encoding: "utf-8" });
    } catch (err) {
      console.warn("pdftotext command failed");
      throw new Error("PDF conversion failed");
    }
    const text2 = fs.readFileSync(txtPath, "utf-8");
    const measurements = parseMeasurementText(text2);
    try {
      fs.unlinkSync(pdfPath);
      fs.unlinkSync(txtPath);
    } catch (e) {
    }
    console.log(`Successfully extracted ${measurements.length} measurements`);
    return measurements;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw error;
  }
}
function parseMeasurementText(text2) {
  const measurements = [];
  const lines = text2.split("\n");
  const pattern = /^\s*(\d+)\s+(欠場|\d+\s+\d+\s+[\d.]+)/;
  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      const lotNumber = parseInt(match[1]);
      if (match[2] === "\u6B20\u5834") {
        measurements.push({
          lotNumber,
          height: null,
          girth: null,
          cannon: null,
          status: "\u6B20\u5834"
        });
      } else {
        const values = match[2].trim().split(/\s+/);
        if (values.length >= 3) {
          measurements.push({
            lotNumber,
            height: parseFloat(values[0]),
            girth: parseFloat(values[1]),
            cannon: parseFloat(values[2]),
            status: null
          });
        }
      }
    }
  }
  return measurements;
}
async function importCatalogAndMeasurements(saleId, catalogUrl, pdfUrls) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }
    console.log(`
[Step 0] Syncing catalog URL and cleaning up existing data for saleId: ${saleId}...`);
    await db.update(sales).set({ catalogUrl, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(sales.id, saleId));
    await db.delete(horses).where(eq2(horses.saleId, saleId));
    console.log("\n[Step 1] Parsing web catalog...");
    const catalogData = await parseCatalog(catalogUrl);
    console.log(`\u2713 Extracted ${catalogData.length} horses from catalog`);
    console.log("\n[Step 2] Parsing PDF measurements...");
    const measurementsMap = /* @__PURE__ */ new Map();
    for (const pdfUrl of pdfUrls) {
      const measurements = await parsePdfMeasurements(pdfUrl);
      console.log(`\u2713 Extracted ${measurements.length} measurements from PDF`);
      for (const m of measurements) {
        measurementsMap.set(m.lotNumber, m);
      }
    }
    console.log(`\u2713 Total measurements: ${measurementsMap.size}`);
    console.log("\n[Step 3] Merging catalog and measurement data...");
    const mergedData = catalogData.map((horse) => {
      const measurements = measurementsMap.get(horse.lotNumber);
      let birthDate = null;
      if (horse.birthDate) {
        if (typeof horse.birthDate === "string") {
          const dateMatch = horse.birthDate.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
          if (dateMatch) {
            const [, year, month, day] = dateMatch;
            birthDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
          } else {
            const date = new Date(horse.birthDate);
            if (!isNaN(date.getTime())) {
              birthDate = date;
            }
          }
        } else if (horse.birthDate instanceof Date) {
          birthDate = horse.birthDate;
        }
      }
      return {
        saleId,
        lotNumber: horse.lotNumber,
        sex: horse.sex,
        color: horse.color,
        birthDate: birthDate || null,
        sireName: horse.sireName,
        damName: horse.damName,
        consignor: horse.consignor,
        breeder: horse.breeder,
        height: measurements?.height ? parseFloat(measurements.height.toString()) : null,
        girth: measurements?.girth ? parseFloat(measurements.girth.toString()) : null,
        cannon: measurements?.cannon ? parseFloat(measurements.cannon.toString()) : null,
        priceEstimate: horse.priceEstimate,
        photoUrl: horse.photoUrl,
        imageUrls: horse.imageUrls,
        videoUrl: horse.videoUrl === "javascript:void(0);" ? null : horse.videoUrl,
        pedigreePdfUrl: horse.pedigreePdfUrl,
        jbisUrl: null
        // Explicitly set to null
      };
    });
    console.log(`\u2713 Merged data for ${mergedData.length} horses`);
    console.log("\n[Step 4] Saving to database...");
    if (!db) {
      throw new Error("Database connection not available");
    }
    let insertedCount = 0;
    const batchSize = 100;
    for (let i = 0; i < mergedData.length; i += batchSize) {
      const batch = mergedData.slice(i, i + batchSize);
      const cleanedBatch = batch.map((horse) => ({
        saleId: horse.saleId,
        lotNumber: horse.lotNumber,
        sex: horse.sex,
        color: horse.color,
        birthDate: horse.birthDate,
        sireName: horse.sireName,
        damName: horse.damName,
        consignor: horse.consignor,
        breeder: horse.breeder,
        height: horse.height,
        girth: horse.girth,
        cannon: horse.cannon,
        priceEstimate: horse.priceEstimate,
        photoUrl: horse.photoUrl,
        imageUrls: horse.imageUrls,
        videoUrl: horse.videoUrl,
        pedigreePdfUrl: horse.pedigreePdfUrl,
        jbisUrl: null
        // Explicitly set to null for catalog import
      }));
      try {
        await db.insert(horses).values(cleanedBatch);
        insertedCount += cleanedBatch.length;
        console.log(`\u2713 Inserted batch ${Math.floor(i / batchSize) + 1} (${insertedCount}/${mergedData.length})`);
      } catch (err) {
        console.error(`Failed to insert batch starting at ${i}:`, {
          error: err.message,
          code: err.code,
          detail: err.detail
        });
        for (const horse of cleanedBatch) {
          try {
            await db.insert(horses).values(horse);
            insertedCount++;
          } catch (individualErr) {
            console.error(`Failed to insert horse ${horse.lotNumber}:`, {
              error: individualErr.message,
              detail: individualErr.detail,
              sex: horse.sex,
              birthDate: horse.birthDate
            });
          }
        }
      }
    }
    console.log(`\u2713 Inserted ${insertedCount} horses into database`);
    return {
      success: insertedCount > 0,
      catalogCount: catalogData.length,
      measurementCount: measurementsMap.size,
      insertedCount,
      message: insertedCount > 0 ? `Successfully imported ${insertedCount} horses` : `Warning: No horses were inserted. Check logs for details.`
    };
  } catch (error) {
    console.error("Error importing data:", error);
    throw error;
  }
}

// server/routers.ts
init_db();
init_schema();
import { eq as eq4, and as and2 } from "drizzle-orm";

// server/_core/googleSearch.ts
init_env();
var GoogleSearchService = class {
  apiKey;
  cx;
  constructor() {
    this.apiKey = ENV.googleSearchApiKey;
    this.cx = ENV.googleSearchCx;
  }
  async searchJbisUrl(horseName) {
    console.log(`[GoogleSearch] apiKey: "${this.apiKey}", cx: "${this.cx}"`);
    if (!this.apiKey || !this.cx) {
      console.warn("[GoogleSearch] API key or CX not configured - skipping search");
      return null;
    }
    const queries = [
      `"${horseName}" site:jbis.or.jp/horse/`,
      `${horseName} site:jbis.or.jp/horse/`,
      `${horseName} JBIS \u7AF6\u8D70\u99AC`,
      `${horseName} \u8840\u7D71`
    ];
    for (const query of queries) {
      try {
        console.log(`[GoogleSearch] Trying query: ${query}`);
        const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.cx}&q=${encodeURIComponent(query)}&num=10`;
        const response = await fetch(url);
        console.log(`[GoogleSearch] Response status: ${response.status}`);
        if (response.status === 403) {
          const errorText = await response.text();
          console.warn(`[GoogleSearch] API access denied: ${response.status} ${response.statusText} - ${errorText}`);
          return null;
        }
        if (response.status === 400 || response.status === 401) {
          console.warn("[GoogleSearch] API key invalid or expired - skipping search");
          return null;
        }
        if (!response.ok) {
          console.warn(`[GoogleSearch] API error: ${response.status} - ${response.statusText}`);
          continue;
        }
        const data = await response.json();
        console.log(`[GoogleSearch] Found ${data.items?.length || 0} results`);
        if (!data.items || data.items.length === 0) {
          console.log(`[GoogleSearch] No results for query: ${query}`);
          continue;
        }
        const jbisResult = data.items.find((item) => {
          const link = item.link.toLowerCase();
          return link.includes("jbis.or.jp") && (link.includes("/horse/") || link.includes("horse")) && !link.includes("list") && !link.includes("search") && !link.includes("news") && !link.includes("pdf");
        });
        if (jbisResult) {
          console.log(`[GoogleSearch] Found JBIS URL for ${horseName}: ${jbisResult.link}`);
          return jbisResult.link;
        }
        console.log(`[GoogleSearch] No JBIS URL found in results for query: ${query}`);
      } catch (error) {
        console.warn(`[GoogleSearch] Error with query "${query}":`, error);
        continue;
      }
    }
    console.log(`[GoogleSearch] No JBIS URL found for ${horseName} with any query`);
    return null;
  }
};
var googleSearchService = new GoogleSearchService();

// server/_core/jbisScraper.ts
import fs2 from "fs";
import path2 from "path";
import os2 from "os";
var JbisScraperService = class {
  cacheDir;
  cacheExpiry = 24 * 60 * 60 * 1e3;
  // 24時間
  constructor() {
    const baseDir = process.env.VERCEL ? os2.tmpdir() : process.cwd();
    this.cacheDir = path2.join(baseDir, ".cache", "jbis");
    this.ensureCacheDir();
  }
  ensureCacheDir() {
    if (!fs2.existsSync(this.cacheDir)) {
      fs2.mkdirSync(this.cacheDir, { recursive: true });
    }
  }
  getCacheKey(url) {
    return Buffer.from(url).toString("base64").replace(/[^a-zA-Z0-9]/g, "");
  }
  getCachePath(url) {
    return path2.join(this.cacheDir, `${this.getCacheKey(url)}.json`);
  }
  loadFromCache(url) {
    try {
      const cachePath = this.getCachePath(url);
      if (!fs2.existsSync(cachePath)) {
        return null;
      }
      const cacheData = JSON.parse(fs2.readFileSync(cachePath, "utf8"));
      if (Date.now() - cacheData.timestamp > this.cacheExpiry) {
        fs2.unlinkSync(cachePath);
        return null;
      }
      console.log(`[JbisScraper] Loaded from cache: ${url}`);
      return cacheData.data;
    } catch (error) {
      console.warn("[JbisScraper] Cache load error:", error);
      return null;
    }
  }
  saveToCache(url, data) {
    try {
      const cachePath = this.getCachePath(url);
      const cacheData = {
        url,
        data,
        timestamp: Date.now()
      };
      fs2.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
      console.log(`[JbisScraper] Saved to cache: ${url}`);
    } catch (error) {
      console.warn("[JbisScraper] Cache save error:", error);
    }
  }
  async scrapeSalePage(saleUrl) {
    console.log(`[JbisScraper] Scraping: ${saleUrl}`);
    const cachedData = this.loadFromCache(saleUrl);
    if (cachedData) {
      return cachedData;
    }
    try {
      const response = await fetch(saleUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const html = await response.text();
      const horseData = this.parseHorseData(html);
      this.saveToCache(saleUrl, horseData);
      console.log(`[JbisScraper] Found ${horseData.length} horses`);
      return horseData;
    } catch (error) {
      console.error(`[JbisScraper] Error scraping ${saleUrl}:`, error);
      throw error;
    }
  }
  parseHorseData(html) {
    const horseData = [];
    const horseBlocks = html.match(/<div>\s*<div>\s*<a href="\/horse\/\d+\/"[^>]*>\d+<\/a>[\s\S]*?<\/div>\s*<\/div>/g);
    if (!horseBlocks) {
      console.log("[JbisScraper] No horse blocks found");
      return horseData;
    }
    console.log(`[JbisScraper] Found ${horseBlocks.length} horse blocks`);
    for (const block of horseBlocks) {
      const allLinks = block.match(/<a href="\/horse\/(\d+)\/"[^>]*class="txt-link">([^<]+)<\/a>/g);
      if (!allLinks || allLinks.length < 3) {
        console.log("[JbisScraper] Insufficient links in block, skipping");
        continue;
      }
      const horseMatch = allLinks[0]?.match(/<a href="\/horse\/(\d+)\/"[^>]*class="txt-link">([^<]+)<\/a>/);
      const sireMatch = allLinks[1]?.match(/<a href="\/horse\/(\d+)\/"[^>]*class="txt-link">([^<]+)<\/a>/);
      const damMatch = allLinks[2]?.match(/<a href="\/horse\/(\d+)\/"[^>]*class="txt-link">([^<]+)<\/a>/);
      if (horseMatch && sireMatch && damMatch) {
        const [, horseId, horseName] = horseMatch;
        const [, sireId, sireName] = sireMatch;
        const [, damId, damName] = damMatch;
        const cleanHorseName = horseName.replace(/\s+/g, "").trim();
        const cleanSireName = sireName.replace(/\s+/g, "").trim();
        const cleanDamName = damName.replace(/\s+/g, "").trim();
        horseData.push({
          horseName: cleanHorseName,
          horseUrl: `https://www.jbis.or.jp/horse/${horseId}/`,
          sireName: cleanSireName,
          sireUrl: `https://www.jbis.or.jp/horse/${sireId}/`,
          damName: cleanDamName,
          damUrl: `https://www.jbis.or.jp/horse/${damId}/`
        });
      }
    }
    console.log(`[JbisScraper] Processed ${horseData.length} horses`);
    if (horseData.length > 0) {
      console.log("[JbisScraper] First few matches:");
      horseData.slice(0, 3).forEach((horse, index2) => {
        console.log(`  ${index2 + 1}. ${horse.horseName} (${horse.horseUrl})`);
      });
    }
    return horseData;
  }
  // キャッシュクリア
  clearCache() {
    try {
      const files = fs2.readdirSync(this.cacheDir);
      files.forEach((file) => {
        const filePath = path2.join(this.cacheDir, file);
        fs2.unlinkSync(filePath);
      });
      console.log("[JbisScraper] Cache cleared");
    } catch (error) {
      console.warn("[JbisScraper] Cache clear error:", error);
    }
  }
  // キャッシュ情報取得
  getCacheInfo() {
    try {
      const files = fs2.readdirSync(this.cacheDir);
      let totalSize = 0;
      files.forEach((file) => {
        const filePath = path2.join(this.cacheDir, file);
        const stats = fs2.statSync(filePath);
        totalSize += stats.size;
      });
      return {
        count: files.length,
        size: totalSize
      };
    } catch (error) {
      return { count: 0, size: 0 };
    }
  }
};
var jbisScraperService = new JbisScraperService();

// server/_core/jbisHorseLinker.ts
init_db();
init_schema();
import { sql, eq as eq3 } from "drizzle-orm";
function normalizeHorseName(name) {
  if (!name) return "";
  return name.replace(/[（(][^）)]*[）)]$/g, "").replace(/\s+/g, "").trim();
}
var JbisHorseLinkerService = class {
  async linkJbisUrlsToHorses(horseData) {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    const result = {
      updated: 0,
      notFound: 0,
      sireUpdated: 0,
      damUpdated: 0,
      errors: []
    };
    try {
      for (const horse of horseData) {
        try {
          const lotNumber = parseInt(horse.horseName);
          if (isNaN(lotNumber)) {
            result.notFound++;
            console.log(`[JbisLinker] Invalid lot number: ${horse.horseName}`);
            continue;
          }
          const existingHorses = await db.select().from(horses).where(eq3(horses.lotNumber, lotNumber)).limit(10);
          if (existingHorses.length === 0) {
            result.notFound++;
            console.log(`[JbisLinker] Horse not found: ${horse.horseName}`);
            continue;
          }
          for (const existingHorse of existingHorses) {
            await db.update(horses).set({
              jbisUrl: horse.horseUrl,
              sireUrl: horse.sireUrl,
              damUrl: horse.damUrl,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq3(horses.id, existingHorse.id));
            result.updated++;
            console.log(`[JbisLinker] Updated horse: ${horse.horseName} -> ${horse.horseUrl}`);
            console.log(`[JbisLinker]   Sire: ${horse.sireName} -> ${horse.sireUrl}`);
            console.log(`[JbisLinker]   Dam: ${horse.damName} -> ${horse.damUrl}`);
          }
          if (horse.sireName && horse.sireUrl) {
            const normalizedSireName = normalizeHorseName(horse.sireName);
            const sireUpdateResult = await db.update(horses).set({ sireUrl: horse.sireUrl, updatedAt: /* @__PURE__ */ new Date() }).where(sql`REGEXP_REPLACE(REGEXP_REPLACE(${horses.sireName}, '[（(][^）)]*[）)]$', ''), '\s+', '') = ${normalizedSireName}`).returning({ id: horses.id });
            if (sireUpdateResult.length > 0) {
              result.sireUpdated += sireUpdateResult.length;
              console.log(`[JbisLinker] Updated ${sireUpdateResult.length} sires with name: ${horse.sireName} (${normalizedSireName}) -> ${horse.sireUrl}`);
            }
          }
          if (horse.damName && horse.damUrl) {
            const normalizedDamName = normalizeHorseName(horse.damName);
            const damUpdateResult = await db.update(horses).set({ damUrl: horse.damUrl, updatedAt: /* @__PURE__ */ new Date() }).where(sql`REGEXP_REPLACE(REGEXP_REPLACE(${horses.damName}, '[（(][^）)]*[）)]$', ''), '\s+', '') = ${normalizedDamName}`).returning({ id: horses.id });
            if (damUpdateResult.length > 0) {
              result.damUpdated += damUpdateResult.length;
              console.log(`[JbisLinker] Updated ${damUpdateResult.length} dams with name: ${horse.damName} (${normalizedDamName}) -> ${horse.damUrl}`);
            }
          }
        } catch (error) {
          const errorMsg = `Error processing ${horse.horseName}: ${error}`;
          console.error(`[JbisLinker] ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }
      console.log(`[JbisLinker] Completed: ${result.updated} horses updated, ${result.sireUpdated} sires updated, ${result.damUpdated} dams updated, ${result.notFound} not found, ${result.errors.length} errors`);
      return result;
    } catch (error) {
      console.error("[JbisLinker] Database error:", error);
      throw error;
    }
  }
  // 既存の馬にJBIS URLがあるかチェック
  async checkExistingJbisUrls() {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    try {
      const totalResult = await db.select({ count: sql`count(*)::int` }).from(horses);
      const withJbisUrlResult = await db.select({ count: sql`count(*)::int` }).from(horses).where(sql`${horses.jbisUrl} IS NOT NULL AND ${horses.jbisUrl} != ''`);
      const total = totalResult[0]?.count || 0;
      const withJbisUrl = withJbisUrlResult[0]?.count || 0;
      const withoutJbisUrl = total - withJbisUrl;
      return { total, withJbisUrl, withoutJbisUrl };
    } catch (error) {
      console.error("[JbisLinker] Error checking existing URLs:", error);
      throw error;
    }
  }
};
var jbisHorseLinkerService = new JbisHorseLinkerService();

// server/_core/jbisImport.ts
var JbisImportService = class {
  async importFromSaleUrl(saleUrl) {
    console.log(`[JbisImport] Starting import from: ${saleUrl}`);
    const result = {
      success: 0,
      skipped: 0,
      errors: []
    };
    try {
      const horseData = await jbisScraperService.scrapeSalePage(saleUrl);
      if (horseData.length === 0) {
        result.errors.push("No horse data found");
        return result;
      }
      const linkResult = await jbisHorseLinkerService.linkJbisUrlsToHorses(horseData);
      result.success = linkResult.updated + linkResult.sireUpdated + linkResult.damUpdated;
      result.errors.push(...linkResult.errors);
      console.log(`[JbisImport] Completed: ${result.success} URLs linked, ${result.errors.length} errors`);
      return result;
    } catch (error) {
      const errorMsg = `Failed to scrape ${saleUrl}: ${error}`;
      console.error(`[JbisImport] ${errorMsg}`);
      result.errors.push(errorMsg);
      return result;
    }
  }
  // 複数のセールURLを一括処理
  async importFromMultipleUrls(saleUrls) {
    const total = {
      success: 0,
      skipped: 0,
      errors: []
    };
    const results = [];
    for (const url of saleUrls) {
      console.log(`
[JbisImport] Processing: ${url}`);
      const result = await this.importFromSaleUrl(url);
      total.success += result.success;
      total.skipped += result.skipped;
      total.errors.push(...result.errors);
      results.push({
        url,
        ...result
      });
      if (saleUrls.indexOf(url) < saleUrls.length - 1) {
        console.log("[JbisImport] Waiting 2 seconds before next URL...");
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      }
    }
    console.log(`
[JbisImport] All completed: ${total.success} total saved, ${total.skipped} total skipped, ${total.errors.length} total errors`);
    return { total, results };
  }
};
var jbisImportService = new JbisImportService();

// server/routers.ts
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => {
      const cookieHeader = opts.ctx.req.headers.cookie;
      const cookieNames = cookieHeader ? cookieHeader.split(";").map((c) => c.split("=")[0].trim()) : [];
      console.log("[auth.me] Cookie names in request:", cookieNames);
      console.log("[auth.me] User from context:", opts.ctx.user ? opts.ctx.user.email : "null");
      return opts.ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  horses: router({
    getAll: publicProcedure.query(async ({ ctx }) => {
      return await getAllHorses(ctx.user?.role);
    }),
    getAllWithStats: protectedProcedure.query(async ({ ctx }) => {
      return await getAllHorsesForUser(ctx.user.id, ctx.user.role);
    }),
    getById: publicProcedure.input(z2.number()).query(async ({ input }) => {
      return await getHorseById(input);
    }),
    getByLotNumber: publicProcedure.input(z2.object({ lotNumber: z2.number(), saleId: z2.number().optional() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const conditions = input.saleId ? and2(eq4(horses.lotNumber, input.lotNumber), eq4(horses.saleId, input.saleId)) : eq4(horses.lotNumber, input.lotNumber);
        const result = await db.select({
          horse: horses,
          sale: sales
        }).from(horses).leftJoin(sales, eq4(horses.saleId, sales.id)).where(conditions).limit(1);
        if (result.length === 0) return null;
        return {
          ...result[0].horse,
          sale: result[0].sale
        };
      } catch (error) {
        console.error("[Database] Failed to get horse by lot number:", error);
        return null;
      }
    }),
    getUserCheck: protectedProcedure.input(z2.number()).query(async ({ input, ctx }) => {
      return await getUserCheck(ctx.user.id, input);
    }),
    saveUserCheck: protectedProcedure.input(z2.object({
      horseId: z2.number(),
      evaluation: z2.enum(["\u25CE", "\u25CB", "\u25B3"]).nullable(),
      memo: z2.string(),
      isEliminated: z2.boolean()
    })).mutation(async ({ input, ctx }) => {
      return await saveUserCheck(
        ctx.user.id,
        input.horseId,
        input.evaluation,
        input.memo,
        input.isEliminated
      );
    }),
    bulkSaveUserCheck: protectedProcedure.input(z2.object({
      horseIds: z2.array(z2.number()),
      evaluation: z2.enum(["\u25CE", "\u25CB", "\u25B3"]).nullable(),
      isEliminated: z2.boolean()
    })).mutation(async ({ input, ctx }) => {
      return await bulkSaveUserCheck(
        ctx.user.id,
        input.horseIds,
        input.evaluation,
        input.isEliminated
      );
    }),
    getSires: protectedProcedure.query(async () => {
      return await getUniqueSires();
    }),
    getPopularityStats: publicProcedure.input(z2.number()).query(async ({ input }) => {
      return await getPopularityStats(input);
    }),
    checkListItems: router({
      getAll: protectedProcedure.input(z2.object({
        saleId: z2.number().optional()
      })).query(async ({ input, ctx }) => {
        return await getUserCheckItems(ctx.user.id, input.saleId);
      }),
      create: protectedProcedure.input(z2.object({
        saleId: z2.number().optional(),
        itemName: z2.string().min(1).max(256),
        itemType: z2.enum(["boolean", "numeric"]),
        score: z2.number().min(0).max(100),
        criteria: z2.any().optional()
      })).mutation(async ({ input, ctx }) => {
        return await createUserCheckItem(
          ctx.user.id,
          input.saleId,
          input.itemName,
          input.itemType,
          input.score,
          input.criteria
        );
      }),
      update: protectedProcedure.input(z2.object({
        id: z2.number(),
        itemName: z2.string().min(1).max(256).optional(),
        itemType: z2.enum(["boolean", "numeric"]).optional(),
        score: z2.number().min(0).max(100).optional(),
        criteria: z2.any().optional()
      })).mutation(async ({ input, ctx }) => {
        return await updateUserCheckItem(
          input.id,
          input.itemName,
          input.itemType,
          input.score,
          input.criteria
        );
      }),
      delete: protectedProcedure.input(z2.number()).mutation(async ({ input, ctx }) => {
        return await deleteUserCheckItem(input, ctx.user.id);
      })
    }),
    checkListResults: router({
      getForHorse: protectedProcedure.input(z2.number()).query(async ({ input, ctx }) => {
        const userCheck = await getUserCheck(ctx.user.id, input);
        if (!userCheck) return [];
        return await getUserCheckResults(userCheck.id);
      }),
      save: protectedProcedure.input(z2.object({
        horseId: z2.number(),
        results: z2.array(z2.object({
          checkItemId: z2.number(),
          isChecked: z2.boolean(),
          scoreApplied: z2.number().optional()
        }))
      })).mutation(async ({ input, ctx }) => {
        let userCheck = await getUserCheck(ctx.user.id, input.horseId);
        if (!userCheck) {
          userCheck = await saveUserCheck(
            ctx.user.id,
            input.horseId,
            null,
            "",
            false
          );
        }
        if (!userCheck) {
          throw new Error("Failed to create or retrieve user check");
        }
        return await saveUserCheckResults(userCheck.id, input.results);
      })
    }),
    pedigreeUrls: router({
      getByName: protectedProcedure.input(z2.string()).query(async ({ input }) => {
        return await getPedigreeUrl(input);
      }),
      searchAndSave: publicProcedure.input(z2.string()).mutation(async ({ input }) => {
        console.log("[DEBUG] searchAndSave called with:", input);
        const existing = await getPedigreeUrl(input);
        if (existing && existing.jbisUrl) {
          console.log("[DEBUG] Found existing URL:", existing);
          return existing;
        }
        console.log("[DEBUG] Trying Google Search...");
        const googleUrl = await googleSearchService.searchJbisUrl(input);
        console.log("[DEBUG] Google Search result:", googleUrl);
        return await savePedigreeUrl(input, googleUrl || void 0);
      }),
      getAll: protectedProcedure.query(async () => {
        return await getAllPedigreeUrls();
      })
    })
  }),
  sales: router({
    getAll: publicProcedure.query(async ({ ctx }) => {
      return await getAllSales(ctx.user?.role);
    })
  }),
  admin: router({
    importData: publicProcedure.input(z2.object({
      saleId: z2.number(),
      catalogUrl: z2.string().url(),
      pdfUrls: z2.array(z2.string().url())
    })).mutation(async ({ input }) => {
      try {
        const result = await importCatalogAndMeasurements(
          input.saleId,
          input.catalogUrl,
          input.pdfUrls
        );
        return result;
      } catch (error) {
        throw new Error(`Import failed: ${error.message}`);
      }
    }),
    // セリの新規作成
    createSale: protectedProcedure.input(z2.object({
      saleCode: z2.string().min(1).max(32),
      saleName: z2.string().min(1).max(256),
      saleDate: z2.date(),
      status: z2.enum(["draft", "published", "hidden"]).optional()
    })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return await createSale(input);
    }),
    // セリ情報の更新
    updateSale: protectedProcedure.input(z2.object({
      id: z2.number(),
      saleCode: z2.string().min(1).max(32).optional(),
      saleName: z2.string().min(1).max(256).optional(),
      saleDate: z2.date().optional(),
      catalogUrl: z2.string().url().optional(),
      status: z2.enum(["draft", "published", "hidden"]).optional()
    })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      const { id, ...data } = input;
      return await updateSale(id, data);
    }),
    // セリのステータス更新
    updateSaleStatus: protectedProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["draft", "published", "hidden"])
    })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return await updateSaleStatus(input.id, input.status);
    }),
    // セリの削除
    deleteSale: protectedProcedure.input(z2.number()).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return await deleteSale(input);
    }),
    // JBISセールページからURLをインポート
    importJbisUrls: publicProcedure.input(z2.object({
      saleUrl: z2.string().url()
    })).mutation(async ({ input }) => {
      try {
        const result = await jbisImportService.importFromSaleUrl(input.saleUrl);
        return result;
      } catch (error) {
        throw new Error(`JBIS import failed: ${error.message}`);
      }
    }),
    // 複数のJBISセールURLを一括インポート
    importMultipleJbisUrls: publicProcedure.input(z2.object({
      saleUrls: z2.array(z2.string().url())
    })).mutation(async ({ input }) => {
      try {
        const result = await jbisImportService.importFromMultipleUrls(input.saleUrls);
        return result;
      } catch (error) {
        throw new Error(`Multiple JBIS import failed: ${error.message}`);
      }
    }),
    // JBIS URLの紐付け状況を確認
    checkJbisStatus: publicProcedure.query(async () => {
      try {
        const status = await jbisHorseLinkerService.checkExistingJbisUrls();
        return status;
      } catch (error) {
        throw new Error(`JBIS status check failed: ${error.message}`);
      }
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    const bypassDevAuth = process.env.BYPASS_DEV_AUTH === "true";
    if (process.env.NODE_ENV === "development" && bypassDevAuth) {
      try {
        const { getUserByOpenId: getUserByOpenId2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const { ENV: ENV2 } = await Promise.resolve().then(() => (init_env(), env_exports));
        user = await getUserByOpenId2(ENV2.ownerOpenId) || null;
      } catch (e) {
        console.warn("[Auth] DB lookup for dev user failed, using mock");
      }
      if (!user) {
        user = {
          id: 1,
          openId: "admin",
          name: "Local Admin (Mock)",
          email: "admin@local.test",
          role: "admin",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date(),
          lastSignedIn: /* @__PURE__ */ new Date()
        };
      }
    } else {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    console.error("[Auth] Authentication failed:", error);
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/index.ts
var app = express();
app.set("trust proxy", 1);
function configureApp(app2) {
  app2.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app2.use(express.json({ limit: "50mb" }));
  app2.use(express.urlencoded({ limit: "50mb", extended: true }));
  app2.use(cookieParser());
  console.log("[Server] Configuring routes...");
  registerOAuthRoutes(app2);
  registerMockOAuthRoutes(app2);
  app2.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
}
configureApp(app);
var index_default = app;
export {
  app,
  index_default as default
};
