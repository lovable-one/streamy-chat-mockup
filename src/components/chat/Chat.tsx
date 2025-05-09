import React, { useState, useRef, useEffect } from "react";
import { AssistantMessage, Message, UserMessage } from "@/types/chat";
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
import { Subscription } from "rxjs";
import { useService } from "@rxfx/react";

export function Chat() {
  // XXX State could be kept by the Chat Service if @rxfx/service
  // const [messages, setMessages] = useState<Message[]>([]);
  // XXX Loading can also be inferred from the Service directly
  // const [isLoading, setIsLoading] = useState(false);

  const { isActive: isLoading, state: messages } = useService(chatRxFxService);

  // Tables are a good match! One diff is req/res have same id. Will break UI?
  console.table(messages);
  // console.table(rxfxMessages);

  // XXX currentResponseId is a hack derived variable not needed in a cleaner implementation
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(
    null
  );
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // XXX This subscription should be a detail of the ChatService
  const responseSubscription = useRef<Subscription | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // XXX This function can be basically only ChatService.send(content)
  // Handle sending a message
  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: UserMessage = {
      id: generateId(),
      content,
      role: "user",
      createdAt: new Date(),
    };

    // Request of the rxfx service as well, for now..
    chatRxFxService.request(userMessage);

    // // XXX ChatService detail
    // setMessages((prev) => [...prev, userMessage]);

    // // Create placeholder for assistant message
    // const responseId = Math.random().toString(36).substring(2, 15);
    // setCurrentResponseId(responseId);

    // const assistantMessage: AssistantMessage = {
    //   id: responseId,
    //   content: "",
    //   role: "assistant",
    //   createdAt: new Date(),
    //   isComplete: false,
    // };

    // setMessages((prev) => [...prev, assistantMessage]);

    //   // XXX all of this can become part of ChatService
    //   // Get streaming response
    //   responseSubscription.current = chatService.sendMessage(content).subscribe({
    //     next: (chunk) => {
    //       setMessages((prevMessages) =>
    //         prevMessages.map((msg) =>
    //           msg.id === responseId
    //             ? { ...msg, content: msg.content + chunk }
    //             : msg
    //         )
    //       );
    //     },
    //     complete: () => {
    //       setCurrentResponseId(null);
    //       setMessages((prevMessages) =>
    //         prevMessages.map((msg) =>
    //           msg.id === responseId ? { ...msg, isComplete: true } : msg
    //         )
    //       );

    //       // Upon completion of response, Update suggestions based on conversation
    //       setSuggestions(chatService.getSuggestionCards(messages));
    //     },
    //     error: (err) => {
    //       console.error("Error in chat response:", err);
    //       setCurrentResponseId(null);
    //     },
    //   });
  };

  // Upon completion of response, Update suggestions based on conversation
  // setSuggestions(chatService.getSuggestionCards(messages));

  // XXX More details of ChatService
  // Handle stopping response
  const handleStopResponse = () => {
    // if (responseSubscription.current) {
    //   responseSubscription.current.unsubscribe();
    // }

    chatRxFxService.cancelCurrent();
    // chatService.stopResponse();

    // if (currentResponseId) {
    //   setMessages((prevMessages) =>
    //     prevMessages.map((msg) =>
    //       msg.id === currentResponseId ? { ...msg, isComplete: true } : msg
    //     )
    //   );
    // }

    // XXX Loading state need not be manipulated outside of ChatService
    // setCurrentResponseId(null);
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
            // XXX need not pass in - this component could useService directly
            isLoading={isLoading}
            onStopResponse={handleStopResponse}
          />
        </div>
      </div>
    </div>
  );
}
