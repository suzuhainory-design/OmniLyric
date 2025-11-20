import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, float } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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
 * Keywords table - stores user input keywords and their search results
 */
export const keywords = mysqlTable("keywords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  searchResults: text("searchResults"), // JSON string of search results
  weight: float("weight").default(1.0).notNull(), // Weight based on user satisfaction
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = typeof keywords.$inferInsert;

/**
 * Melodies table - stores melody descriptions and patterns
 */
export const melodies = mysqlTable("melodies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  description: text("description").notNull(), // Text description of melody
  melodyType: varchar("melodyType", { length: 50 }).notNull(), // 'text', 'pattern', 'other'
  melodyData: text("melodyData"), // Additional melody data in JSON format
  weight: float("weight").default(1.0).notNull(), // Weight based on user satisfaction
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Melody = typeof melodies.$inferSelect;
export type InsertMelody = typeof melodies.$inferInsert;

/**
 * Lyrics table - stores generated lyrics with metadata
 */
export const lyrics = mysqlTable("lyrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(), // The actual lyrics
  languages: varchar("languages", { length: 255 }).notNull(), // Comma-separated language codes: 'zh,en,ja'
  isMixed: boolean("isMixed").default(false).notNull(), // Whether it's mixed language
  translation: text("translation"), // Chinese translation for non-Chinese lyrics
  keywordIds: text("keywordIds"), // JSON array of keyword IDs used
  melodyId: int("melodyId"), // Reference to melody used
  satisfactionScore: float("satisfactionScore").default(0).notNull(), // User satisfaction score
  weight: float("weight").default(1.0).notNull(), // Weight for future generation
  timingData: text("timingData"), // JSON array of timing info for scrolling: [{line: string, startTime: number, duration: number}]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lyric = typeof lyrics.$inferSelect;
export type InsertLyric = typeof lyrics.$inferInsert;

/**
 * User preferences table - stores user's language and style preferences
 */
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  preferredLanguages: varchar("preferredLanguages", { length: 255 }).default("zh").notNull(), // Comma-separated: 'zh,en,ja,fr,ru,de'
  allowMixedLanguage: boolean("allowMixedLanguage").default(true).notNull(),
  defaultMelodyType: varchar("defaultMelodyType", { length: 50 }).default("text").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

/**
 * Feedback history table - tracks all user feedback for analytics
 */
export const feedbackHistory = mysqlTable("feedbackHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lyricId: int("lyricId").notNull(),
  feedbackType: mysqlEnum("feedbackType", ["like", "dislike", "neutral"]).notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeedbackHistory = typeof feedbackHistory.$inferSelect;
export type InsertFeedbackHistory = typeof feedbackHistory.$inferInsert;
