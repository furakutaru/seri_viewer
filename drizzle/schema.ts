import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * セリ情報テーブル
 */
export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  saleCode: varchar("saleCode", { length: 32 }).notNull().unique(),
  saleName: varchar("saleName", { length: 256 }).notNull(),
  saleDate: timestamp("saleDate").notNull(),
  catalogUrl: varchar("catalogUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

/**
 * 上場馬情報テーブル
 */
export const horses = mysqlTable("horses", {
  id: int("id").autoincrement().primaryKey(),
  saleId: int("saleId").notNull(),
  lotNumber: int("lotNumber").notNull(),
  sex: mysqlEnum("sex", ["牡", "牝", "セン"]),
  color: varchar("color", { length: 64 }),
  birthDate: timestamp("birthDate"),
  sireName: varchar("sireName", { length: 256 }),
  damName: varchar("damName", { length: 256 }),
  consignor: varchar("consignor", { length: 256 }),
  breeder: varchar("breeder", { length: 256 }),
  height: decimal("height", { precision: 5, scale: 2 }),
  girth: decimal("girth", { precision: 5, scale: 2 }),
  cannon: decimal("cannon", { precision: 5, scale: 2 }),
  priceEstimate: int("priceEstimate"),
  photoUrl: varchar("photoUrl", { length: 512 }),
  videoUrl: varchar("videoUrl", { length: 512 }),
  pedigreePdfUrl: varchar("pedigreePdfUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Horse = typeof horses.$inferSelect;
export type InsertHorse = typeof horses.$inferInsert;

/**
 * ユーザー定義チェック項目テーブル
 */
export const userCheckItems = mysqlTable("userCheckItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  saleId: int("saleId").notNull(),
  itemName: varchar("itemName", { length: 256 }).notNull(),
  itemType: mysqlEnum("itemType", ["boolean", "numeric"]).notNull(),
  score: int("score").notNull(),
  criteria: json("criteria"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCheckItem = typeof userCheckItems.$inferSelect;
export type InsertUserCheckItem = typeof userCheckItems.$inferInsert;

/**
 * ユーザー評価・メモテーブル
 */
export const userChecks = mysqlTable("userChecks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  horseId: int("horseId").notNull(),
  evaluation: mysqlEnum("evaluation", ["◎", "○", "△"]),
  memo: text("memo"),
  isEliminated: boolean("isEliminated").default(false).notNull(),
  totalScore: int("totalScore").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCheck = typeof userChecks.$inferSelect;
export type InsertUserCheck = typeof userChecks.$inferInsert;

/**
 * チェックリストの個別結果テーブル
 */
export const userCheckResults = mysqlTable("userCheckResults", {
  id: int("id").autoincrement().primaryKey(),
  userCheckId: int("userCheckId").notNull(),
  checkItemId: int("checkItemId").notNull(),
  isChecked: boolean("isChecked").notNull(),
  scoreApplied: int("scoreApplied").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCheckResult = typeof userCheckResults.$inferSelect;
export type InsertUserCheckResult = typeof userCheckResults.$inferInsert;

/**
 * 人気度統計テーブル
 */
export const popularityStats = mysqlTable("popularityStats", {
  id: int("id").autoincrement().primaryKey(),
  horseId: int("horseId").notNull(),
  countExcellent: int("countExcellent").default(0).notNull(),
  countGood: int("countGood").default(0).notNull(),
  countFair: int("countFair").default(0).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type PopularityStat = typeof popularityStats.$inferSelect;
export type InsertPopularityStat = typeof popularityStats.$inferInsert;