import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.HOVO

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface UIFlags {
  temp?: 'iced' | 'hot' | 'any';
  caffeine?: 'any' | 'no_caffeine' | 'caffeinated_only';
}

export interface ChatResponse {
  response: string;
  isDrinkRecommendation: boolean;
}

export async function sendMessage(messages: Message[], uiFlags?: UIFlags): Promise<ChatResponse> {
  const response = await axios.post<ChatResponse>(`${API_URL}/api/chat`, {
    messages,
    uiFlags
  });
  return response.data;
}

export async function resetChat(): Promise<void> {
  await axios.post(`${API_URL}/api/reset`);
}