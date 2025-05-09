import { AssistantMessage, SuggestionCard, UserMessage } from "../types/chat";
import { Observable } from "rxjs";
import {
  createService,
  concat,
  after,
  randomizePreservingAverage,
  defaultBus,
} from "@rxfx/service";
import { produce } from "immer";

import { Message, Chunk } from "@/types/chat";

// Mock responses
const mockResponses: Record<string, string> = {
  default:
    "I'm an AI assistant created to help answer your questions and assist with various tasks. How can I help you today?",
  // "What can you do?":
  // "I can help you with a variety of tasks such as:\n\n- Answering questions on various topics\n- Providing creative content like stories or poems\n- Helping with problem-solving\n- Offering suggestions and recommendations\n- Explaining complex concepts in simple terms\n\nWhat would you like help with today?",
  "What can you do?": "I can help you with a variety of tasks",
  "Tell me a joke":
    "Why don't scientists trust atoms?\n\nBecause they make up everything! 😄",
  "Write a short poem about technology":
    "Digital dreams in silicon beds,\nWires like veins, electric threads.\nHuman and machine, a dance of light,\nFuture's whisper in the quiet night.\n\nConnected souls through glowing screens,\nInfinite power in binary means.\nTechnology's touch, a modern art,\nBinding mind with metal heart.",
  "Explain how AI works":
    "At a high level, AI works through these key principles:\n\n1. **Data Collection**: AI systems need large amounts of data to learn patterns\n\n2. **Training**: Using algorithms, the system analyzes this data to identify patterns and correlations\n\n3. **Model Building**: These patterns form a model that can make predictions or decisions\n\n4. **Inference**: The trained model can then process new inputs and generate outputs\n\nModern AI, especially deep learning, uses neural networks - computational structures inspired by the human brain. These networks consist of layers of nodes (neurons) that process information and adjust their connections through training.\n\nThe development of AI involves many specialized fields including machine learning, natural language processing, computer vision, and more.",
  "Help me learn French":
    "Bonjour! Learning French is a wonderful journey. Here are some essential phrases to get started:\n\n- Hello = Bonjour (bon-zhoor)\n- How are you? = Comment allez-vous? (koh-mahn tah-lay voo)\n- My name is... = Je m'appelle... (zhuh mah-pel)\n- Thank you = Merci (mehr-see)\n- Please = S'il vous plaît (seel voo play)\n- Yes/No = Oui/Non (wee/non)\n\nConsistent practice is key to learning any language. Try watching French films with subtitles, listening to French music, or using language learning apps for daily practice. Bonne chance! (Good luck!)",
};

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

// Helper function to generate UUID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

const WORDS_PER_CHUNK = 1;
const CHUNK_DELAY = 150;
const SPY_TO_CONSOLE = true;

defaultBus.reset();
void (SPY_TO_CONSOLE && defaultBus.spy(console.log));

export const chatRxFxService = createService<
  UserMessage,
  Chunk,
  Error,
  Message[]
>(
  "messages",
  // Handler/Effect/Response Observable
  (userMessage) => {
    const responseText =
      mockResponses[userMessage.content] || mockResponses["default"];
    const words = responseText.split(" ");
    const initialDelay =
      userMessage.content === "What can you do?" ? 3000 : 800;

    // Looks like:  ( after  )(  after  )( after)( after )
    //               --->word1----->word2-->word3--->word4...
    // and each chunk is tagged with the request it was for
    const wordStream = concat(
      ...words.map((word) => {
        return after(randomizePreservingAverage(CHUNK_DELAY), {
          requestId: userMessage.id,
          text: `${word} `,
        });
      })
    );

    return after(initialDelay, wordStream);
  },
  // Reducer
  (actions) =>
    produce((messages = [], event) => {
      if (actions.isRequest(event)) {
        const userMessage = event.payload;
        const origId = "" + userMessage.id;

        // create placeholder
        const assistantMessage: AssistantMessage = {
          id: origId,
          content: "",
          role: "assistant",
          createdAt: new Date(),
          isComplete: false,
        };

        // prefix only the request in state, so updates find the response
        messages.push({ ...userMessage, id: `req-${origId}` });
        messages.push(assistantMessage);
        // return [...messages, userMessage, assistantMessage];
      }
      if (actions.isResponse(event)) {
        const chunk = event.payload;
        const response = messages.find(
          (m) => m.id === chunk.requestId && m.role === "assistant"
        );
        response.content += chunk.text;
      }
      if (actions.isCompletion(event)) {
        console.log({ completion: event });
      }
      return messages;
    })
);

// XXX This class can become an @rxfx/service, with its own managed loading state.
// XXX It can reduce its own state as it streams, allow its loading state to be read,
// XXX and allow for cancelation. It need not return the Observable of each response either..
export class ChatService {
  private responseObserver: Observable<string> | null = null;
  private controller: AbortController | null = null;

  // Method to send a message and get streaming response
  sendMessage(message: string): Observable<string> {
    // XXX rxfx allows cancelation w/o AbortController
    this.controller = new AbortController();
    const signal = this.controller.signal;

    // Return a new observable that will emit the response in chunks
    return new Observable<string>((subscriber) => {
      const responseText = mockResponses[message] || mockResponses["default"];
      const words = responseText.split(" ");
      let currentIndex = 0;

      // Function to emit the next chunk
      const emitNextChunk = () => {
        // XXX Real Observable cancelation doesn't involve guard clauses like this
        if (signal.aborted) {
          subscriber.complete();
          return;
        }

        if (currentIndex < words.length) {
          // Emit the next word (or several words for faster streaming)
          const chunk =
            words
              .slice(currentIndex, currentIndex + WORDS_PER_CHUNK)
              .join(" ") + " ";
          subscriber.next(chunk);
          currentIndex += WORDS_PER_CHUNK;

          // XXX We don't need setTimeout - Observables themselves have the primitives they need.
          // Schedule the next chunk after a small delay (simulates typing)
          setTimeout(emitNextChunk, Math.random() * 100 + 50);
        } else {
          subscriber.complete();
        }
      };

      // Add artificial delay before starting to respond
      // Special case for "What can you do?" - add a 3-second delay
      const initialDelay = message === "What can you do?" ? 3000 : 800;

      setTimeout(() => {
        if (!signal.aborted) {
          emitNextChunk();
        }
      }, initialDelay);

      // Cleanup function
      return () => {
        this.controller = null;
      };
    });
  }

  // Method to stop ongoing streaming response
  stopResponse(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  // Method to get relevant suggestion cards based on conversation
  getSuggestionCards(messages: Message[]): SuggestionCard[] {
    // In a real app, we would analyze the conversation and provide relevant suggestions
    // For this mock, we'll return initial suggestions for new conversations
    // and follow-up suggestions for existing conversations
    return messages.length <= 1 ? initialSuggestions : followUpSuggestions;
  }
}

export const chatService = new ChatService();
