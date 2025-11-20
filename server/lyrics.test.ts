import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Lyrics Management", () => {
  it("should list user lyrics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const lyrics = await caller.lyrics.list();
    
    expect(Array.isArray(lyrics)).toBe(true);
  });

  it("should create a lyric", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const lyric = await caller.lyrics.create({
      title: "Test Song",
      content: "This is a test lyric\nWith multiple lines",
      languages: "en",
      isMixed: false,
      translation: "这是测试歌词\n有多行",
      timingData: JSON.stringify([
        { line: "This is a test lyric", startTime: 0, duration: 3000 },
        { line: "With multiple lines", startTime: 3000, duration: 3000 },
      ]),
    });

    expect(lyric).toBeDefined();
    expect(lyric.title).toBe("Test Song");
    expect(lyric.userId).toBe(ctx.user!.id);
  });

  it("should get lyric by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a lyric first
    const created = await caller.lyrics.create({
      title: "Test Song 2",
      content: "Another test lyric",
      languages: "zh",
      isMixed: false,
    });

    // Get it by ID
    const lyric = await caller.lyrics.getById({ id: created.id });

    expect(lyric).toBeDefined();
    expect(lyric?.id).toBe(created.id);
    expect(lyric?.title).toBe("Test Song 2");
  });

  it("should update lyric satisfaction score", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a lyric
    const created = await caller.lyrics.create({
      title: "Test Song 3",
      content: "Test content",
      languages: "zh",
      isMixed: false,
    });

    // Update satisfaction score
    await caller.lyrics.update({
      id: created.id,
      satisfactionScore: 5,
      weight: 1.25,
    });

    // Verify update
    const updated = await caller.lyrics.getById({ id: created.id });
    expect(updated?.satisfactionScore).toBe(5);
    expect(updated?.weight).toBe(1.25);
  });

  it("should delete lyric", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a lyric
    const created = await caller.lyrics.create({
      title: "Test Song to Delete",
      content: "This will be deleted",
      languages: "zh",
      isMixed: false,
    });

    // Delete it
    const result = await caller.lyrics.delete({ id: created.id });
    expect(result.success).toBe(true);

    // Verify deletion
    const deleted = await caller.lyrics.getById({ id: created.id });
    expect(deleted).toBeUndefined();
  });
});

describe("Feedback System", () => {
  it("should create feedback and update lyric weight", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a lyric
    const lyric = await caller.lyrics.create({
      title: "Test Song for Feedback",
      content: "Test content",
      languages: "zh",
      isMixed: false,
    });

    const initialWeight = lyric.weight;
    const initialScore = lyric.satisfactionScore;

    // Submit positive feedback
    const feedback = await caller.feedback.create({
      lyricId: lyric.id,
      feedbackType: "like",
      comment: "Great lyrics!",
    });

    expect(feedback).toBeDefined();
    expect(feedback.feedbackType).toBe("like");

    // Check if weight and score were updated
    const updated = await caller.lyrics.getById({ id: lyric.id });
    expect(updated?.weight).toBeGreaterThan(initialWeight);
    expect(updated?.satisfactionScore).toBeGreaterThan(initialScore);
  });

  it("should decrease weight on negative feedback", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a lyric
    const lyric = await caller.lyrics.create({
      title: "Test Song for Negative Feedback",
      content: "Test content",
      languages: "zh",
      isMixed: false,
    });

    const initialWeight = lyric.weight;
    const initialScore = lyric.satisfactionScore;

    // Submit negative feedback
    await caller.feedback.create({
      lyricId: lyric.id,
      feedbackType: "dislike",
    });

    // Check if weight and score were updated
    const updated = await caller.lyrics.getById({ id: lyric.id });
    expect(updated?.weight).toBeLessThan(initialWeight);
    expect(updated?.satisfactionScore).toBeLessThan(initialScore);
  });

  it("should retrieve feedback by lyric id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a lyric
    const lyric = await caller.lyrics.create({
      title: "Test Song for Feedback List",
      content: "Test content",
      languages: "zh",
      isMixed: false,
    });

    // Submit multiple feedbacks
    await caller.feedback.create({
      lyricId: lyric.id,
      feedbackType: "like",
    });
    await caller.feedback.create({
      lyricId: lyric.id,
      feedbackType: "dislike",
    });

    // Retrieve feedbacks
    const feedbacks = await caller.feedback.getByLyricId({ lyricId: lyric.id });
    expect(feedbacks.length).toBeGreaterThanOrEqual(2);
  });
});

describe("User Preferences", () => {
  it("should get and upsert user preferences", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Upsert preferences
    await caller.preferences.upsert({
      preferredLanguages: "zh,en,ja",
      allowMixedLanguage: true,
      defaultMelodyType: "text",
    });

    // Get preferences
    const prefs = await caller.preferences.get();
    expect(prefs).toBeDefined();
    expect(prefs?.preferredLanguages).toBe("zh,en,ja");
    expect(prefs?.allowMixedLanguage).toBe(true);
  });

  it("should update existing preferences", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Initial upsert
    await caller.preferences.upsert({
      preferredLanguages: "zh",
      allowMixedLanguage: false,
      defaultMelodyType: "text",
    });

    // Update
    await caller.preferences.upsert({
      preferredLanguages: "zh,en",
      allowMixedLanguage: true,
      defaultMelodyType: "pattern",
    });

    // Verify
    const prefs = await caller.preferences.get();
    expect(prefs?.preferredLanguages).toBe("zh,en");
    expect(prefs?.allowMixedLanguage).toBe(true);
    expect(prefs?.defaultMelodyType).toBe("pattern");
  });
});
