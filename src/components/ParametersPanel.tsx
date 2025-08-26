import React from 'react';
import { Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAI } from '@/contexts/AIContext';

export const ParametersPanel: React.FC = () => {
  const { parameters, updateParameters } = useAI();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <TooltipProvider>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-card hover:bg-gradient-secondary border-border/50 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <span className="font-medium">Parameters</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {isOpen ? 'Hide' : 'Show'}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4 animate-fade-in">
          <div className="bg-card rounded-lg border border-border/50 p-4 space-y-6">
            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="temperature" className="text-sm font-medium">
                    Temperature
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Controls randomness. Lower values make the output more focused and deterministic.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {parameters.temperature}
                </span>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={2}
                step={0.1}
                value={[parameters.temperature]}
                onValueChange={([value]) => updateParameters({ temperature: value })}
                className="w-full"
              />
            </div>

            {/* Max Tokens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="maxTokens" className="text-sm font-medium">
                    Max Tokens
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Maximum number of tokens to generate in the response.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {parameters.maxTokens}
                </span>
              </div>
              <Slider
                id="maxTokens"
                min={1}
                max={4096}
                step={1}
                value={[parameters.maxTokens]}
                onValueChange={([value]) => updateParameters({ maxTokens: value })}
                className="w-full"
              />
            </div>

            {/* Top P */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="topP" className="text-sm font-medium">
                    Top P
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Alternative to temperature. Controls diversity by considering only tokens with top cumulative probability.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {parameters.topP}
                </span>
              </div>
              <Slider
                id="topP"
                min={0}
                max={1}
                step={0.01}
                value={[parameters.topP]}
                onValueChange={([value]) => updateParameters({ topP: value })}
                className="w-full"
              />
            </div>

            {/* Presence Penalty */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="presencePenalty" className="text-sm font-medium">
                    Presence Penalty
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Reduces likelihood of repeating topics. Positive values encourage new topics.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {parameters.presencePenalty}
                </span>
              </div>
              <Slider
                id="presencePenalty"
                min={-2}
                max={2}
                step={0.1}
                value={[parameters.presencePenalty]}
                onValueChange={([value]) => updateParameters({ presencePenalty: value })}
                className="w-full"
              />
            </div>

            {/* Frequency Penalty */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="frequencyPenalty" className="text-sm font-medium">
                    Frequency Penalty
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Reduces likelihood of repeating the same line. Positive values encourage variety.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {parameters.frequencyPenalty}
                </span>
              </div>
              <Slider
                id="frequencyPenalty"
                min={-2}
                max={2}
                step={0.1}
                value={[parameters.frequencyPenalty]}
                onValueChange={([value]) => updateParameters({ frequencyPenalty: value })}
                className="w-full"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </TooltipProvider>
  );
};