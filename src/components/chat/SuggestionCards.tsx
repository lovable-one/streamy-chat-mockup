
import React from "react";
import { SuggestionCard as SuggestionCardType } from "@/types/chat";
import { Card } from "@/components/ui/card";

interface SuggestionCardProps {
  suggestion: SuggestionCardType;
  onClick: (content: string) => void;
}

export function SuggestionCard({ suggestion, onClick }: SuggestionCardProps) {
  return (
    <Card
      className="p-3 cursor-pointer hover:bg-muted transition-colors flex flex-col gap-1 border border-border"
      onClick={() => onClick(suggestion.content)}
    >
      <h4 className="font-medium text-sm">{suggestion.title}</h4>
      <p className="text-xs text-muted-foreground line-clamp-2">{suggestion.content}</p>
    </Card>
  );
}

interface SuggestionCardsProps {
  suggestions: SuggestionCardType[];
  onSuggestionClick: (content: string) => void;
}

export function SuggestionCards({ suggestions, onSuggestionClick }: SuggestionCardsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onClick={onSuggestionClick}
        />
      ))}
    </div>
  );
}
