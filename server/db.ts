import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  keywords, InsertKeyword, Keyword,
  melodies, InsertMelody, Melody,
  lyrics, InsertLyric, Lyric,
  userPreferences, InsertUserPreference, UserPreference,
  feedbackHistory, InsertFeedbackHistory, FeedbackHistory
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

// ========== User Operations ==========

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

// ========== Keyword Operations ==========

export async function createKeyword(keyword: InsertKeyword): Promise<Keyword> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(keywords).values(keyword);
  const inserted = await db.select().from(keywords).where(eq(keywords.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getKeywordsByUserId(userId: number): Promise<Keyword[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(keywords).where(eq(keywords.userId, userId)).orderBy(desc(keywords.createdAt));
}

export async function updateKeyword(id: number, updates: Partial<InsertKeyword>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(keywords).set(updates).where(eq(keywords.id, id));
}

export async function deleteKeyword(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(keywords).where(eq(keywords.id, id));
}

// ========== Melody Operations ==========

export async function createMelody(melody: InsertMelody): Promise<Melody> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(melodies).values(melody);
  const inserted = await db.select().from(melodies).where(eq(melodies.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getMelodiesByUserId(userId: number): Promise<Melody[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(melodies).where(eq(melodies.userId, userId)).orderBy(desc(melodies.createdAt));
}

export async function updateMelody(id: number, updates: Partial<InsertMelody>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(melodies).set(updates).where(eq(melodies.id, id));
}

export async function deleteMelody(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(melodies).where(eq(melodies.id, id));
}

// ========== Lyric Operations ==========

export async function createLyric(lyric: InsertLyric): Promise<Lyric> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(lyrics).values(lyric);
  const inserted = await db.select().from(lyrics).where(eq(lyrics.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getLyricsByUserId(userId: number): Promise<Lyric[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(lyrics).where(eq(lyrics.userId, userId)).orderBy(desc(lyrics.createdAt));
}

export async function getLyricById(id: number): Promise<Lyric | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(lyrics).where(eq(lyrics.id, id)).limit(1);
  return result[0];
}

export async function updateLyric(id: number, updates: Partial<InsertLyric>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(lyrics).set(updates).where(eq(lyrics.id, id));
}

export async function deleteLyric(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(lyrics).where(eq(lyrics.id, id));
}

// ========== User Preferences Operations ==========

export async function getUserPreference(userId: number): Promise<UserPreference | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return result[0];
}

export async function upsertUserPreference(preference: InsertUserPreference): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(userPreferences).values(preference).onDuplicateKeyUpdate({
    set: {
      preferredLanguages: preference.preferredLanguages,
      allowMixedLanguage: preference.allowMixedLanguage,
      defaultMelodyType: preference.defaultMelodyType,
      updatedAt: new Date(),
    },
  });
}

// ========== Feedback History Operations ==========

export async function createFeedback(feedback: InsertFeedbackHistory): Promise<FeedbackHistory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(feedbackHistory).values(feedback);
  const inserted = await db.select().from(feedbackHistory).where(eq(feedbackHistory.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getFeedbackByLyricId(lyricId: number): Promise<FeedbackHistory[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(feedbackHistory).where(eq(feedbackHistory.lyricId, lyricId)).orderBy(desc(feedbackHistory.createdAt));
}

export async function getFeedbackByUserId(userId: number): Promise<FeedbackHistory[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(feedbackHistory).where(eq(feedbackHistory.userId, userId)).orderBy(desc(feedbackHistory.createdAt));
}
