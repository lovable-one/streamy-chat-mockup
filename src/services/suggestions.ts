import { Message, SuggestionCard } from "../types/chat";

// Initial suggestion cards
export const initialSuggestions: SuggestionCard[] = [
  {
    id: "1",
    title: "Capabilities",
    content: "What can you do?",
  },
  {
    id: "2",
    title: "Humor",
    content: "Tell me a joke",
  },
  {
    id: "3",
    title: "Creativity",
    content: "Write a short poem about technology",
  },
];

// Additional suggestion cards based on conversation
export const followUpSuggestions: SuggestionCard[] = [
  {
    id: "4",
    title: "AI Explainer",
    content: "Explain how AI works",
  },
  {
    id: "5",
    title: "Language Learning",
    content: "Help me learn French",
  },
  {
    id: "6",
    title: "Creative",
    content: "Write a short story about an adventure",
  },
];

// Method to get relevant suggestion cards based on conversation
export function getSuggestionCards(messages: Message[]): SuggestionCard[] {
  // console.log("computing suggestions from ", messages);
  // In a real app, we would analyze the conversation and provide relevant suggestions
  // For this mock, we'll return initial suggestions for new conversations
  // and follow-up suggestions for existing conversations
  return messages.length <= 1 ? initialSuggestions : followUpSuggestions;
}
