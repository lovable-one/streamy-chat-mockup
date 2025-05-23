
import React, { useState, useRef, useEffect } from "react";
import { Message } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SuggestionCards } from "./SuggestionCards";
import { chatService, initialSuggestions } from "@/services/chat-service";
import { LoadingIndicator } from "./LoadingIndicator";
import { Subscription } from "rxjs";

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const responseSubscription = useRef<Subscription | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 15),
      content,
      role: "user",
      createdAt: new Date(),
      isComplete: true
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    // Create placeholder for assistant message
    const responseId = Math.random().toString(36).substring(2, 15);
    setCurrentResponseId(responseId);
    
    const assistantMessage: Message = {
      id: responseId,
      content: "",
      role: "assistant",
      createdAt: new Date(),
      isComplete: false
    };
    
    setMessages((prev) => [...prev, assistantMessage]);
    
    // Get streaming response
    responseSubscription.current = chatService.sendMessage(content).subscribe({
      next: (chunk) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === responseId
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      },
      complete: () => {
        setIsLoading(false);
        setCurrentResponseId(null);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === responseId ? { ...msg, isComplete: true } : msg
          )
        );
        
        // Update suggestions based on conversation
        setSuggestions(chatService.getSuggestionCards(messages));
      },
      error: (err) => {
        console.error("Error in chat response:", err);
        setIsLoading(false);
        setCurrentResponseId(null);
      }
    });
  };

  // Handle stopping response
  const handleStopResponse = () => {
    if (responseSubscription.current) {
      responseSubscription.current.unsubscribe();
    }
    
    chatService.stopResponse();
    
    if (currentResponseId) {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === currentResponseId ? { ...msg, isComplete: true } : msg
        )
      );
    }
    
    setIsLoading(false);
    setCurrentResponseId(null);
  };

  // Handle suggestion click
  const handleSuggestionClick = (content: string) => {
    if (!isLoading) {
      handleSendMessage(content);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold mb-2 text-bot">AI Assistant</h1>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
              Ask me anything and I'll do my best to help you. Try one of the suggestions below to get started.
            </p>
            <SuggestionCards
              suggestions={suggestions}
              onSuggestionClick={handleSuggestionClick}
            />
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start ml-12">
                <LoadingIndicator />
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="border-t p-4">
        {messages.length > 0 && !isLoading && (
          <SuggestionCards
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
          />
        )}
        <div className="max-w-2xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onStopResponse={handleStopResponse}
          />
        </div>
      </div>
    </div>
  );
}
