export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // Base64 or text data URL
  size?: number;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  grounding?: GroundingChunk[];
  queries?: string[];
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  systemInstruction?: string;
  webSearch?: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  badge: string;
  capabilities: string[];
  contextWindow: string;
}

export interface AppSettings {
  defaultModel: string;
  systemInstruction: string;
  temperature: number;
  webSearch: boolean;
  theme: 'dark' | 'light' | 'system';
  sendOnEnter: boolean;
  voice: string;
  thinkingLevel?: 'HIGH' | 'LOW' | 'MINIMAL';
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: 'code' | 'write' | 'analyze' | 'brainstorm';
  prompt: string;
  iconName: string;
}
