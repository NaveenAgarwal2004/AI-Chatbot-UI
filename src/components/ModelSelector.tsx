import React from 'react';
import { Check, ChevronDown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAI } from '@/contexts/AIContext';

export const ModelSelector: React.FC = () => {
  const { models, selectedModel, setSelectedModel } = useAI();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between bg-card hover:bg-gradient-secondary border-border/50 transition-all duration-200 hover:shadow-md"
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <div className="text-left">
              <div className="font-medium text-sm">
                {selectedModel?.name || 'Select Model'}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedModel?.provider}
              </div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-popover border-border/50 shadow-lg">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => setSelectedModel(model)}
            className="flex items-start gap-3 p-3 cursor-pointer hover:bg-secondary/50 focus:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center justify-center w-5 h-5 mt-0.5">
              {selectedModel?.id === model.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{model.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {model.provider}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {model.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};