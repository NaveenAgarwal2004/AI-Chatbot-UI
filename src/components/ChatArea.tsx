import React, { useRef, useEffect, useState } from 'react';
import { 
  MessageSquare, 
  Trash2, 
  RefreshCw, 
  Upload, 
  X,
  Edit2,
  Copy,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Code,
  AlertCircle,
  Send,
  Paperclip,
  Mic,
  MicOff,
  ChevronDown,
  MoreHorizontal,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { ChatBubble } from './ChatBubble';
import { FileUploadZone } from './FileUploadZone';
import { useAI } from '@/contexts/AIContext';
import { useToast } from '@/hooks/use-toast';
import { fileService } from '@/services/fileService';

export const ChatArea: React.FC = () => {
  const { 
    messages, 
    clearMessages, 
    currentPrompt, 
    setCurrentPrompt, 
    selectedModel, 
    isLoading, 
    isGenerating,
    sendMessage,
    uploadedFiles,
    addFiles,
    removeFile,
    clearFiles,
    error,
    clearError,
    regenerateLastMessage,
    settings,
    getConversationSummary,
    conversations,
    currentConversationId,
    saveCurrentConversation,
    exportConversation
  } = useAI();
  
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentPrompt]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSendMessage = async () => {
    await sendMessage();
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    try {
      await addFiles(files);
      setShowFileUpload(false);
      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) processed successfully.`
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceRecord = () => {
    // Voice recording functionality would be implemented here
    setIsRecording(!isRecording);
    toast({
      title: isRecording ? "Recording stopped" : "Recording started",
      description: "Voice input feature coming soon!"
    });
  };

  const handleClearConversation = () => {
    if (messages.length === 0) return;
    
    clearMessages();
    clearFiles();
    toast({
      title: "Conversation cleared",
      description: "All messages have been removed."
    });
  };

  const handleExport = (format: 'json' | 'markdown' | 'txt') => {
    if (!currentConversationId) {
      // Save current conversation first
      saveCurrentConversation();
      if (conversations.length > 0) {
        exportConversation(conversations[0].id, format);
      }
    } else {
      exportConversation(currentConversationId, format);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (['js', 'ts', 'py', 'java', 'cpp', 'html', 'css'].includes(extension || '')) {
      return <Code className="h-4 w-4" />;
    } else {
      return <FileText className="h-4 w-4" />;
    }
  };

  const conversationSummary = getConversationSummary();

  return (
    <div 
      className="flex flex-col h-full relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">Chat</h2>
            {conversationSummary.totalMessages > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{conversationSummary.totalMessages} messages</span>
                {settings.showTokenCount && conversationSummary.totalTokens > 0 && (
                  <>
                    <span>•</span>
                    <span>{conversationSummary.totalTokens.toLocaleString()} tokens</span>
                  </>
                )}
                {selectedModel && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs py-0">
                      {selectedModel.name}
                    </Badge>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('markdown')}>
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('txt')}>
                    Export as Text
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={regenerateLastMessage}
                    disabled={isGenerating || messages.filter(m => m.role === 'assistant').length === 0}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Regenerate last response
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleClearConversation}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 pb-0">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearError}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm mb-4">
                  Begin chatting with {selectedModel?.name || 'an AI model'} or upload files to analyze.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowFileUpload(true)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload Files
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {messages.map((message, index) => (
              <div key={message.id} className="group hover:bg-muted/20 transition-colors">
                <ChatBubble 
                  message={message} 
                  showRegenerate={
                    message.role === 'assistant' && 
                    index === messages.length - 1 && 
                    !isGenerating
                  }
                  onRegenerate={regenerateLastMessage}
                />
              </div>
            ))}
            
            {isGenerating && (
              <div className="flex gap-3 p-4 bg-gradient-ai animate-fade-in">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">{selectedModel?.name}</span>
                    <span className="text-xs text-muted-foreground">is thinking...</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Uploaded Files Display */}
      {uploadedFiles.length > 0 && (
        <div className="border-t border-border/50 bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} attached
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFiles}
              className="h-6 text-xs"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center gap-2 bg-background border border-border/50 rounded-md px-2 py-1 text-xs"
              >
                {getFileIcon(file.name)}
                <span className="max-w-[100px] truncate">{file.name}</span>
                <span className="text-muted-foreground">
                  ({fileService.formatFileSize(file.size)})
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeFile(file.id)}
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={`p-4 border-t border-border/50 bg-card/50 backdrop-blur-sm ${dragOver ? 'bg-primary/10 border-primary/50' : ''}`}>
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary/50 rounded-lg z-10">
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium text-primary">Drop files here to upload</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              placeholder={
                uploadedFiles.length > 0 
                  ? "Ask a question about your files or leave empty for analysis..."
                  : `Message ${selectedModel?.name || 'AI'}...`
              }
              className="w-full min-h-[60px] max-h-32 p-3 pr-12 rounded-lg border border-border/50 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {/* File Upload Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 p-0"
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              {/* Voice Record Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceRecord}
                className={`h-8 w-8 p-0 ${isRecording ? 'text-red-500 bg-red-50' : ''}`}
                disabled={isLoading}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={(!currentPrompt.trim() && uploadedFiles.length === 0) || isLoading || !selectedModel}
            className="px-6 bg-gradient-primary hover:shadow-glow transition-all duration-200 self-end"
            size="lg"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Press Enter to send, Shift+Enter for new line</span>
            {selectedModel && (
              <span>Using {selectedModel.name}</span>
            )}
          </div>
          {currentPrompt.length > 0 && (
            <span>{currentPrompt.length} characters</span>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files) {
            handleFileUpload(e.target.files);
            e.target.value = ''; // Reset input
          }
        }}
        className="hidden"
        accept=".txt,.md,.json,.csv,.log,.js,.ts,.py,.java,.cpp,.html,.css,.xml,.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx"
      />

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUploadZone
          onFilesUploaded={handleFileUpload}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </div>
  );
};