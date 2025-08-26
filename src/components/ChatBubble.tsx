import React, { useState } from 'react';
import { 
  Copy, 
  Download, 
  User, 
  Bot, 
  Check, 
  Edit2, 
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Code,
  Eye,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/contexts/AIContext';
import { useAI } from '@/contexts/AIContext';
import { fileService } from '@/services/fileService';

interface ChatBubbleProps {
  message: ChatMessage;
  showRegenerate?: boolean;
  onRegenerate?: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  showRegenerate = false,
  onRegenerate
}) => {
  const { toast } = useToast();
  const { editMessage, deleteMessage, settings } = useAI();
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showFiles, setShowFiles] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard."
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    const timestamp = message.timestamp.toISOString().split('T')[0];
    const filename = `message-${message.role}-${timestamp}.json`;
    
    const exportData = {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      model: message.model,
      tokens: message.tokens,
      files: message.files?.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        uploadedAt: f.uploadedAt
      }))
    };
    
    fileService.exportJSON(exportData, filename);
    
    toast({
      title: "Downloaded!",
      description: "Message saved as JSON file."
    });
  };

  const handleEdit = () => {
    if (isEditing) {
      if (editContent.trim() !== message.content) {
        editMessage(message.id, editContent.trim());
        toast({
          title: "Message updated",
          description: "Your message has been edited."
        });
      }
      setIsEditing(false);
    } else {
      setIsEditing(true);
      setEditContent(message.content);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleDelete = () => {
    deleteMessage(message.id);
    toast({
      title: "Message deleted",
      description: "Message has been removed from the conversation.",
      variant: "destructive"
    });
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

  const formatContent = (content: string) => {
    // Basic formatting for code blocks and lists
    const lines = content.split('\n');
    const formatted = lines.map((line, index) => {
      // Code blocks
      if (line.startsWith('```')) {
        const language = line.slice(3).trim();
        return (
          <div key={index} className="bg-muted rounded px-2 py-1 text-xs font-mono">
            {language && <span className="text-primary">{language}</span>}
          </div>
        );
      }
      
      // Bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <div key={index}>
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </div>
        );
      }
      
      // List items
      if (line.match(/^[•\-*]\s/)) {
        return (
          <div key={index} className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>{line.replace(/^[•\-*]\s/, '')}</span>
          </div>
        );
      }
      
      // Numbered lists
      if (line.match(/^\d+\.\s/)) {
        return (
          <div key={index} className="flex items-start gap-2">
            <span className="text-primary font-medium">{line.match(/^\d+/)?.[0]}.</span>
            <span>{line.replace(/^\d+\.\s/, '')}</span>
          </div>
        );
      }
      
      return <div key={index}>{line}</div>;
    });
    
    return formatted;
  };

  const isUser = message.role === 'user';
  const hasFiles = message.files && message.files.length > 0;

  return (
    <div className={`flex gap-3 p-4 animate-fade-in ${
      isUser ? 'bg-transparent' : 'bg-gradient-ai'
    }`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isUser 
          ? 'bg-gradient-primary text-white' 
          : 'bg-primary/10 text-primary border border-primary/20'
      }`}>
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {isUser ? 'You' : (message.model || 'Assistant')}
            </span>
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString()}
            </span>
            {message.tokens && settings.showTokenCount && (
              <Badge variant="secondary" className="text-xs px-2 py-0">
                {message.tokens.total} tokens
              </Badge>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 w-7 p-0"
              title="Copy message"
            >
              {isCopied ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>

            {showRegenerate && onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                className="h-7 w-7 p-0"
                title="Regenerate response"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isUser && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit2 className="h-3 w-3 mr-2" />
                    {isEditing ? 'Save edit' : 'Edit message'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-3 w-3 mr-2" />
                  Download as JSON
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* File attachments */}
        {hasFiles && (
          <Collapsible open={showFiles} onOpenChange={setShowFiles}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-2 text-left">
                <div className="flex items-center gap-2">
                  {showFiles ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {message.files!.length} attached file{message.files!.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              {message.files!.map((file) => (
                <div key={file.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded border text-xs">
                  {getFileIcon(file.name)}
                  <span className="flex-1 font-medium">{file.name}</span>
                  <span className="text-muted-foreground">
                    ({fileService.formatFileSize(file.size)})
                  </span>
                  {file.preview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(file.preview, '_blank')}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Message content */}
        <div className={`prose prose-sm max-w-none ${
          isUser 
            ? 'text-foreground' 
            : 'text-ai-message-foreground'
        }`}>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px] resize-none"
                placeholder="Edit your message..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>
                  Save changes
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words space-y-2">
              {formatContent(message.content)}
            </div>
          )}
        </div>

        {/* Token usage details */}
        {message.tokens && settings.showTokenCount && !isUser && (
          <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
            <div className="flex items-center gap-4">
              <span>Input: {message.tokens.prompt} tokens</span>
              <span>Output: {message.tokens.completion} tokens</span>
              <span>Total: {message.tokens.total} tokens</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};