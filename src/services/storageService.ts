import { ChatMessage, PromptTemplate, AIParameters, AIModel } from '@/contexts/AIContext';

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model?: string;
  totalTokens?: number;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  selectedModel: AIModel | null;
  parameters: AIParameters;
  autoSave: boolean;
  autoSaveInterval: number;
}

class StorageService {
  private readonly enabled = import.meta.env.VITE_ENABLE_LOCAL_STORAGE === 'true';
  private readonly autoSaveInterval = parseInt(import.meta.env.VITE_AUTO_SAVE_INTERVAL || '30000');

  // Conversations
  saveConversation(conversation: Conversation): void {
    if (!this.enabled) return;

    try {
      const conversations = this.getConversations();
      const existingIndex = conversations.findIndex(c => c.id === conversation.id);

      if (existingIndex >= 0) {
        conversations[existingIndex] = {
          ...conversation,
          updatedAt: new Date()
        };
      } else {
        conversations.unshift({
          ...conversation,
          createdAt: conversation.createdAt || new Date(),
          updatedAt: new Date()
        });
      }

      localStorage.setItem('ai-interface-conversations', JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  getConversations(): Conversation[] {
    if (!this.enabled) return [];

    try {
      const stored = localStorage.getItem('ai-interface-conversations');
      if (!stored) return [];

      const conversations = JSON.parse(stored);
      return conversations.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  }

  deleteConversation(id: string): void {
    if (!this.enabled) return;

    try {
      const conversations = this.getConversations().filter(c => c.id !== id);
      localStorage.setItem('ai-interface-conversations', JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }

  getConversation(id: string): Conversation | null {
    return this.getConversations().find(c => c.id === id) || null;
  }

  // Templates
  saveTemplate(template: PromptTemplate): void {
    if (!this.enabled) return;

    try {
      const templates = this.getTemplates();
      const existingIndex = templates.findIndex(t => t.id === template.id);

      if (existingIndex >= 0) {
        templates[existingIndex] = template;
      } else {
        templates.push(template);
      }

      localStorage.setItem('ai-interface-templates', JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  }

  getTemplates(): PromptTemplate[] {
    if (!this.enabled) return [];

    try {
      const stored = localStorage.getItem('ai-interface-templates');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load templates:', error);
      return [];
    }
  }

  deleteTemplate(id: string): void {
    if (!this.enabled) return;

    try {
      const templates = this.getTemplates().filter(t => t.id !== id);
      localStorage.setItem('ai-interface-templates', JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  }

  // App Settings
  saveSettings(settings: Partial<AppSettings>): void {
    if (!this.enabled) return;

    try {
      const currentSettings = this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      localStorage.setItem('ai-interface-settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  getSettings(): AppSettings {
    const defaultSettings: AppSettings = {
      theme: 'light',
      selectedModel: null,
      parameters: {
        temperature: 0.7,
        maxTokens: 2048,
        topP: 1.0,
        presencePenalty: 0,
        frequencyPenalty: 0
      },
      autoSave: true,
      autoSaveInterval: this.autoSaveInterval
    };

    if (!this.enabled) return defaultSettings;

    try {
      const stored = localStorage.getItem('ai-interface-settings');
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return defaultSettings;
    }
  }

  // Search and filter
  searchConversations(query: string): Conversation[] {
    const conversations = this.getConversations();
    const lowerQuery = query.toLowerCase();

    return conversations.filter(conv =>
      conv.title.toLowerCase().includes(lowerQuery) ||
      conv.messages.some(msg => 
        msg.content.toLowerCase().includes(lowerQuery)
      )
    );
  }

  getConversationsByModel(model: string): Conversation[] {
    return this.getConversations().filter(conv => conv.model === model);
  }

  getConversationsByDateRange(startDate: Date, endDate: Date): Conversation[] {
    return this.getConversations().filter(conv =>
      conv.createdAt >= startDate && conv.createdAt <= endDate
    );
  }

  // Export functionality
  exportConversation(id: string, format: 'json' | 'markdown' | 'txt' = 'json'): string {
    const conversation = this.getConversation(id);
    if (!conversation) throw new Error('Conversation not found');

    switch (format) {
      case 'json':
        return JSON.stringify(conversation, null, 2);
      
      case 'markdown':
        return this.conversationToMarkdown(conversation);
      
      case 'txt':
        return this.conversationToText(conversation);
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  exportAllConversations(format: 'json' | 'markdown' | 'txt' = 'json'): string {
    const conversations = this.getConversations();
    
    if (format === 'json') {
      return JSON.stringify(conversations, null, 2);
    }

    return conversations
      .map(conv => this.exportConversation(conv.id, format))
      .join('\n\n' + '='.repeat(50) + '\n\n');
  }

  private conversationToMarkdown(conversation: Conversation): string {
    const header = `# ${conversation.title}\n\n`;
    const metadata = `**Created:** ${conversation.createdAt.toLocaleString()}\n`;
    const modelInfo = conversation.model ? `**Model:** ${conversation.model}\n` : '';
    const tokenInfo = conversation.totalTokens ? `**Total Tokens:** ${conversation.totalTokens}\n` : '';
    
    const messages = conversation.messages
      .map(msg => {
        const role = msg.role === 'user' ? '👤 **You**' : '🤖 **Assistant**';
        const timestamp = msg.timestamp.toLocaleTimeString();
        return `## ${role} *(${timestamp})*\n\n${msg.content}\n`;
      })
      .join('\n---\n\n');

    return `${header}${metadata}${modelInfo}${tokenInfo}\n---\n\n${messages}`;
  }

  private conversationToText(conversation: Conversation): string {
    const header = `${conversation.title}\n${'='.repeat(conversation.title.length)}\n\n`;
    const metadata = `Created: ${conversation.createdAt.toLocaleString()}\n`;
    const modelInfo = conversation.model ? `Model: ${conversation.model}\n` : '';
    const tokenInfo = conversation.totalTokens ? `Total Tokens: ${conversation.totalTokens}\n` : '';
    
    const messages = conversation.messages
      .map(msg => {
        const role = msg.role === 'user' ? 'You' : 'Assistant';
        const timestamp = msg.timestamp.toLocaleTimeString();
        return `[${timestamp}] ${role}:\n${msg.content}\n`;
      })
      .join('\n' + '-'.repeat(40) + '\n\n');

    return `${header}${metadata}${modelInfo}${tokenInfo}\n${'-'.repeat(40)}\n\n${messages}`;
  }

  // Import functionality
  importConversations(data: string, format: 'json' = 'json'): boolean {
    try {
      if (format === 'json') {
        const parsed = JSON.parse(data);
        const conversations = Array.isArray(parsed) ? parsed : [parsed];
        
        conversations.forEach((conv: any) => {
          const conversation: Conversation = {
            id: conv.id || Date.now().toString(),
            title: conv.title || 'Imported Conversation',
            messages: conv.messages || [],
            createdAt: conv.createdAt ? new Date(conv.createdAt) : new Date(),
            updatedAt: conv.updatedAt ? new Date(conv.updatedAt) : new Date(),
            model: conv.model,
            totalTokens: conv.totalTokens
          };
          this.saveConversation(conversation);
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import conversations:', error);
      return false;
    }
  }

  // Cleanup and maintenance
  cleanupOldConversations(daysToKeep: number = 30): number {
    if (!this.enabled) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const conversations = this.getConversations();
    const toKeep = conversations.filter(conv => conv.updatedAt > cutoffDate);
    const removedCount = conversations.length - toKeep.length;

    if (removedCount > 0) {
      localStorage.setItem('ai-interface-conversations', JSON.stringify(toKeep));
    }

    return removedCount;
  }

  getStorageSize(): { conversations: number; templates: number; settings: number; total: number } {
    if (!this.enabled) return { conversations: 0, templates: 0, settings: 0, total: 0 };

    try {
      const conversations = localStorage.getItem('ai-interface-conversations') || '';
      const templates = localStorage.getItem('ai-interface-templates') || '';
      const settings = localStorage.getItem('ai-interface-settings') || '';

      const conversationsSize = new Blob([conversations]).size;
      const templatesSize = new Blob([templates]).size;
      const settingsSize = new Blob([settings]).size;

      return {
        conversations: conversationsSize,
        templates: templatesSize,
        settings: settingsSize,
        total: conversationsSize + templatesSize + settingsSize
      };
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
      return { conversations: 0, templates: 0, settings: 0, total: 0 };
    }
  }

  clearAllData(): void {
    if (!this.enabled) return;

    try {
      localStorage.removeItem('ai-interface-conversations');
      localStorage.removeItem('ai-interface-templates');
      localStorage.removeItem('ai-interface-settings');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  // Auto-save functionality
  private autoSaveTimer: NodeJS.Timeout | null = null;

  startAutoSave(callback: () => void): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(callback, this.autoSaveInterval);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
}

export const storageService = new StorageService();