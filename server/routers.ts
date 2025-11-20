import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { generateLyrics, expandKeywords } from "./lyricService";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ========== Keyword Management ==========
  keywords: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getKeywordsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        keyword: z.string().min(1).max(255),
        searchResults: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createKeyword({
          userId: ctx.user.id,
          keyword: input.keyword,
          searchResults: input.searchResults,
          weight: 1.0,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        keyword: z.string().min(1).max(255).optional(),
        searchResults: z.string().optional(),
        weight: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateKeyword(id, updates);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteKeyword(input.id);
        return { success: true };
      }),
  }),

  // ========== Melody Management ==========
  melodies: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getMelodiesByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        description: z.string().min(1),
        melodyType: z.enum(['text', 'pattern', 'other']),
        melodyData: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createMelody({
          userId: ctx.user.id,
          description: input.description,
          melodyType: input.melodyType,
          melodyData: input.melodyData,
          weight: 1.0,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().optional(),
        melodyType: z.enum(['text', 'pattern', 'other']).optional(),
        melodyData: z.string().optional(),
        weight: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateMelody(id, updates);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMelody(input.id);
        return { success: true };
      }),
  }),

  // ========== Lyric Generation ==========
  generate: router({
    expandKeywords: protectedProcedure
      .input(z.object({
        keywords: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        return expandKeywords(input.keywords);
      }),
    
    generateLyrics: protectedProcedure
      .input(z.object({
        keywords: z.array(z.string()),
        melodyDescription: z.string(),
        languages: z.array(z.string()),
        isMixed: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await generateLyrics({
          ...input,
          userId: ctx.user.id,
        });
        
        // Save to database
        const lyric = await db.createLyric({
          userId: ctx.user.id,
          title: result.title,
          content: result.content,
          languages: input.languages.join(","),
          isMixed: input.isMixed,
          translation: result.translation,
          timingData: JSON.stringify(result.timingData),
          satisfactionScore: 0,
          weight: 1.0,
        });
        
        return lyric;
      }),
  }),

  // ========== Lyric Management ==========
  lyrics: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getLyricsByUserId(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getLyricById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
        content: z.string().min(1),
        languages: z.string(),
        isMixed: z.boolean(),
        translation: z.string().optional(),
        keywordIds: z.string().optional(),
        melodyId: z.number().optional(),
        timingData: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createLyric({
          userId: ctx.user.id,
          title: input.title,
          content: input.content,
          languages: input.languages,
          isMixed: input.isMixed,
          translation: input.translation,
          keywordIds: input.keywordIds,
          melodyId: input.melodyId,
          timingData: input.timingData,
          satisfactionScore: 0,
          weight: 1.0,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        satisfactionScore: z.number().optional(),
        weight: z.number().optional(),
        timingData: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateLyric(id, updates);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLyric(input.id);
        return { success: true };
      }),
  }),

  // ========== User Preferences ==========
  preferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPreference(ctx.user.id);
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        preferredLanguages: z.string(),
        allowMixedLanguage: z.boolean(),
        defaultMelodyType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserPreference({
          userId: ctx.user.id,
          preferredLanguages: input.preferredLanguages,
          allowMixedLanguage: input.allowMixedLanguage,
          defaultMelodyType: input.defaultMelodyType,
        });
        return { success: true };
      }),
  }),

  // ========== Feedback Management ==========
  feedback: router({
    create: protectedProcedure
      .input(z.object({
        lyricId: z.number(),
        feedbackType: z.enum(['like', 'dislike', 'neutral']),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create feedback record
        const feedback = await db.createFeedback({
          userId: ctx.user.id,
          lyricId: input.lyricId,
          feedbackType: input.feedbackType,
          comment: input.comment,
        });
        
        // Update lyric weight based on feedback
        const lyric = await db.getLyricById(input.lyricId);
        if (lyric) {
          let newWeight = lyric.weight;
          let newScore = lyric.satisfactionScore;
          
          if (input.feedbackType === 'like') {
            newScore = Math.min(10, newScore + 1);
            newWeight = Math.min(2.0, newWeight + 0.05);
          } else if (input.feedbackType === 'dislike') {
            newScore = Math.max(-10, newScore - 1);
            newWeight = Math.max(0.1, newWeight - 0.05);
          }
          
          await db.updateLyric(input.lyricId, {
            satisfactionScore: newScore,
            weight: newWeight,
          });
        }
        
        return feedback;
      }),
    
    getByLyricId: protectedProcedure
      .input(z.object({ lyricId: z.number() }))
      .query(async ({ input }) => {
        return db.getFeedbackByLyricId(input.lyricId);
      }),
    
    getByUserId: protectedProcedure.query(async ({ ctx }) => {
      return db.getFeedbackByUserId(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
