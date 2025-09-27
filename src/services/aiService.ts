interface AIResponse {
  suggestions: Array<{
    id: string;
    text: string;
    type: 'professional' | 'concise' | 'detailed' | 'action-oriented' | 'custom';
    description: string;
  }>;
}

interface CustomPromptConfig {
  titlePrompt: string;
  descriptionPrompt: string;
  styles: Array<{
    name: string;
    key: string;
    description: string;
    instruction: string;
  }>;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class AIService {
  private static instance: AIService;
  private apiKey: string;
  private apiUrl: string;
  private customConfig: CustomPromptConfig;

  private constructor() {
    this.apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
    this.apiUrl = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';

    // Load custom prompts from environment or use defaults
    this.customConfig = {
      titlePrompt: import.meta.env.VITE_AI_TITLE_PROMPT || 'You are an expert project manager helping to improve task titles. Make them clear, actionable, and professional.',
      descriptionPrompt: import.meta.env.VITE_AI_DESCRIPTION_PROMPT || 'You are an expert project manager helping to write better task descriptions. Focus on clarity, actionable steps, and business value.',
      styles: [
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
      ]
    };
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Method to update custom configuration
  public updateConfig(config: Partial<CustomPromptConfig>): void {
    this.customConfig = { ...this.customConfig, ...config };
  }

  // Method to get current configuration
  public getConfig(): CustomPromptConfig {
    return { ...this.customConfig };
  }

  // Method to add custom style
  public addCustomStyle(style: { name: string; key: string; description: string; instruction: string }): void {
    this.customConfig.styles.push(style);
  }

  private async callDeepSeekAPI(messages: Array<{ role: string; content: string }>): Promise<string> {
    if (!this.apiKey || this.apiKey === 'YOUR_DEEPSEEK_API_KEY_HERE') {
      throw new Error('DeepSeek API key not configured. Please add your API key to the .env file.');
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
      }

      const data: DeepSeekResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response received from DeepSeek API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API call failed:', error);
      throw error;
    }
  }

  public async generateTaskTitleSuggestions(originalTitle: string): Promise<AIResponse> {
    // Build dynamic prompt using custom configuration
    const styleInstructions = this.customConfig.styles.map((style, index) =>
      `${index + 1}. ${style.name} - ${style.instruction}`
    ).join('\n');

    const jsonKeys = this.customConfig.styles.map(style => `"${style.key}": "your ${style.name.toLowerCase()} version here"`).join(',\n  ');

    const prompt = `${this.customConfig.titlePrompt}

Given this original task title: "${originalTitle}"

Please generate ${this.customConfig.styles.length} different versions of this title with the following styles:
${styleInstructions}

For each suggestion, provide ONLY the title text. Respond in this exact JSON format:
{
  ${jsonKeys}
}

Make sure the JSON is valid and contains no additional text or explanations.`;

    try {
      const response = await this.callDeepSeekAPI([
        { role: 'user', content: prompt }
      ]);

      // Parse the JSON response
      const parsed = JSON.parse(response);

      return {
        suggestions: this.customConfig.styles.map((style, index) => ({
          id: (index + 1).toString(),
          type: style.key as any,
          text: parsed[style.key] || originalTitle,
          description: style.description
        }))
      };
    } catch (error) {
      console.error('Failed to generate title suggestions:', error);
      // Fallback to local suggestions if API fails
      return this.generateFallbackTitleSuggestions(originalTitle);
    }
  }

  public async generateTaskDescriptionSuggestions(originalDescription: string): Promise<AIResponse> {
    // Build dynamic prompt using custom configuration
    const styleInstructions = this.customConfig.styles.map((style, index) =>
      `${index + 1}. ${style.name} - ${style.instruction}`
    ).join('\n');

    const jsonKeys = this.customConfig.styles.map(style => `"${style.key}": "your ${style.name.toLowerCase()} version here"`).join(',\n  ');

    const prompt = `${this.customConfig.descriptionPrompt}

Given this original task description: "${originalDescription}"

Please generate ${this.customConfig.styles.length} different versions of this description with the following styles:
${styleInstructions}

For each suggestion, provide the full description text. Respond in this exact JSON format:
{
  ${jsonKeys}
}

Make sure the JSON is valid and contains no additional text or explanations.`;

    try {
      const response = await this.callDeepSeekAPI([
        { role: 'user', content: prompt }
      ]);

      // Parse the JSON response
      const parsed = JSON.parse(response);

      return {
        suggestions: this.customConfig.styles.map((style, index) => ({
          id: (index + 1).toString(),
          type: style.key as any,
          text: parsed[style.key] || originalDescription,
          description: style.description
        }))
      };
    } catch (error) {
      console.error('Failed to generate description suggestions:', error);
      // Fallback to local suggestions if API fails
      return this.generateFallbackDescriptionSuggestions(originalDescription);
    }
  }

  private generateFallbackTitleSuggestions(originalTitle: string): AIResponse {
    return {
      suggestions: [
        {
          id: '1',
          type: 'professional',
          text: `${originalTitle.charAt(0).toUpperCase() + originalTitle.slice(1)} - Implementation Phase`,
          description: 'Professional and structured'
        },
        {
          id: '2',
          type: 'action-oriented',
          text: `Complete ${originalTitle.toLowerCase()}`,
          description: 'Action-focused and clear'
        },
        {
          id: '3',
          type: 'concise',
          text: originalTitle.split(' ').slice(0, 5).join(' ').replace(/[.,!?]$/, ''),
          description: 'Short and to the point'
        },
        {
          id: '4',
          type: 'detailed',
          text: `${originalTitle} - Strategic Planning and Execution`,
          description: 'Comprehensive and detailed'
        }
      ]
    };
  }

  private generateFallbackDescriptionSuggestions(originalDescription: string): AIResponse {
    const baseText = originalDescription.trim();
    return {
      suggestions: [
        {
          id: '1',
          type: 'professional',
          text: `This task involves ${baseText.toLowerCase()}. The objective is to ensure quality delivery while maintaining efficiency and meeting all project requirements. Please coordinate with relevant stakeholders as needed.`,
          description: 'Professional and comprehensive'
        },
        {
          id: '2',
          type: 'action-oriented',
          text: `Action Required: ${baseText}. Key steps: 1) Review requirements, 2) Execute the task, 3) Validate results, 4) Submit for review. Timeline and deliverables should be clearly defined.`,
          description: 'Step-by-step and actionable'
        },
        {
          id: '3',
          type: 'concise',
          text: `${baseText}. Expected outcome: [Define specific deliverable]. Please complete by the due date and notify upon completion.`,
          description: 'Brief and direct'
        },
        {
          id: '4',
          type: 'detailed',
          text: `Project Scope: ${baseText}. This task is critical for the overall project success. Requirements include thorough analysis, implementation of best practices, quality assurance, and documentation. Collaboration with team members is essential. Please provide regular updates on progress and flag any potential blockers early.`,
          description: 'Comprehensive with context'
        }
      ]
    };
  }
}

export const aiService = AIService.getInstance();