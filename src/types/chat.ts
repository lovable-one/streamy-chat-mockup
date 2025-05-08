
export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  createdAt: Date;
  isComplete?: boolean;
}

export interface SuggestionCard {
  id: string;
  title: string;
  content: string;
}
