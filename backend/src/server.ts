import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getNextQuestion, getFinalRecommendation } from './services/openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: '☕ Cafekase API',
    endpoints: {
      health: 'GET /health',
      chat: 'POST /api/chat',
      reset: 'POST /api/reset'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Chat endpoint with minimum question enforcement
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, uiFlags } = req.body;
    
    // Default UI flags if not provided
    const flags = uiFlags || { temp: 'any', caffeine: 'any' };
    
    const conversationMessages = messages || [];
    
    // Count user messages (each user response = 1 question answered)
    const userMessageCount = conversationMessages.filter((m: any) => m.role === 'user').length;
    
    let response;
    
    // MINIMUM 4 questions before allowing recommendation
    if (userMessageCount >= 4) {
      // After 4 questions, check if response contains DRINK:
      response = await getNextQuestion(conversationMessages, flags);
      
      // If it doesn't have a recommendation yet and we're at 5+ questions, force it
      if (!response?.includes('DRINK:') && userMessageCount >= 5) {
        response = await getFinalRecommendation(conversationMessages, flags);
      }
    } else {
      // Less than 4 questions, always ask more
      response = await getNextQuestion(conversationMessages, flags);
    }
    
    res.json({ 
      response,
      isDrinkRecommendation: response?.includes('DRINK:') || false
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

// Reset conversation
app.post('/api/reset', (req, res) => {
  res.json({ status: 'conversation reset' });
});

app.listen(PORT, () => {
  console.log(`☕ Cafekase server running on http://localhost:${PORT}`);
});