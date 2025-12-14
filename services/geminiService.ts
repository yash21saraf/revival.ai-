import { GoogleGenAI } from "@google/genai";
import { RevivalStrategy } from "../types";

// Defined as a clear JSON structure example to ensure the model outputs valid JSON without comments
const SCHEMA_EXAMPLE = `
{
  "originalVideoMetadata": {
    "title": "Video Title",
    "publishDate": "2023-01-01",
    "currentViews": 15000
  },
  "segments": [
    {
      "startTime": "00:00:00",
      "endTime": "00:02:30",
      "summary": "Intro to topic",
      "subjects": ["React", "Class Components"],
      "needsUpdate": true
    }
  ],
  "outdatedItems": [
    {
      "subject": "State Management",
      "oldTool": "Redux (Old Style)",
      "newTool": "Redux Toolkit",
      "reason": "Redux Toolkit reduces boilerplate...",
      "impactScore": 8,
      "affectedSegmentIndices": [0]
    }
  ],
  "revivalPlan": {
    "title": "New Optimized Title",
    "description": "New Description...",
    "scriptOutline": "Markdown content..."
  },
  "predictedViews": 50000,
  "predictedEngagement": 85
}
`;

export const analyzeVideoAndCreateRevivalPlan = async (
  videoUrl: string,
  frames: { mimeType: string; data: string }[] | null,
  onThinking: (text: string) => void
): Promise<RevivalStrategy> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-pro-preview";

  let prompt = `
    You are a Content Revival Expert for YouTube Developers.
    I am providing a YouTube link: "${videoUrl}".
    
    Your task is to:
    1. Research this video to understand its content, find its *actual* current view count and publish date using Google Search.
    2. Breakdown the video into small segments, for each segment add a summary and identify the subject discussed in the segment. Try to break down the video into small segments. 
    3. For each subject, fact check it against google search and compare against latest standards.
    3. Map outdated tools to specific timestamped segments in the video.
    4. Create a comprehensive revival strategy including a new title, description, and script outline.

    CRITICAL INSTRUCTION:
    You must "Think Out Loud" before providing the final JSON. 
    1. First, write a detailed analysis inside a <thinking> tag. Explain your research steps, exactly what you found for the view count, and your reasoning for each outdated item.
    2. Then, provide the final structured data inside a \`\`\`json\`\`\` code block.
    
    The JSON must strictly follow this structure (valid JSON, no comments):
    ${SCHEMA_EXAMPLE}
  `;

  const contents = [];
  if (frames && frames.length > 0) {
    contents.push(...frames.map(f => ({
      inlineData: {
        mimeType: f.mimeType,
        data: f.data
      }
    })));
    prompt += "\nI have also provided a visual frame/thumbnail for context.";
  }

  contents.push({ text: prompt });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelId,
      contents: contents,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    let fullText = "";
    let thinkingText = "";

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
      }

      const thinkingMatch = fullText.match(/<thinking>([\s\S]*?)(?:<\/thinking>|$)/);
      if (thinkingMatch) {
        thinkingText = thinkingMatch[1];
        onThinking(thinkingText);
      } else if (fullText.includes("<thinking>")) {
         thinkingText = fullText.split("<thinking>")[1] || "";
         onThinking(thinkingText);
      }
    }

    // Improved Regex to catch JSON blocks with or without 'json' language specifier, and case insensitive
    const jsonMatch = fullText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    
    if (!jsonMatch) {
      console.error("Full text received:", fullText);
      throw new Error("Failed to parse JSON response from model output. The model did not return a valid JSON block.");
    }

    const jsonStr = jsonMatch[1];
    let parsedData: any;
    
    try {
        parsedData = JSON.parse(jsonStr);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        console.error("JSON String:", jsonStr);
        throw new Error("Failed to parse the JSON returned by the AI.");
    }

    // Unwrapping logic to handle common model nesting behaviors
    let strategy = parsedData;
    if (parsedData.RevivalStrategy) strategy = parsedData.RevivalStrategy;
    else if (parsedData.revivalStrategy) strategy = parsedData.revivalStrategy;
    
    // Validate critical fields to prevent "empty dashboard" syndrome
    if (!strategy.originalVideoMetadata) {
        console.warn("Missing originalVideoMetadata, attempting to reconstruct...");
        strategy.originalVideoMetadata = {
            title: "Unknown Title",
            publishDate: "Unknown Date",
            currentViews: 0
        };
    }

    return strategy as RevivalStrategy;

  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const generateVisualOverlay = async (
  originalFrame: { mimeType: string; data: string },
  updateContext: string
): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");
  
    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-3-pro-image-preview";
  
    const prompt = `
      This is a frame from an old coding tutorial.
      The user is updating this content.
      Update: ${updateContext}
      Task: Edit this image to reflect the NEW update.
      Keep most of the frame same and highlight what needs to be updated in the provided frame and overlay the text. Do not generate the full image from scratch.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            { inlineData: { mimeType: originalFrame.mimeType, data: originalFrame.data } },
            { text: prompt }
          ]
        },
      });
  
      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
             return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
      throw new Error("No image generated");
    } catch (error) {
      console.error("Visual generation failed:", error);
      throw error;
    }
};