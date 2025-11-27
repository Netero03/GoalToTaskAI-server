// services/aiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Extracts JSON from Gemini response safely.
 * Gemini models often wrap JSON in markdown or text, so we extract the first JSON block.
 */
function extractJSON(text) {
  try {
    // Find the first { ... }
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in AI response.");
    return JSON.parse(match[0]);
  } catch (err) {
    console.error("JSON parse error:", err.message);
    throw new Error("Gemini returned invalid JSON.");
  }
}

export async function generateTasksFromGoal(goal) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
    });

    // ---- PROMPT (Based on your project PDF) ----
    const prompt = `
You are an expert project planner. 
Convert the following user goal into a structured task breakdown.

RULES:
- Respond ONLY in VALID JSON. No markdown.
- Output strictly:
{
  "title": "Project Title",
  "description": "Short description",
  "estimatedTotalHours": number,
  "tasks": [
    {
      "title": "",
      "description": "",
      "estimatedHours": number,
      "priority": "high" | "medium" | "low"
    }
  ]
}

User Goal:
"${goal}"
`;

    const result = await model.generateContent(prompt);
    const output = result.response.text();

    return extractJSON(output);
  } catch (err) {
    console.error("AI Generation Error:", err);
    throw new Error("Failed to generate tasks from Gemini AI.");
  }
}
