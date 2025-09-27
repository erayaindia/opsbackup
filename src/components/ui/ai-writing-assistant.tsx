import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  FileText,
  Lightbulb,
  Target,
  Users,
  Clock,
  Settings
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { aiService } from '@/services/aiService';
import { AIPromptConfig } from '@/components/ui/ai-prompt-config';

interface AIWritingAssistantProps {
  originalText: string;
  onTextUpdate: (newText: string) => void;
  type: 'title' | 'description';
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  id: string;
  text: string;
  type: 'professional' | 'concise' | 'detailed' | 'action-oriented';
  description: string;
}

export const AIWritingAssistant: React.FC<AIWritingAssistantProps> = ({
  originalText,
  onTextUpdate,
  type,
  placeholder = "Enter text to rephrase...",
  className = ""
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const { toast } = useToast();

  // Real AI rephrasing function using DeepSeek API
  const generateSuggestions = async (text: string): Promise<Suggestion[]> => {
    if (!text.trim()) return [];

    try {
      if (type === 'title') {
        const response = await aiService.generateTaskTitleSuggestions(text);
        return response.suggestions;
      } else {
        const response = await aiService.generateTaskDescriptionSuggestions(text);
        return response.suggestions;
      }
    } catch (error) {
      console.error('AI service error:', error);
      // Show user-friendly error message
      toast({
        title: "AI Service Error",
        description: error instanceof Error ? error.message : "Failed to generate AI suggestions. Please try again.",
        variant: "destructive",
      });
      return [];
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!originalText.trim()) {
      toast({
        title: "Empty Text",
        description: "Please enter some text to rephrase.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const newSuggestions = await generateSuggestions(originalText);
      setSuggestions(newSuggestions);
      if (newSuggestions.length > 0) {
        toast({
          title: "Suggestions Generated",
          description: `${newSuggestions.length} AI-powered suggestions ready!`,
        });
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySuggestion = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion.id);
    onTextUpdate(suggestion.text);
    toast({
      title: "Text Updated",
      description: "AI suggestion applied successfully!",
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: "Copied",
      description: "Text copied to clipboard!",
    });
  };

  const getSuggestionIcon = (suggestionType: Suggestion['type']) => {
    switch (suggestionType) {
      case 'professional': return <Users className="h-4 w-4" />;
      case 'concise': return <Target className="h-4 w-4" />;
      case 'detailed': return <FileText className="h-4 w-4" />;
      case 'action-oriented': return <Clock className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSuggestionColor = (suggestionType: Suggestion['type']) => {
    switch (suggestionType) {
      case 'professional': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'concise': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'detailed': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'action-oriented': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* AI Generate Button */}
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          AI Writing Assistant
        </Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(true)}
            className="h-8 w-8 p-0"
            title="Configure AI prompts"
          >
            <Settings className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateSuggestions}
            disabled={isGenerating || !originalText.trim()}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                Rephrase with AI
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-muted-foreground">
                AI is crafting {type === 'title' ? 'title' : 'description'} suggestions...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && !isGenerating && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            AI Suggestions ({suggestions.length})
          </Label>

          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <Card
                key={suggestion.id}
                className={`transition-all duration-200 hover:shadow-md ${
                  selectedSuggestion === suggestion.id
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'hover:shadow-md'
                }`}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header with type badge */}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getSuggestionColor(suggestion.type)}`}
                      >
                        <span className="flex items-center gap-1">
                          {getSuggestionIcon(suggestion.type)}
                          {suggestion.type.replace('-', ' ')}
                        </span>
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {suggestion.description}
                      </span>
                    </div>

                    {/* Suggestion text */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                      <p className="text-sm leading-relaxed">
                        {suggestion.text}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleApplySuggestion(suggestion)}
                        className="flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Use This
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(suggestion.text, suggestion.id)}
                        className="flex items-center gap-1"
                      >
                        {copied === suggestion.id ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Generate More Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGenerateSuggestions}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 border border-dashed"
          >
            <RefreshCw className="h-3 w-3" />
            Generate More Suggestions
          </Button>
        </div>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && !isGenerating && originalText.trim() && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center space-y-2">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click "Rephrase with AI" to generate smart suggestions
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Prompt Configuration Dialog */}
      <AIPromptConfig
        open={showConfig}
        onOpenChange={setShowConfig}
      />
    </div>
  );
};