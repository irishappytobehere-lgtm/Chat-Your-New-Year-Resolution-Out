import { GoogleGenAI, FunctionDeclaration, Type, Chat, LiveServerMessage } from "@google/genai";
import { ResolutionCategory } from "../types";

// Tool Definition
const saveResolutionTool: FunctionDeclaration = {
  name: 'saveResolution',
  description: 'Saves a finalized New Year resolution to the user\'s board. Call this when the user has agreed on a specific resolution, its motivation, and a first step.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'A concise title for the resolution (e.g., "Run a Marathon").',
      },
      category: {
        type: Type.STRING,
        enum: Object.values(ResolutionCategory),
        description: 'The category this resolution falls into.',
      },
      motivation: {
        type: Type.STRING,
        description: 'The user\'s core "why" or motivation for this goal.',
      },
      firstStep: {
        type: Type.STRING,
        description: 'The immediate first action step the user will take.',
      },
    },
    required: ['title', 'category', 'motivation', 'firstStep'],
  },
};

const SYSTEM_INSTRUCTION = `
You are Resolv, an expert life coach and New Year's resolution architect. 
Your goal is to guide the user to create meaningful, realistic, and structured resolutions.

PROCESS:
1. **Reflection**: Briefly ask about the past year. What went well? What didn't?
2. **Brainstorming**: Explore areas like Health, Career, Relationships.
3. **Refining**: When a user suggests an idea, help them make it specific (SMART goals). Ask for their "Why" (Motivation) and their "First Step".
4. **Finalizing**: Once a resolution is solid (has Title, Category, Motivation, and First Step), call the 'saveResolution' tool to save it. Tell the user you've added it to their board.

TONE:
- Warm, encouraging, but professional.
- Thought-provoking. Ask one good question at a time.
- Do not overwhelm the user.
- Use emojis sparingly but effectively.

IMPORTANT:
- Do not call 'saveResolution' until you have clarified the Title, Category, Motivation, and First Step with the user.
- If the user is vague, ask probing questions to clarify.
`;

let chatInstance: Chat | null = null;
let aiInstance: GoogleGenAI | null = null;

export const initializeGenAI = () => {
  if (!aiInstance) {
    if (!process.env.API_KEY) {
      console.error("API_KEY is missing");
      return;
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
};

export const createChatSession = () => {
  initializeGenAI();
  if (!aiInstance) throw new Error("AI not initialized");

  chatInstance = aiInstance.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: [saveResolutionTool] }],
    },
  });
  return chatInstance;
};

export const sendMessage = async (
  message: string, 
  onToolCall: (toolCall: any) => Promise<any>
) => {
  if (!chatInstance) {
    createChatSession();
  }
  if (!chatInstance) throw new Error("Chat could not be initialized");

  try {
    let result = await chatInstance.sendMessage({ message });
    
    // Check for function calls loop (Gemini might call multiple tools or need output)
    // The SDK handles the tool use loop if we provide the responses.
    // However, the standard `sendMessage` in the new SDK returns a response that MIGHT contain function calls.
    // We need to manually handle the turn if it's a function call.

    // Basic loop for function handling
    while (result.functionCalls && result.functionCalls.length > 0) {
      const toolCalls = result.functionCalls;
      const functionResponses = [];

      for (const call of toolCalls) {
        // Execute client-side logic
        const responseData = await onToolCall(call);
        
        functionResponses.push({
          name: call.name,
          id: call.id, // ID is required for mapping back
          response: { result: responseData } // Structure expected by SDK
        });
      }

      // Send the tool results back to the model
      result = await chatInstance.sendMessage(functionResponses);
    }

    return result.text;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
};
