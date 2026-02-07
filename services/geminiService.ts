import { GoogleGenAI } from "@google/generative-ai";
import { AppState } from "../types";

// Helper to safely get the API key
const getApiKey = (): string | undefined => {
  return process.env.API_KEY;
};

export const generateCompassionMessage = async (state: AppState): Promise<string> => {
  const apiKey = getApiKey();
  
  // If no API key is available, return a fallback message immediately without erroring
  if (!apiKey) {
    console.warn("No API Key found for Gemini. Returning default message.");
    return "You are doing wonderful work. Remember to breathe and take it one step at a time.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Construct a prompt based on user state
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
    console.error("Gemini API Error:", error);
    return "Small steps lead to big changes. I'm proud of you for showing up today.";
  }
};

export const suggestTasks = async (mood: string): Promise<string[]> => {
    const apiKey = getApiKey();
    if (!apiKey) return ["Drink a glass of water", "Stretch for 1 minute", "Look out a window"];

    try {
        const ai = new GoogleGenAI({ apiKey });
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

        const text = response.text;
        return JSON.parse(text);
    } catch (error) {
        return ["Take 3 deep breaths", "Listen to one song you like", "Gentle neck stretch"];
    }
}

export const suggestHabitStack = async (currentTask: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "After I brush my teeth, I will drink one glass of water.";

  try {
      const ai = new GoogleGenAI({ apiKey });
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
      return `After I ${currentTask}, I will take one deep breath.`;
  }
}