import React, { useState } from 'react';
import { Save, Upload, FileText, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAI } from '@/contexts/AIContext';
import { useToast } from '@/hooks/use-toast';

export const PromptEditor: React.FC = () => {
  const { 
    templates, 
    saveTemplate, 
    deleteTemplate, 
    currentPrompt, 
    setCurrentPrompt 
  } = useAI();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: 'General'
  });

  const categories = ['General', 'Development', 'Creative', 'Analysis', 'Research'];

  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the template.",
        variant: "destructive"
      });
      return;
    }

    if (!newTemplate.content.trim()) {
      toast({
        title: "Content required", 
        description: "Please enter content for the template.",
        variant: "destructive"
      });
      return;
    }

    saveTemplate(newTemplate);
    setNewTemplate({ name: '', content: '', category: 'General' });
    setIsDialogOpen(false);
    
    toast({
      title: "Template saved",
      description: `"${newTemplate.name}" has been saved to your templates.`
    });
  };

  const handleLoadTemplate = (template: any) => {
    setCurrentPrompt(template.content);
    toast({
      title: "Template loaded",
      description: `"${template.name}" has been loaded into the editor.`
    });
  };

  const handleDeleteTemplate = (template: any) => {
    deleteTemplate(template.id);
    toast({
      title: "Template deleted",
      description: `"${template.name}" has been removed.`,
      variant: "destructive"
    });
  };

  const groupedTemplates = categories.reduce((acc, category) => {
    acc[category] = templates.filter(t => t.category === category);
    return acc;
  }, {} as Record<string, typeof templates>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="prompt" className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Prompt Editor
        </Label>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Save Template</DialogTitle>
                <DialogDescription>
                  Save your current prompt as a reusable template.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Name</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Select
                    value={newTemplate.category}
                    onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="template-content">Content</Label>
                  <Textarea
                    id="template-content"
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter template content"
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate}>
                  <Plus className="h-3 w-3 mr-1" />
                  Save Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Textarea
        id="prompt"
        value={currentPrompt}
        onChange={(e) => setCurrentPrompt(e.target.value)}
        placeholder="Enter your prompt here... You can use templates from the library below or create your own."
        className="min-h-[200px] resize-none bg-card border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
      />

      {/* Templates Library */}
      {templates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Template Library</span>
          </div>
          
          <div className="space-y-3">
            {categories.map(category => {
              const categoryTemplates = groupedTemplates[category];
              if (categoryTemplates.length === 0) return null;
              
              return (
                <div key={category} className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                  <div className="grid gap-2">
                    {categoryTemplates.map(template => (
                      <div
                        key={template.id}
                        className="bg-card rounded-lg border border-border/50 p-3 hover:bg-gradient-secondary transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium mb-1">{template.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {template.content.slice(0, 100)}...
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLoadTemplate(template)}
                              className="h-7 w-7 p-0"
                            >
                              <Upload className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};