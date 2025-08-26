import { aiService } from './aiService';
import { AIModel, ChatMessage, AIParameters } from '@/contexts/AIContext';

async function testAIService() {
  const messages: ChatMessage[] = [
    { 
      id: 'test-1', 
      role: 'user', 
      content: 'What is the weather today?', 
      timestamp: new Date() 
    }
  ];
  
  const model: AIModel = { 
    id: 'gpt-3.5-turbo', 
    provider: 'openai', 
    name: 'GPT-3.5 Turbo', 
    description: 'Fast and efficient for most tasks' 
  };
  const parameters: AIParameters = { temperature: 0.7, maxTokens: 100, topP: 1, presencePenalty: 0, frequencyPenalty: 0 };

  try {
    const response = await aiService.generateResponse(messages, model, parameters);
    console.log('AI Response:', response);
  } catch (error) {
    console.error('Error testing AI Service:', error);
  }
}

testAIService();
