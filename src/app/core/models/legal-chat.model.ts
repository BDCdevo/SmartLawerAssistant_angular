/**
 * Models for Legal Chat Feature
 * Simple chat without predefined system prompts
 */

// Request model - only user content
export interface LegalChatRequest {
  content: string;
}

// Message in chat completion
export interface ChatMessage {
  role: string;
  content: string;
  reasoning_content: string | null;
  tool_calls: any | null;
}

// Choice in response
export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
  native_finish_reason: string;
}

// Usage statistics
export interface ChatUsage {
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens_details?: {
    reasoning_tokens: number;
  };
}

// Main chat completion data
export interface ChatCompletionData {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
  usage: ChatUsage;
}

// API Response wrapper
export interface LegalChatResponse {
  success: boolean;
  message: string;
  data: ChatCompletionData;
}

// Chat message for display in UI
export interface ChatMessageDisplay {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  isLoading?: boolean;
  error?: boolean;
}
