import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

// =============================================================================
// API CONFIGURATION
// =============================================================================
//
// This service supports two modes:
//
// 1. DIRECT MODE (for local testing only - NOT secure for production)
//    Set VITE_GEMINI_API_KEY in your .env file
//    The API key will be exposed in the browser - only use for development!
//
// 2. PROXY MODE (recommended for production)
//    Set VITE_API_PROXY_URL to point to your backend proxy
//    Your backend holds the API key securely and forwards requests
//
//    Example proxy endpoints your backend should implement:
//    - POST /api/ai/compassion  - body: { state: AppState }
//    - POST /api/ai/tasks       - body: { mood: string }
//    - POST /api/ai/habit-stack - body: { currentTask: string }
//
// =============================================================================

const getConfig = () => {
  const proxyUrl = import.meta.env.VITE_API_PROXY_URL;
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  return {
    useProxy: !!proxyUrl,
    proxyUrl,
    apiKey
  };
};

// Fallback messages when AI is unavailable
const FALLBACK_COMPASSION = "You are doing wonderful work. Remember to breathe and take it one step at a time.";
const FALLBACK_TASKS = ["Drink a glass of water", "Stretch for 1 minute", "Look out a window"];
const FALLBACK_HABIT = (task: string) => `After I ${task}, I will take one deep breath.`;

// =============================================================================
// COMPASSION MESSAGE
// =============================================================================

export const generateCompassionMessage = async (state: AppState): Promise<string> => {
  const config = getConfig();

  // If no API configuration, return fallback
  if (!config.useProxy && !config.apiKey) {
    console.warn("No API configuration found. Returning default message.");
    return FALLBACK_COMPASSION;
  }

  try {
    // PROXY MODE
    if (config.useProxy) {
      const response = await fetch(`${config.proxyUrl}/api/ai/compassion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state })
      });
      if (!response.ok) throw new Error('Proxy request failed');
      const data = await response.json();
      return data.message;
    }

    // DIRECT MODE (testing only)
    const ai = new GoogleGenAI({ apiKey: config.apiKey! });

    const prompt = `
      Act as a compassionate Internal Family Systems (IFS) informed therapist and friend.
      The user is using a "Healing Journey" app.

      User Context:
      - Name: ${state.settings.name}
      - Current Level: ${state.currentLevel}
      - Total XP: ${state.totalXp}
      - In Survival Mode: ${state.settings.survivalMode ? 'Yes' : 'No'}
      - Recent Wins: ${state.wins.slice(0, 2).map(w => w.text).join(', ')}

      Task: Provide a short (max 2 sentences), warm, and validating message of encouragement.
      Focus on effort, not perfection. If they are in survival mode, emphasize that surviving is enough.
      Do not sound robotic. Be gentle.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("AI API Error:", error);
    return "Small steps lead to big changes. I'm proud of you for showing up today.";
  }
};

// =============================================================================
// TASK SUGGESTIONS
// =============================================================================

export const suggestTasks = async (mood: string): Promise<string[]> => {
  const config = getConfig();

  if (!config.useProxy && !config.apiKey) {
    return FALLBACK_TASKS;
  }

  try {
    // PROXY MODE
    if (config.useProxy) {
      const response = await fetch(`${config.proxyUrl}/api/ai/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood })
      });
      if (!response.ok) throw new Error('Proxy request failed');
      const data = await response.json();
      return data.tasks;
    }

    // DIRECT MODE (testing only)
    const ai = new GoogleGenAI({ apiKey: config.apiKey! });
    const prompt = `
      The user is feeling "${mood}". Suggest 3 tiny, manageable tasks (under 5 minutes) they could do right now to earn 1 XP in their healing journey app.
      Format as a JSON array of strings.
      Keep them very simple. Example: ["Put one dish away", "Text a friend a heart emoji"].
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI API Error:", error);
    return ["Take 3 deep breaths", "Listen to one song you like", "Gentle neck stretch"];
  }
};

// =============================================================================
// HABIT STACK SUGGESTIONS
// =============================================================================

export const suggestHabitStack = async (currentTask: string): Promise<string> => {
  const config = getConfig();

  if (!config.useProxy && !config.apiKey) {
    return FALLBACK_HABIT(currentTask);
  }

  try {
    // PROXY MODE
    if (config.useProxy) {
      const response = await fetch(`${config.proxyUrl}/api/ai/habit-stack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentTask })
      });
      if (!response.ok) throw new Error('Proxy request failed');
      const data = await response.json();
      return data.suggestion;
    }

    // DIRECT MODE (testing only)
    const ai = new GoogleGenAI({ apiKey: config.apiKey! });
    const prompt = `
      The user wants to build a habit stack based on this existing habit: "${currentTask}".
      Suggest a tiny, positive new habit to attach to it.
      Format: "After I [current task], I will [new tiny task]."
      Keep it very simple and mental health focused.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("AI API Error:", error);
    return FALLBACK_HABIT(currentTask);
  }
}
