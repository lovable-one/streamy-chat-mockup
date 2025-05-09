import React, { useState, useRef, useEffect } from "react";
import { useService, useWhileMounted } from "@rxfx/react";
import { UserMessage } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SuggestionCards } from "./SuggestionCards";
import { LoadingIndicator } from "./LoadingIndicator";
import { chatRxFxService, generateId } from "@/services/chat-service";
import { initialSuggestions, getSuggestionCards } from "@/services/suggestions";

export function Chat() {
  const { isActive, state: messages } = useService(chatRxFxService);

  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // we need separate steate ONLY becaue we are wishing to include
  // only the time before the first response as loading time - though
  // it is still active and 'loading'/streaming after that
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle loading state separate from Active
  useWhileMounted(() =>
    chatRxFxService.observe({
      started() {
        setIsLoading(true);
      },
      next() {
        setIsLoading(false);
      },
      finalized() {
        setIsLoading(false);
      },
    })
  );

  // Handle suggestions coming and going
  useWhileMounted(() =>
    chatRxFxService.observe({
      // finalized is: canceled|error|complete
      finalized() {
        setSuggestions(getSuggestionCards(messages));
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
    if (!isLoading) {
      handleSendMessage(content);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-24 space-y-4"
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
            isLoading={isActive}
            onStopResponse={handleStopResponse}
          />
        </div>
      </div>
    </div>
  );
}
