import React, { useState, useRef, useEffect } from "react";
import { useService, useWhileMounted } from "@rxfx/react";
import { UserMessage } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SuggestionCards } from "./SuggestionCards";
import { LoadingIndicator } from "./LoadingIndicator";
import { chatFx as chatService, generateId } from "@/services/chat-service";
import { initialSuggestions, getSuggestionCards } from "@/services/suggestions";

export function Chat() {
  const { isActive, state: messages } = useService(chatService);

  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // we need separate steate ONLY becaue we are wishing to include
  // only the time before the first response as loading time - though
  // it is still active and 'loading'/streaming after that
  const [isPending, setIsPending] = useState(false);

  // #region Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  // #endregion

  // #region Derive isPending state from time between `started` and `next` events
  useWhileMounted(() =>
    chatService.observe({
      started() {
        setIsPending(true);
      },
      next() {
        setIsPending(false);
      },
      finalized() {
        setIsPending(false);
      },
    })
  );
  //#endregion

  // #region Set and clear suggestions
  useWhileMounted(() =>
    chatService.observe({
      finalized() {
        const newSuggestions = getSuggestionCards(chatService.state.value);
        setSuggestions(newSuggestions);
      },
      request() {
        setSuggestions([]);
      },
    })
  );
  // #endregion

  // #region Handlers

  const handleSendMessage = (content: string) => {
    const userMessage: UserMessage = {
      id: generateId(),
      content,
      role: "user",
      createdAt: new Date(),
    };
    chatService.request(userMessage);
  };

  const handleStopResponse = () => {
    chatService.cancelCurrent();
  };

  const handleSuggestionClick = (content: string) => {
    if (!isPending) {
      handleSendMessage(content);
    }
  };
  //#endregion

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
