import { create } from 'zustand';
import type { Message } from '../lib/api';
import { sendMessage, resetChat } from '../lib/api';

interface ChatState {
  messages: Message[];
  loading: boolean;
  drinkRecommendation: string | null;
  initialized: boolean;
  addMessage: (message: Message) => void;
  sendUserMessage: (content: string) => Promise<void>;
  reset: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  drinkRecommendation: null,
  initialized: false,

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  initialize: async () => {
    const { initialized, loading } = get();
    if (initialized || loading) return;
    
    set({ initialized: true, loading: true });
    
    try {
      // Pass empty UI flags for now (any temp, any caffeine)
      const response = await sendMessage([], { temp: 'any', caffeine: 'any' });
      
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.response 
      };
      
      set((state) => ({ 
        messages: [assistantMessage],
        loading: false
      }));
    } catch (error) {
      console.error('Failed to initialize:', error);
      set({ loading: false });
    }
  },

  sendUserMessage: async (content: string) => {
    const { messages, addMessage } = get();
    
    if (!content) return;
    
    const userMessage: Message = { role: 'user', content };
    addMessage(userMessage);
    
    set({ loading: true });
    
    try {
      // Pass UI flags as 'any' for now
      const response = await sendMessage([...messages, userMessage], { temp: 'any', caffeine: 'any' });
      
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.response 
      };
      addMessage(assistantMessage);
      
      if (response.isDrinkRecommendation) {
        set({ drinkRecommendation: response.response });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      set({ loading: false });
    }
  },

  reset: async () => {
    await resetChat();
    set({ messages: [], drinkRecommendation: null, initialized: false });
  }
}));