import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ThemeToggle } from './ThemeToggle';
import { ModelSelector } from './ModelSelector';
import { ParametersPanel } from './ParametersPanel';
import { PromptEditor } from './PromptEditor';
import { ChatArea } from './ChatArea';

export const AIInterface: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-primary text-white shadow-glow">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  AI Interface
                </h1>
                <p className="text-xs text-muted-foreground">
                  Advanced AI chat platform with customizable parameters
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-secondary border border-border/50">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium">Beta</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="space-y-6 h-full">
              {/* Model Selection */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <h3 className="text-sm font-semibold">Model & Settings</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ModelSelector />
                  <ParametersPanel />
                </CardContent>
              </Card>

              {/* Prompt Editor */}
              <Card className="border-border/50 shadow-sm flex-1">
                <CardHeader className="pb-3">
                  <h3 className="text-sm font-semibold">Prompt Editor</h3>
                </CardHeader>
                <CardContent>
                  <PromptEditor />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Main Area - Chat */}
          <div className="lg:col-span-8 xl:col-span-9">
            <Card className="border-border/50 shadow-sm h-full">
              <ChatArea />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};