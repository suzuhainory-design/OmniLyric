import { invokeLLM } from "./_core/llm";

export interface LyricGenerationParams {
  keywords: string[];
  melodyDescription: string;
  languages: string[];
  isMixed: boolean;
  userId: number;
}

export interface GeneratedLyric {
  title: string;
  content: string;
  translation?: string;
  timingData: Array<{
    line: string;
    startTime: number;
    duration: number;
  }>;
}

/**
 * Search and expand keywords using web search
 */
export async function expandKeywords(keywords: string[]): Promise<Record<string, string>> {
  const expandedKeywords: Record<string, string> = {};
  
  for (const keyword of keywords) {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that expands keywords with relevant context and associations for lyric writing. Provide a brief, creative expansion of the keyword in 2-3 sentences."
          },
          {
            role: "user",
            content: `Expand this keyword for songwriting: ${keyword}`
          }
        ],
      });
      
      const content = response.choices[0]?.message?.content;
      expandedKeywords[keyword] = typeof content === 'string' ? content : keyword;
    } catch (error) {
      console.error(`Failed to expand keyword: ${keyword}`, error);
      expandedKeywords[keyword] = keyword;
    }
  }
  
  return expandedKeywords;
}

/**
 * Generate lyrics based on keywords, melody, and language preferences
 */
export async function generateLyrics(params: LyricGenerationParams): Promise<GeneratedLyric> {
  const { keywords, melodyDescription, languages, isMixed } = params;
  
  // Expand keywords first
  const expandedKeywords = await expandKeywords(keywords);
  
  // Build language instruction
  const languageNames: Record<string, string> = {
    zh: "Chinese",
    en: "English",
    ja: "Japanese",
    fr: "French",
    ru: "Russian",
    de: "German",
  };
  
  const languageList = languages.map(code => languageNames[code] || code).join(", ");
  const languageInstruction = isMixed
    ? `Create lyrics mixing these languages: ${languageList}. Feel free to switch between languages naturally.`
    : `Create lyrics primarily in ${languageList}. You may use one or more of these languages, but keep it cohesive.`;
  
  // Build keyword context
  const keywordContext = Object.entries(expandedKeywords)
    .map(([keyword, expansion]) => `- ${keyword}: ${expansion}`)
    .join("\n");
  
  const systemPrompt = `You are a professional lyricist and songwriter. You create emotional, poetic, and memorable song lyrics that resonate with listeners. You understand rhythm, rhyme, and how to match lyrics to melody descriptions.`;
  
  const userPrompt = `Create song lyrics with the following requirements:

**Keywords and Themes:**
${keywordContext}

**Melody Description:**
${melodyDescription}

**Language Requirements:**
${languageInstruction}

**Instructions:**
1. Create a complete song with verses, chorus, and bridge
2. Match the rhythm and mood of the melody description
3. Incorporate the keywords naturally and creatively
4. Use poetic language and vivid imagery
5. Ensure the lyrics flow well and are singable
6. If mixing languages, do so in a way that feels natural and artistic

Please provide:
1. A title for the song
2. The complete lyrics with clear structure (mark verses, chorus, bridge)
3. Timing information for each line (estimate start time in milliseconds and duration)

Format your response as JSON:
{
  "title": "Song Title",
  "lyrics": "Full lyrics with \\n for line breaks",
  "timingData": [
    {"line": "First line", "startTime": 0, "duration": 3000},
    {"line": "Second line", "startTime": 3000, "duration": 3000}
  ]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lyric_generation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "The title of the song" },
              lyrics: { type: "string", description: "The complete lyrics with line breaks" },
              timingData: {
                type: "array",
                description: "Timing information for each line",
                items: {
                  type: "object",
                  properties: {
                    line: { type: "string", description: "The lyric line" },
                    startTime: { type: "number", description: "Start time in milliseconds" },
                    duration: { type: "number", description: "Duration in milliseconds" }
                  },
                  required: ["line", "startTime", "duration"],
                  additionalProperties: false
                }
              }
            },
            required: ["title", "lyrics", "timingData"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No content in LLM response");
    }

    const parsed = JSON.parse(content);
    
    // Generate translation if not Chinese
    let translation: string | undefined;
    if (!languages.includes("zh")) {
      translation = await translateLyrics(parsed.lyrics, "zh");
    }

    return {
      title: parsed.title,
      content: parsed.lyrics,
      translation,
      timingData: parsed.timingData,
    };
  } catch (error) {
    console.error("Failed to generate lyrics:", error);
    throw new Error("Failed to generate lyrics. Please try again.");
  }
}

/**
 * Translate lyrics to target language
 */
export async function translateLyrics(lyrics: string, targetLanguage: string): Promise<string> {
  const languageNames: Record<string, string> = {
    zh: "Chinese",
    en: "English",
    ja: "Japanese",
    fr: "French",
    ru: "Russian",
    de: "German",
  };
  
  const targetLangName = languageNames[targetLanguage] || targetLanguage;
  
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a professional translator specializing in song lyrics. Translate lyrics while preserving their poetic meaning, emotion, and artistic intent.`
        },
        {
          role: "user",
          content: `Translate the following song lyrics to ${targetLangName}. Preserve the structure and line breaks:\n\n${lyrics}`
        }
      ],
    });
    
    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : lyrics;
  } catch (error) {
    console.error("Failed to translate lyrics:", error);
    return lyrics;
  }
}
