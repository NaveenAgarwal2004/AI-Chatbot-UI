import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { aiService } from '@/services/aiService';
import { storageService, Conversation } from '@/services/storageService';
import { fileService, ProcessedFile } from '@/services/fileService';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  category?: 'text' | 'code' | 'image' | 'multimodal';
  contextLength?: number;
  pricing?: {
    input: number;
    output: number;
  };
}

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  tags?: string[];
  createdAt?: Date;
  usageCount?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  files?: ProcessedFile[];
}

export interface AIParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
}

export interface ConversationSummary {
  totalMessages: number;
  totalTokens: number;
  modelsUsed: string[];
  duration: number;
  cost?: number;
}

interface AIContextType {
  // Models
  models: AIModel[];
  selectedModel: AIModel | null;
  setSelectedModel: (model: AIModel) => void;
  
  // Templates
  templates: PromptTemplate[];
  saveTemplate: (template: Omit<PromptTemplate, 'id'>) => void;
  deleteTemplate: (id: string) => void;
  loadTemplate: (id: string) => void;
  updateTemplate: (id: string, updates: Partial<PromptTemplate>) => void;
  
  // Current Conversation
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  editMessage: (id: string, content: string) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;
  regenerateLastMessage: () => Promise<void>;
  
  // Conversation Management
  conversations: Conversation[];
  currentConversationId: string | null;
  createConversation: (title?: string) => string;
  loadConversation: (id: string) => void;
  saveCurrentConversation: () => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  exportConversation: (id: string, format: 'json' | 'markdown' | 'txt') => void;
  searchConversations: (query: string) => Conversation[];
  
  // Parameters
  parameters: AIParameters;
  updateParameters: (params: Partial<AIParameters>) => void;
  resetParameters: () => void;
  
  // Current prompt
  currentPrompt: string;
  setCurrentPrompt: (prompt: string) => void;
  
  // File handling
  uploadedFiles: ProcessedFile[];
  addFiles: (files: FileList | File[]) => Promise<void>;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isGenerating: boolean;
  
  // Statistics
  getConversationSummary: (id?: string) => ConversationSummary;
  getTotalUsage: () => { conversations: number; messages: number; tokens: number };
  
  // Settings
  settings: {
    autoSave: boolean;
    autoTitle: boolean;
    showTokenCount: boolean;
    enableSound: boolean;
  };
  updateSettings: (settings: Partial<typeof settings>) => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
  
  // AI Response
  sendMessage: () => Promise<void>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

// Enhanced mock models with more providers including free options
const mockModels: AIModel[] = [
  // OpenAI Models
  {
    id: 'gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description: 'Most capable GPT-4 model with 128k context',
    category: 'multimodal',
    contextLength: 128000,
    pricing: { input: 0.01, output: 0.03 }
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'High-intelligence model for complex tasks',
    category: 'text',
    contextLength: 8192,
    pricing: { input: 0.03, output: 0.06 }
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Fast and efficient for most tasks',
    category: 'text',
    contextLength: 16385,
    pricing: { input: 0.001, output: 0.002 }
  },
  
  // Anthropic Models
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Most capable model for complex reasoning',
    category: 'multimodal',
    contextLength: 200000,
    pricing: { input: 0.015, output: 0.075 }
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced model for general use',
    category: 'multimodal',
    contextLength: 200000,
    pricing: { input: 0.003, output: 0.015 }
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Fast and affordable for simple tasks',
    category: 'text',
    contextLength: 200000,
    pricing: { input: 0.00025, output: 0.00125 }
  },

  // Google Models
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    description: 'Google\'s most capable multimodal model',
    category: 'multimodal',
    contextLength: 32768,
    pricing: { input: 0.0005, output: 0.0015 }
  },
  {
    id: 'gemini-pro-vision',
    name: 'Gemini Pro Vision',
    provider: 'Google',
    description: 'Multimodal model with vision capabilities',
    category: 'multimodal',
    contextLength: 16384,
    pricing: { input: 0.0005, output: 0.0015 }
  },

  // Free/Open Source Models via Hugging Face
  {
    id: 'microsoft/DialoGPT-large',
    name: 'DialoGPT Large',
    provider: 'HuggingFace',
    description: 'Free conversational AI model',
    category: 'text',
    contextLength: 1024,
    pricing: { input: 0, output: 0 }
  },
  {
    id: 'facebook/blenderbot-400M-distill',
    name: 'BlenderBot',
    provider: 'HuggingFace',
    description: 'Free open-domain chatbot',
    category: 'text',
    contextLength: 512,
    pricing: { input: 0, output: 0 }
  },

  // Cohere Models
  {
    id: 'command',
    name: 'Command',
    provider: 'Cohere',
    description: 'Cohere\'s flagship text generation model',
    category: 'text',
    contextLength: 4096,
    pricing: { input: 0.0015, output: 0.002 }
  },

  // Groq (Free tier available)
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    provider: 'Groq',
    description: 'Fast inference Mixtral model',
    category: 'text',
    contextLength: 32768,
    pricing: { input: 0.00027, output: 0.00027 }
  },
  {
    id: 'llama2-70b-4096',
    name: 'Llama 2 70B',
    provider: 'Groq',
    description: 'Meta\'s Llama 2 model with fast inference',
    category: 'text',
    contextLength: 4096,
    pricing: { input: 0.0007, output: 0.0008 }
  },

  // Ollama (Local/Free)
  {
    id: 'llama2',
    name: 'Llama 2 (Local)',
    provider: 'Ollama',
    description: 'Run Llama 2 locally with Ollama',
    category: 'text',
    contextLength: 4096,
    pricing: { input: 0, output: 0 }
  },
  {
    id: 'codellama',
    name: 'Code Llama (Local)',
    provider: 'Ollama',
    description: 'Code-focused model running locally',
    category: 'code',
    contextLength: 4096,
    pricing: { input: 0, output: 0 }
  },
  {
    id: 'mistral',
    name: 'Mistral (Local)',
    provider: 'Ollama',
    description: 'Efficient Mistral model running locally',
    category: 'text',
    contextLength: 8192,
    pricing: { input: 0, output: 0 }
  }
];

const defaultTemplates: PromptTemplate[] = [
  {
    id: '1',
    name: 'Code Review Assistant',
    content: `Please review the following code and provide comprehensive feedback on:

1. **Code Quality & Style**
   - Adherence to best practices
   - Code readability and maintainability
   - Naming conventions

2. **Performance & Optimization**
   - Potential performance bottlenecks
   - Memory usage concerns
   - Algorithmic improvements

3. **Security & Safety**
   - Security vulnerabilities
   - Input validation
   - Error handling

4. **Testing & Documentation**
   - Test coverage suggestions
   - Documentation completeness
   - Edge cases to consider

**Code:**
\`\`\`
{CODE_HERE}
\`\`\`

Please provide specific, actionable feedback with examples where appropriate.`,
    category: 'Development',
    tags: ['code', 'review', 'development'],
    createdAt: new Date(),
    usageCount: 0
  },
  {
    id: '2',
    name: 'Technical Documentation',
    content: `Create comprehensive technical documentation for the following:

**Topic:** {TOPIC}
**Audience:** {AUDIENCE_LEVEL} (beginner/intermediate/advanced)
**Format:** {FORMAT} (API docs/tutorial/guide/reference)

Please include:

1. **Overview**
   - Purpose and scope
   - Prerequisites
   - Key concepts

2. **Detailed Explanation**
   - Step-by-step instructions
   - Code examples
   - Best practices

3. **Reference Materials**
   - API reference (if applicable)
   - Configuration options
   - Troubleshooting guide

4. **Examples**
   - Real-world use cases
   - Sample implementations
   - Common patterns

Make the documentation clear, accurate, and easy to follow.`,
    category: 'Development',
    tags: ['documentation', 'technical', 'guide'],
    createdAt: new Date(),
    usageCount: 0
  },
  {
    id: '3',
    name: 'Data Analysis Expert',
    content: `Analyze the provided data and deliver a comprehensive analytical report:

**Data:** {DATA_DESCRIPTION}
**Analysis Type:** {ANALYSIS_TYPE} (descriptive/diagnostic/predictive/prescriptive)
**Business Context:** {BUSINESS_CONTEXT}

Please provide:

1. **Executive Summary**
   - Key findings and insights
   - Critical metrics
   - Main recommendations

2. **Data Overview**
   - Data quality assessment
   - Sample size and coverage
   - Limitations and assumptions

3. **Analytical Findings**
   - Statistical measures
   - Trends and patterns
   - Correlations and relationships
   - Outliers and anomalies

4. **Visualizations** (describe)
   - Recommended charts and graphs
   - Key data points to highlight
   - Dashboard suggestions

5. **Actionable Recommendations**
   - Strategic recommendations
   - Implementation steps
   - Success metrics
   - Risk considerations

Include statistical confidence levels where appropriate.`,
    category: 'Analysis',
    tags: ['data', 'analysis', 'statistics', 'business'],
    createdAt: new Date(),
    usageCount: 0
  },
  {
    id: '4',
    name: 'Creative Writing Mentor',
    content: `Help me create an engaging piece of creative writing:

**Genre:** {GENRE}
**Style:** {STYLE} (descriptive/narrative/dialogue-heavy/action-packed)
**Tone:** {TONE} (serious/humorous/mysterious/romantic/dark)
**Length:** {LENGTH} (short story/chapter/flash fiction/novella section)

**Elements to Include:**
- **Setting:** {SETTING}
- **Main Character(s):** {CHARACTERS}
- **Central Conflict:** {CONFLICT}
- **Theme:** {THEME}

**Specific Requirements:**
- Target audience: {AUDIENCE}
- Point of view: {POV} (first/second/third person)
- Special elements: {SPECIAL_ELEMENTS}

Please create a compelling piece that:
1. Hooks the reader from the beginning
2. Develops characters effectively
3. Builds tension and maintains engagement
4. Has a satisfying resolution or cliffhanger
5. Demonstrates strong prose and dialogue

Feel free to suggest improvements to the premise if needed.`,
    category: 'Creative',
    tags: ['writing', 'creative', 'story', 'fiction'],
    createdAt: new Date(),
    usageCount: 0
  },
  {
    id: '5',
    name: 'Learning Assistant',
    content: `I want to learn about: **{TOPIC}**

**My current knowledge level:** {LEVEL} (complete beginner/some basics/intermediate/advanced)
**Learning goal:** {GOAL} (overview/deep dive/practical application/exam prep)
**Preferred learning style:** {STYLE} (visual/auditory/hands-on/reading)
**Time available:** {TIME} (quick overview/detailed study/ongoing learning)

Please provide:

1. **Learning Roadmap**
   - Key concepts to master
   - Logical learning sequence
   - Estimated time for each section
   - Prerequisites and dependencies

2. **Core Content**
   - Fundamental principles
   - Key terminology and definitions
   - Important formulas/rules/patterns
   - Common misconceptions to avoid

3. **Practical Applications**
   - Real-world examples
   - Hands-on exercises
   - Project suggestions
   - Practice problems

4. **Learning Resources**
   - Recommended books/articles
   - Online courses and tutorials
   - Tools and software
   - Communities and forums

5. **Assessment Methods**
   - Self-check questions
   - Practice tests
   - Portfolio projects
   - Progress milestones

Adapt the explanation to my learning style and provide multiple ways to engage with the material.`,
    category: 'Education',
    tags: ['learning', 'education', 'tutorial', 'study'],
    createdAt: new Date(),
    usageCount: 0
  }
];

const defaultParameters: AIParameters = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1.0,
  presencePenalty: 0,
  frequencyPenalty: 0
};

interface AIProviderProps {
  children: React.ReactNode;
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  // Core state
  const [models] = useState<AIModel[]>(mockModels);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(mockModels[0]);
  const [templates, setTemplates] = useState<PromptTemplate[]>(defaultTemplates);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [parameters, setParameters] = useState<AIParameters>(defaultParameters);
  const [uploadedFiles, setUploadedFiles] = useState<ProcessedFile[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings
  const [settings, setSettings] = useState({
    autoSave: true,
    autoTitle: true,
    showTokenCount: true,
    enableSound: false
  });

  // Initialize data from storage on mount
  useEffect(() => {
    const storedConversations = storageService.getConversations();
    const storedTemplates = storageService.getTemplates();
    const storedSettings = storageService.getSettings();
    
    setConversations(storedConversations);
    if (storedTemplates.length > 0) {
      setTemplates([...defaultTemplates, ...storedTemplates]);
    }
    if (storedSettings.selectedModel) {
      const foundModel = models.find(m => m.id === storedSettings.selectedModel?.id);
      if (foundModel) setSelectedModel(foundModel);
    }
    setParameters(storedSettings.parameters);
    setSettings(prev => ({ ...prev, ...storedSettings }));
  }, [models]);

  // Auto-save current conversation
  useEffect(() => {
    if (settings.autoSave && currentConversationId && messages.length > 0) {
      const timer = setTimeout(() => {
        saveCurrentConversation();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [messages, currentConversationId, settings.autoSave]);

  // Template management
  const saveTemplate = useCallback((template: Omit<PromptTemplate, 'id'>) => {
    const newTemplate: PromptTemplate = {
      ...template,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      usageCount: 0
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    storageService.saveTemplate(newTemplate);
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    storageService.deleteTemplate(id);
  }, []);

  const loadTemplate = useCallback((id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      setCurrentPrompt(template.content);
      // Increment usage count
      setTemplates(prev => prev.map(t => 
        t.id === id ? { ...t, usageCount: (t.usageCount || 0) + 1 } : t
      ));
    }
  }, [templates]);

  const updateTemplate = useCallback((id: string, updates: Partial<PromptTemplate>) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
    const template = templates.find(t => t.id === id);
    if (template) {
      storageService.saveTemplate({ ...template, ...updates });
    }
  }, [templates]);

  // Message management
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Clear uploaded files after adding to message
    if (uploadedFiles.length > 0) {
      setUploadedFiles([]);
    }
  }, [uploadedFiles]);

  const editMessage = useCallback((id: string, content: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, content, timestamp: new Date() } : msg
    ));
  }, []);

  const deleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setUploadedFiles([]);
    setCurrentConversationId(null);
  }, []);

  const regenerateLastMessage = useCallback(async () => {
    if (messages.length < 2) return;

    const lastAssistantIndex = messages.findLastIndex(msg => msg.role === 'assistant');
    if (lastAssistantIndex === -1) return;

    // Remove the last assistant message
    const messagesWithoutLast = messages.slice(0, lastAssistantIndex);
    setMessages(messagesWithoutLast);

    // Regenerate response
    setIsGenerating(true);
    try {
      const response = await aiService.generateResponse(messagesWithoutLast, selectedModel!, parameters);
      
      if (response.success) {
        addMessage({
          role: 'assistant',
          content: response.content,
          model: selectedModel?.name,
          tokens: response.usage ? {
            prompt: response.usage.promptTokens,
            completion: response.usage.completionTokens,
            total: response.usage.totalTokens
          } : undefined
        });
      } else {
        setError(response.error || 'Failed to regenerate response');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  }, [messages, selectedModel, parameters, addMessage]);

  // Conversation management
  const createConversation = useCallback((title?: string): string => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const conversation: Conversation = {
      id,
      title: title || 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setConversations(prev => [conversation, ...prev]);
    setCurrentConversationId(id);
    setMessages([]);
    setUploadedFiles([]);
    
    return id;
  }, []);

  const loadConversation = useCallback((id: string) => {
    const conversation = conversations.find(c => c.id === id) || storageService.getConversation(id);
    if (conversation) {
      setCurrentConversationId(id);
      setMessages(conversation.messages);
      setUploadedFiles([]);
    }
  }, [conversations]);

  const saveCurrentConversation = useCallback(() => {
    if (!currentConversationId || messages.length === 0) return;

    const conversation = conversations.find(c => c.id === currentConversationId);
    if (conversation) {
      const updatedConversation: Conversation = {
        ...conversation,
        messages,
        updatedAt: new Date(),
        model: selectedModel?.name,
        totalTokens: messages.reduce((total, msg) => total + (msg.tokens?.total || 0), 0)
      };

      // Auto-generate title if needed
      if (settings.autoTitle && conversation.title === 'New Conversation' && messages.length >= 2) {
        const firstUserMessage = messages.find(m => m.role === 'user');
        if (firstUserMessage) {
          updatedConversation.title = firstUserMessage.content.slice(0, 50) + 
            (firstUserMessage.content.length > 50 ? '...' : '');
        }
      }

      setConversations(prev => prev.map(c => c.id === currentConversationId ? updatedConversation : c));
      storageService.saveConversation(updatedConversation);
    }
  }, [currentConversationId, conversations, messages, selectedModel, settings.autoTitle]);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    storageService.deleteConversation(id);
    
    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setMessages([]);
      setUploadedFiles([]);
    }
  }, [currentConversationId]);

  const renameConversation = useCallback((id: string, title: string) => {
    setConversations(prev => prev.map(c => 
      c.id === id ? { ...c, title, updatedAt: new Date() } : c
    ));
    
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      storageService.saveConversation({ ...conversation, title, updatedAt: new Date() });
    }
  }, [conversations]);

  const exportConversation = useCallback((id: string, format: 'json' | 'markdown' | 'txt') => {
    try {
      const content = storageService.exportConversation(id, format);
      const conversation = conversations.find(c => c.id === id) || storageService.getConversation(id);
      const filename = `${conversation?.title || 'conversation'}.${format}`;
      
      fileService.exportFile(content, filename, 
        format === 'json' ? 'application/json' : 
        format === 'markdown' ? 'text/markdown' : 'text/plain'
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Export failed');
    }
  }, [conversations]);

  const searchConversations = useCallback((query: string) => {
    return storageService.searchConversations(query);
  }, []);

  // Parameters
  const updateParameters = useCallback((params: Partial<AIParameters>) => {
    const newParams = { ...parameters, ...params };
    setParameters(newParams);
    storageService.saveSettings({ parameters: newParams });
  }, [parameters]);

  const resetParameters = useCallback(() => {
    setParameters(defaultParameters);
    storageService.saveSettings({ parameters: defaultParameters });
  }, []);

  // File handling
  const addFiles = useCallback(async (files: FileList | File[]) => {
    try {
      const processedFiles = await fileService.processMultipleFiles(files);
      setUploadedFiles(prev => [...prev, ...processedFiles]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'File upload failed');
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  // Statistics
  const getConversationSummary = useCallback((id?: string): ConversationSummary => {
    const targetId = id || currentConversationId;
    const conversation = conversations.find(c => c.id === targetId);
    
    if (!conversation) {
      return {
        totalMessages: messages.length,
        totalTokens: messages.reduce((sum, msg) => sum + (msg.tokens?.total || 0), 0),
        modelsUsed: Array.from(new Set(messages.map(msg => msg.model).filter(Boolean))),
        duration: messages.length > 1 ? 
          messages[messages.length - 1].timestamp.getTime() - messages[0].timestamp.getTime() : 0
      };
    }

    return {
      totalMessages: conversation.messages.length,
      totalTokens: conversation.totalTokens || 0,
      modelsUsed: Array.from(new Set(conversation.messages.map(msg => msg.model).filter(Boolean))),
      duration: conversation.messages.length > 1 ? 
        conversation.messages[conversation.messages.length - 1].timestamp.getTime() - 
        conversation.messages[0].timestamp.getTime() : 0
    };
  }, [conversations, currentConversationId, messages]);

  const getTotalUsage = useCallback(() => {
    const allConversations = storageService.getConversations();
    return {
      conversations: allConversations.length,
      messages: allConversations.reduce((sum, conv) => sum + conv.messages.length, 0),
      tokens: allConversations.reduce((sum, conv) => sum + (conv.totalTokens || 0), 0)
    };
  }, []);

  // Settings
  const updateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    storageService.saveSettings(updated);
  }, [settings]);

  // Error handling
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Main AI interaction
  const sendMessage = useCallback(async () => {
    if (!currentPrompt.trim() && uploadedFiles.length === 0) {
      setError('Please enter a message or upload files');
      return;
    }

    if (!selectedModel) {
      setError('Please select a model');
      return;
    }

    let messageContent = currentPrompt;
    
    // Add file context if files are uploaded
    if (uploadedFiles.length > 0) {
      const fileContext = fileService.generatePromptContext(uploadedFiles);
      messageContent = fileContext + (currentPrompt ? `\n\nUser Question: ${currentPrompt}` : '');
    }

    // Add user message
    addMessage({
      role: 'user',
      content: currentPrompt,
      model: selectedModel.name,
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined
    });

    // Clear prompt and start loading
    const userPrompt = messageContent;
    setCurrentPrompt('');
    setIsLoading(true);
    setIsGenerating(true);
    clearError();

    // Create conversation if none exists
    if (!currentConversationId) {
      createConversation();
    }

    try {
      const conversationMessages = [...messages, {
        id: 'temp',
        role: 'user' as const,
        content: userPrompt,
        timestamp: new Date()
      }];

      const response = await aiService.generateResponse(conversationMessages, selectedModel, parameters);
      
      if (response.success) {
        addMessage({
          role: 'assistant',
          content: response.content,
          model: selectedModel.name,
          tokens: response.usage ? {
            prompt: response.usage.promptTokens,
            completion: response.usage.completionTokens,
            total: response.usage.totalTokens
          } : undefined
        });

        // Play notification sound if enabled
        if (settings.enableSound) {
          // You can implement sound notification here
          console.log('🔔 Response received');
        }
      } else {
        setError(response.error || 'Failed to generate response');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      console.error('AI Service Error:', error);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  }, [currentPrompt, uploadedFiles, selectedModel, messages, parameters, settings, currentConversationId, addMessage, createConversation, clearError]);

  return (
    <AIContext.Provider value={{
      // Models
      models,
      selectedModel,
      setSelectedModel,
      
      // Templates
      templates,
      saveTemplate,
      deleteTemplate,
      loadTemplate,
      updateTemplate,
      
      // Current Conversation
      messages,
      addMessage,
      editMessage,
      deleteMessage,
      clearMessages,
      regenerateLastMessage,
      
      // Conversation Management
      conversations,
      currentConversationId,
      createConversation,
      loadConversation,
      saveCurrentConversation,
      deleteConversation,
      renameConversation,
      exportConversation,
      searchConversations,
      
      // Parameters
      parameters,
      updateParameters,
      resetParameters,
      
      // Current prompt
      currentPrompt,
      setCurrentPrompt,
      
      // File handling
      uploadedFiles,
      addFiles,
      removeFile,
      clearFiles,
      
      // Loading states
      isLoading,
      setIsLoading,
      isGenerating,
      
      // Statistics
      getConversationSummary,
      getTotalUsage,
      
      // Settings
      settings,
      updateSettings,
      
      // Error handling
      error,
      clearError,
      
      // AI Response
      sendMessage
    }}>
      {children}
    </AIContext.Provider>
  );
};