
import React from "react";
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  
  return (
    <div
      className={cn(
        "flex w-full items-start gap-4 py-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 rounded-full border overflow-hidden bg-bot">
          <span className="text-xs font-semibold text-white">AI</span>
        </Avatar>
      )}
      
      <Card
        className={cn(
          "max-w-[80%] min-w-[240px] p-4 shadow-sm",
          isUser
            ? "bg-user text-primary-foreground"
            : "bg-card border border-border"
        )}
      >
        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
      </Card>
      
      {isUser && (
        <Avatar className="h-8 w-8 rounded-full border overflow-hidden bg-user">
          <span className="text-xs font-semibold text-white">You</span>
        </Avatar>
      )}
    </div>
  );
}
