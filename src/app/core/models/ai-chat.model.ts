export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  caseId?: string;
  attachments?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  context?: ChatContext;
}

export interface ChatContext {
  caseId?: string;
  clientId?: string;
  documentIds?: string[];
}

export interface AIChatRequest {
  message: string;
  sessionId?: string;
  context?: ChatContext;
}

export interface AIChatResponse {
  message: string;
  sessionId: string;
  suggestions?: string[];
}
