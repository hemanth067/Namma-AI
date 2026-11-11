export type LanguageType = 'tamil' | 'english' | 'tanglish' | 'mixed';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  detectedLanguage?: LanguageType;
  sources?: Array<{
    web?: { uri: string; title: string };
    maps?: { uri: string; title: string; placeAnswerSources?: any };
  }>;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface PromptStarter {
  id: string;
  category: 'tamil' | 'english' | 'tanglish' | 'mixed';
  categoryLabel: string;
  title: string;
  prompt: string;
  description: string;
}
