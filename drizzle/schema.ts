import { integer, pgEnum, pgTable, text, timestamp, varchar, decimal, boolean, jsonb } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: text("role").$type<"user" | "admin">().default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const sexEnum = pgEnum("sex", ["牡", "牝", "セン"]);
export const evaluationEnum = pgEnum("evaluation", ["◎", "○", "△"]);

/**
 * セリ情報テーブル
 */
export const sales = pgTable("sales", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  saleCode: varchar("saleCode", { length: 32 }).notNull().unique(),
  saleName: varchar("saleName", { length: 256 }).notNull(),
  saleDate: timestamp("saleDate").notNull(),
  catalogUrl: varchar("catalogUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

/**
 * 上場馬情報テーブル
 */
export const horses = pgTable("horses", {
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
  videoUrl: varchar("videoUrl", { length: 512 }),
  pedigreePdfUrl: varchar("pedigreePdfUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Horse = typeof horses.$inferSelect;
export type InsertHorse = typeof horses.$inferInsert;

/**
 * ユーザー定義チェック項目テーブル
 */
export const userCheckItems = pgTable("userCheckItems", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  saleId: integer("saleId").notNull(),
  itemName: varchar("itemName", { length: 256 }).notNull(),
  itemType: text("itemType").$type<"boolean" | "numeric">().notNull(),
  score: integer("score").notNull(),
  criteria: jsonb("criteria"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserCheckItem = typeof userCheckItems.$inferSelect;
export type InsertUserCheckItem = typeof userCheckItems.$inferInsert;

/**
 * ユーザー評価・メモテーブル
 */
export const userChecks = pgTable("userChecks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  horseId: integer("horseId").notNull(),
  evaluation: evaluationEnum("evaluation"),
  memo: text("memo"),
  isEliminated: boolean("isEliminated").default(false).notNull(),
  totalScore: integer("totalScore").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserCheck = typeof userChecks.$inferSelect;
export type InsertUserCheck = typeof userChecks.$inferInsert;

/**
 * チェックリストの個別結果テーブル
 */
export const userCheckResults = pgTable("userCheckResults", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userCheckId: integer("userCheckId").notNull(),
  checkItemId: integer("checkItemId").notNull(),
  isChecked: boolean("isChecked").notNull(),
  scoreApplied: integer("scoreApplied").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserCheckResult = typeof userCheckResults.$inferSelect;
export type InsertUserCheckResult = typeof userCheckResults.$inferInsert;

/**
 * 人気度統計テーブル
 */
export const popularityStats = pgTable("popularityStats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  horseId: integer("horseId").notNull(),
  countExcellent: integer("countExcellent").default(0).notNull(),
  countGood: integer("countGood").default(0).notNull(),
  countFair: integer("countFair").default(0).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
});

export type PopularityStat = typeof popularityStats.$inferSelect;
export type InsertPopularityStat = typeof popularityStats.$inferInsert;