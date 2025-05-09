import React, { useState, useRef, useEffect } from "react";
import { UserMessage } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SuggestionCards } from "./SuggestionCards";
import {
  chatRxFxService,
  chatService,
  initialSuggestions,
  generateId,
} from "@/services/chat-service";
import { LoadingIndicator } from "./LoadingIndicator";
import { useService, useWhileMounted } from "@rxfx/react";

export function Chat() {
  const { isActive, state: messages } = useService(chatRxFxService);

  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // we need separate steate ONLY becaue we are wishing to include
  // only the time before the first response as loading time - though
  // it is still active and 'loading'/streaming after that
  const [isPending, setIsPending] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle pending state ("loading message")
  // separate from Active state - enabled cancel button
  useWhileMounted(() =>
    chatRxFxService.observe({
      started() {
        setIsPending(true);
      },
      next() {
        setIsPending(false);
      },
      finalized: () => {
        setIsPending(false);
      },
    })
  );

  // Handle suggestions coming and going
  useWhileMounted(() =>
    chatRxFxService.observe({
      finalized() {
        console.log("Another one bites the dust!");
        setSuggestions(chatService.getSuggestionCards(messages));
      },
      request() {
        setSuggestions([]);
      },
    })
  );

  const handleSendMessage = (content: string) => {
    const userMessage: UserMessage = {
      id: generateId(),
      content,
      role: "user",
      createdAt: new Date(),
    };
    chatRxFxService.request(userMessage);
  };

  const handleStopResponse = () => {
    chatRxFxService.cancelCurrent();
  };

  const handleSuggestionClick = (content: string) => {
    if (!isPending) {
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
              Ask me anything and I'll do my best to help you. Try one of the
              suggestions below to get started.
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
            {isPending && (
              <div className="flex justify-start ml-12">
                <LoadingIndicator />
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t p-4">
        {messages.length > 0 && !isPending && (
          <SuggestionCards
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
          />
        )}
        <div className="max-w-2xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isActive}
            onStopResponse={handleStopResponse}
          />
        </div>
      </div>
    </div>
  );
}
