import React, { useState, FormEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { LoaderCircle, Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onStopResponse: () => void;
}

export function ChatInput({
  onSendMessage,
  isLoading,
  onStopResponse,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "inherit";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSendMessage(input.trim());
    setInput("");
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col border border-input rounded-md shadow-sm bg-background p-2 focus-within:ring-1 focus-within:ring-ring focus-within:border-input"
    >
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className={cn(
          "min-h-[60px] max-h-[200px] resize-none border-0 focus-visible:ring-0 p-2 pr-16",
          isLoading && "opacity-70"
        )}
        disabled={isLoading}
      />
      <div className="absolute right-3 bottom-3 flex items-center gap-2">
        {isLoading ? (
          <Button
            type="button"
            onClick={onStopResponse}
            variant="destructive"
            size="sm"
            className="rounded-full h-8 w-8 p-0"
          >
            <span className="sr-only">Stop generating</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              <path d="M9 10v4h6v-4z" />
            </svg>
          </Button>
        ) : (
          <Button
            type="submit"
            size="sm"
            className={cn(
              "rounded-full h-8 w-8 p-0 bg-bot hover:bg-bot-dark",
              !input.trim() && "opacity-50 cursor-not-allowed"
            )}
            disabled={!input.trim()}
          >
            <span className="sr-only">Send message</span>
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
