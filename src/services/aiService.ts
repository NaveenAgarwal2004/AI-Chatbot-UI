import { AIModel, ChatMessage, AIParameters } from '@/contexts/AIContext';

export interface AIResponse {
  success: boolean;
  content: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class AIService {
  private readonly enableRealAPI = import.meta.env.VITE_ENABLE_REAL_API === 'true';
  private readonly mockDelay = parseInt(import.meta.env.VITE_MOCK_API_DELAY || '1500');

  async generateResponse(
    messages: ChatMessage[],
    model: AIModel,
    parameters: AIParameters
  ): Promise<AIResponse> {
    if (!this.enableRealAPI) {
      return this.generateMockResponse(messages, model, parameters);
    }

    try {
      switch (model.provider.toLowerCase()) {
        case 'openai':
          return await this.callOpenAI(messages, model, parameters);
        case 'anthropic':
          return await this.callAnthropic(messages, model, parameters);
        case 'google':
          return await this.callGemini(messages, model, parameters);
        case 'huggingface':
          return await this.callHuggingFace(messages, model, parameters);
        case 'cohere':
          return await this.callCohere(messages, model, parameters);
        case 'ollama':
          return await this.callOllama(messages, model, parameters);
        case 'groq':
          return await this.callGroq(messages, model, parameters);
        default:
          return this.generateMockResponse(messages, model, parameters);
      }
    } catch (error) {
      console.error('AI API Error:', error);
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async callOpenAI(
    messages: ChatMessage[],
    model: AIModel,
    parameters: AIParameters
  ): Promise<AIResponse> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const baseUrl = import.meta.env.VITE_OPENAI_BASE_URL;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model.id,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: parameters.temperature,
        max_tokens: parameters.maxTokens,
        top_p: parameters.topP,
        presence_penalty: parameters.presencePenalty,
        frequency_penalty: parameters.frequencyPenalty,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    return {
      success: true,
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      }
    };
  }

  private async callAnthropic(
    messages: ChatMessage[],
    model: AIModel,
    parameters: AIParameters
  ): Promise<AIResponse> {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const baseUrl = import.meta.env.VITE_ANTHROPIC_BASE_URL;

    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // Convert messages format for Anthropic
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model.id,
        messages: conversationMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        system: systemMessage?.content,
        max_tokens: parameters.maxTokens,
        temperature: parameters.temperature,
        top_p: parameters.topP,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API request failed');
    }

    const data = await response.json();
    return {
      success: true,
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      }
    };
  }

  private async callHuggingFace(
    messages: ChatMessage[],
    model: AIModel,
    parameters: AIParameters
  ): Promise<AIResponse> {
    const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
    const baseUrl = import.meta.env.VITE_HUGGINGFACE_BASE_URL;

    if (!apiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    // Format prompt for Hugging Face
    const prompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

    const response = await fetch(`${baseUrl}/${model.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature: parameters.temperature,
          max_new_tokens: parameters.maxTokens,
          top_p: parameters.topP,
          repetition_penalty: 1 + parameters.frequencyPenalty,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Hugging Face API request failed');
    }

    const data = await response.json();
    const generatedText = Array.isArray(data) ? data[0]?.generated_text || '' : data.generated_text || '';
    
    // Extract only the new response part
    const responseContent = generatedText.replace(prompt, '').trim();

    return {
      success: true,
      content: responseContent || 'No response generated',
    };
  }

  private async callOllama(
    messages: ChatMessage[],
    model: AIModel,
    parameters: AIParameters
  ): Promise<AIResponse> {
    const baseUrl = import.meta.env.VITE_OLLAMA_BASE_URL;

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.id,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: false,
        options: {
          temperature: parameters.temperature,
          num_predict: parameters.maxTokens,
          top_p: parameters.topP,
          repeat_penalty: 1 + parameters.frequencyPenalty,
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Ollama API request failed');
    }

    const data = await response.json();
    return {
      success: true,
      content: data.message?.content || 'No response generated',
    };
  }

  private async callGroq(
    messages: ChatMessage[],
    model: AIModel,
    parameters: AIParameters
  ): Promise<AIResponse> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    const baseUrl = import.meta.env.VITE_GROQ_BASE_URL;

    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model.id,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: parameters.temperature,
        max_tokens: parameters.maxTokens,
        top_p: parameters.topP,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Groq API request failed');
    }

    const data = await response.json();
    return {
      success: true,
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      }
    };
  }

  private async callGemini(
    messages: ChatMessage[],
    model: AIModel,
    parameters: AIParameters
  ): Promise<AIResponse> {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const baseUrl = import.meta.env.VITE_GOOGLE_BASE_URL;

    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    // Format for Gemini API
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(`${baseUrl}/models/${model.id}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: parameters.temperature,
          maxOutputTokens: parameters.maxTokens,
          topP: parameters.topP,
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Google Gemini API request failed');
    }

    const data = await response.json();
    return {
      success: true,
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated',
    };
  }

  private async callCohere(
    messages: ChatMessage[],
    model: AIModel,
    parameters: AIParameters
  ): Promise<AIResponse> {
    const apiKey = import.meta.env.VITE_COHERE_API_KEY;
    const baseUrl = import.meta.env.VITE_COHERE_BASE_URL;

    if (!apiKey) {
      throw new Error('Cohere API key not configured');
    }

    // Format conversation for Cohere
    const chatHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'CHATBOT' : 'USER',
      message: msg.content
    }));

    const lastMessage = messages[messages.length - 1];

    const response = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model.id,
        message: lastMessage.content,
        chat_history: chatHistory,
        temperature: parameters.temperature,
        max_tokens: parameters.maxTokens,
        p: parameters.topP,
      }),
    });

    if (!response.ok) {
      throw new Error('Cohere API request failed');
    }

    const data = await response.json();
    return {
      success: true,
      content: data.text || 'No response generated',
    };
  }

  private async generateMockResponse(
    messages: ChatMessage[],
    model: AIModel,
    parameters: AIParameters
  ): Promise<AIResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, this.mockDelay));

    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage?.content || '';

    const responses = [
      `Using ${model.name} with temperature ${parameters.temperature}: This is a simulated response demonstrating the enhanced AI interface capabilities. 

Your query: "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"

Enhanced features now include:
• Real AI API integration support for multiple providers
• Persistent conversation storage
• Advanced export/import capabilities
• File upload and processing
• Conversation management
• Token usage tracking
• Error handling and recovery

The interface maintains backward compatibility while adding professional-grade features for production use.`,

      `Response from ${model.name}: I've processed your request with the following enhanced capabilities:

**Query Analysis**: "${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}"
**Model Settings**: Temperature: ${parameters.temperature}, Max Tokens: ${parameters.maxTokens}

**New Features Available**:
1. **Multi-Provider Support** - OpenAI, Anthropic, Google, Hugging Face, Cohere, Ollama, Groq
2. **Persistent Storage** - Conversations and templates are now saved automatically
3. **Advanced Export** - Multiple formats including JSON, Markdown, and PDF
4. **File Processing** - Upload and analyze documents, images, and data files
5. **Conversation Management** - Create, organize, and search through chat history
6. **Token Tracking** - Monitor usage and costs across different providers

The enhanced interface is production-ready with enterprise-grade features while maintaining the intuitive user experience.`,

      `${model.name} Analysis Complete:

**Input Processing**: Successfully analyzed your prompt about "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}"
**Configuration**: Using optimized parameters (T: ${parameters.temperature}, Max: ${parameters.maxTokens})

**System Enhancements**:
✅ **API Integration** - Multiple AI providers configured
✅ **Data Persistence** - LocalStorage + IndexedDB support  
✅ **Export System** - Comprehensive conversation export
✅ **File Handling** - Upload and process various file types
✅ **Search & Filter** - Advanced conversation management
✅ **Performance** - Optimized rendering and caching
✅ **Accessibility** - WCAG compliant interface
✅ **Security** - Secure API key management

This mock response demonstrates the interface's ability to handle complex interactions while providing detailed feedback and maintaining context throughout the conversation.`
    ];

    return {
      success: true,
      content: responses[Math.floor(Math.random() * responses.length)],
      usage: {
        promptTokens: Math.floor(prompt.length / 4),
        completionTokens: Math.floor(Math.random() * 200) + 50,
        totalTokens: Math.floor(prompt.length / 4) + Math.floor(Math.random() * 200) + 50,
      }
    };
  }
}

export const aiService = new AIService();