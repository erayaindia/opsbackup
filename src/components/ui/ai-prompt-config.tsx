import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Wand2,
  FileText,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { aiService } from '@/services/aiService';

interface AIPromptConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AIPromptConfig: React.FC<AIPromptConfigProps> = ({
  open,
  onOpenChange
}) => {
  const [config, setConfig] = useState<any>(null);
  const [titlePrompt, setTitlePrompt] = useState('');
  const [descriptionPrompt, setDescriptionPrompt] = useState('');
  const [styles, setStyles] = useState<any[]>([]);
  const [newStyleName, setNewStyleName] = useState('');
  const [newStyleKey, setNewStyleKey] = useState('');
  const [newStyleDescription, setNewStyleDescription] = useState('');
  const [newStyleInstruction, setNewStyleInstruction] = useState('');
  const [showAddStyle, setShowAddStyle] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const currentConfig = aiService.getConfig();
      setConfig(currentConfig);
      setTitlePrompt(currentConfig.titlePrompt);
      setDescriptionPrompt(currentConfig.descriptionPrompt);
      setStyles([...currentConfig.styles]);
    }
  }, [open]);

  const handleSaveConfig = () => {
    const newConfig = {
      titlePrompt,
      descriptionPrompt,
      styles
    };

    aiService.updateConfig(newConfig);

    toast({
      title: "Configuration Saved",
      description: "AI prompt settings have been updated successfully!",
    });

    onOpenChange(false);
  };

  const handleAddStyle = () => {
    if (!newStyleName || !newStyleKey || !newStyleDescription || !newStyleInstruction) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields for the new style.",
        variant: "destructive",
      });
      return;
    }

    const newStyle = {
      name: newStyleName,
      key: newStyleKey.toLowerCase().replace(/\s+/g, '_'),
      description: newStyleDescription,
      instruction: newStyleInstruction
    };

    setStyles([...styles, newStyle]);
    setNewStyleName('');
    setNewStyleKey('');
    setNewStyleDescription('');
    setNewStyleInstruction('');
    setShowAddStyle(false);

    toast({
      title: "Style Added",
      description: `"${newStyleName}" style has been added successfully!`,
    });
  };

  const handleRemoveStyle = (index: number) => {
    if (styles.length <= 2) {
      toast({
        title: "Cannot Remove",
        description: "You must have at least 2 styles configured.",
        variant: "destructive",
      });
      return;
    }

    const removedStyle = styles[index];
    setStyles(styles.filter((_, i) => i !== index));

    toast({
      title: "Style Removed",
      description: `"${removedStyle.name}" style has been removed.`,
    });
  };

  const handleResetToDefaults = () => {
    setTitlePrompt('You are an expert project manager helping to improve task titles. Make them clear, actionable, and professional.');
    setDescriptionPrompt('You are an expert project manager helping to write better task descriptions. Focus on clarity, actionable steps, and business value.');
    setStyles([
      {
        name: 'Professional',
        key: 'professional',
        description: 'Professional and structured',
        instruction: 'Make it sound professional and structured with proper business language'
      },
      {
        name: 'Action-Oriented',
        key: 'action_oriented',
        description: 'Action-focused and clear',
        instruction: 'Start with an action verb and be very clear about what needs to be done'
      },
      {
        name: 'Concise',
        key: 'concise',
        description: 'Short and to the point',
        instruction: 'Make it short and to the point, removing unnecessary words'
      },
      {
        name: 'Detailed',
        key: 'detailed',
        description: 'Comprehensive and detailed',
        instruction: 'Add more context, requirements, and specificity'
      }
    ]);

    toast({
      title: "Reset to Defaults",
      description: "Configuration has been reset to default settings.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Prompt Configuration
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="prompts" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prompts">Main Prompts</TabsTrigger>
            <TabsTrigger value="styles">Rephrasing Styles</TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Title Prompt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label htmlFor="titlePrompt">
                  Main instruction for AI when rephrasing task titles
                </Label>
                <Textarea
                  id="titlePrompt"
                  value={titlePrompt}
                  onChange={(e) => setTitlePrompt(e.target.value)}
                  placeholder="Enter your custom prompt for title generation..."
                  className="min-h-[100px]"
                />
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 <strong>Tip:</strong> This sets the AI's personality and approach. Be specific about what kind of titles you want.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Description Prompt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label htmlFor="descriptionPrompt">
                  Main instruction for AI when rephrasing task descriptions
                </Label>
                <Textarea
                  id="descriptionPrompt"
                  value={descriptionPrompt}
                  onChange={(e) => setDescriptionPrompt(e.target.value)}
                  placeholder="Enter your custom prompt for description generation..."
                  className="min-h-[100px]"
                />
                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    💡 <strong>Tip:</strong> This controls how the AI writes descriptions. Mention if you want specific formats, tone, or structure.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="styles" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Rephrasing Styles ({styles.length})</h3>
              <Button
                onClick={() => setShowAddStyle(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-3 w-3" />
                Add Style
              </Button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {styles.map((style, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{style.name}</Badge>
                          <span className="text-xs text-muted-foreground">Key: {style.key}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{style.description}</p>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-xs">
                          <strong>Instruction:</strong> {style.instruction}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStyle(index)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {showAddStyle && (
              <Card className="border-dashed border-2">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-medium">Add New Style</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="styleName">Style Name</Label>
                      <Input
                        id="styleName"
                        value={newStyleName}
                        onChange={(e) => setNewStyleName(e.target.value)}
                        placeholder="e.g., Technical"
                      />
                    </div>
                    <div>
                      <Label htmlFor="styleKey">Key (for API)</Label>
                      <Input
                        id="styleKey"
                        value={newStyleKey}
                        onChange={(e) => setNewStyleKey(e.target.value)}
                        placeholder="e.g., technical"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="styleDescription">Description</Label>
                    <Input
                      id="styleDescription"
                      value={newStyleDescription}
                      onChange={(e) => setNewStyleDescription(e.target.value)}
                      placeholder="e.g., Technical and precise"
                    />
                  </div>
                  <div>
                    <Label htmlFor="styleInstruction">AI Instruction</Label>
                    <Textarea
                      id="styleInstruction"
                      value={newStyleInstruction}
                      onChange={(e) => setNewStyleInstruction(e.target.value)}
                      placeholder="e.g., Make it technical with specific terminology and precise requirements"
                      className="min-h-[60px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddStyle} size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Style
                    </Button>
                    <Button
                      onClick={() => setShowAddStyle(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button
            onClick={handleResetToDefaults}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} className="flex items-center gap-2">
              <Save className="h-3 w-3" />
              Save Configuration
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};