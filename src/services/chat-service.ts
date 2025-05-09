import { AssistantMessage, UserMessage } from "../types/chat";
import {
  createService,
  concat,
  after,
  randomizePreservingAverage,
  defaultBus,
  LifecycleEventMatchers,
} from "@rxfx/service";
import { createEffect } from "@rxfx/effect";
import { produce } from "immer";

import { Message, Chunk } from "@/types/chat";

// Mock responses
const mockResponses: Record<string, string> = {
  default:
    "I'm an AI assistant created to help answer your questions and assist with various tasks. How can I help you today?",
  "What can you do?":
    "I can help you with a variety of tasks such as:\n\n- Answering questions on various topics\n- Providing creative content like stories or poems\n- Helping with problem-solving\n- Offering suggestions and recommendations\n- Explaining complex concepts in simple terms\n\nWhat would you like help with today?",
  // "What can you do?": "I can help you with a variety of tasks",
  "Tell me a joke":
    "Why don't scientists trust atoms?\n\nBecause they make up everything! 😄",
  "Write a short poem about technology":
    "Digital dreams in silicon beds,\nWires like veins, electric threads.\nHuman and machine, a dance of light,\nFuture's whisper in the quiet night.\n\nConnected souls through glowing screens,\nInfinite power in binary means.\nTechnology's touch, a modern art,\nBinding mind with metal heart.",
  "Explain how AI works":
    "At a high level, AI works through these key principles:\n\n1. **Data Collection**: AI systems need large amounts of data to learn patterns\n\n2. **Training**: Using algorithms, the system analyzes this data to identify patterns and correlations\n\n3. **Model Building**: These patterns form a model that can make predictions or decisions\n\n4. **Inference**: The trained model can then process new inputs and generate outputs\n\nModern AI, especially deep learning, uses neural networks - computational structures inspired by the human brain. These networks consist of layers of nodes (neurons) that process information and adjust their connections through training.\n\nThe development of AI involves many specialized fields including machine learning, natural language processing, computer vision, and more.",
  "Help me learn French":
    "Bonjour! Learning French is a wonderful journey. Here are some essential phrases to get started:\n\n- Hello = Bonjour (bon-zhoor)\n- How are you? = Comment allez-vous? (koh-mahn tah-lay voo)\n- My name is... = Je m'appelle... (zhuh mah-pel)\n- Thank you = Merci (mehr-see)\n- Please = S'il vous plaît (seel voo play)\n- Yes/No = Oui/Non (wee/non)\n\nConsistent practice is key to learning any language. Try watching French films with subtitles, listening to French music, or using language learning apps for daily practice. Bonne chance! (Good luck!)",
};

// Helper function to generate UUID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

const CHUNK_DELAY = 250;
const PENDING_DELAY = 800;
const LONGER_PENDING_DELAY = 3000;
const SPY_TO_CONSOLE = true;

defaultBus.reset();
void (SPY_TO_CONSOLE && defaultBus.spy(console.log));

// export const chatRxFxService = createService<
//   UserMessage,
//   Chunk,
//   Error,
//   Message[]
// >("messages", getWordStream, reducerFactory);

export const chatFx = createEffect<UserMessage, Chunk, Error, Message[]>(
  getWordStream
);
// Now the reducer will populate the BehaviorSubject: chatRxFxService.state
chatFx.reduceWith(
  produce((messages, event) => {
    if (event.type === "request") {
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
    }
    if (event.type === "response") {
      const chunk = event.payload;
      const response = messages.find(
        (m) => m.id === chunk.requestId && m.role === "assistant"
      );
      response.content += chunk.text;
    }

    if (event.type === "canceled") {
      const response = messages.find(
        (m) => m.id === event.payload.id && m.role === "assistant"
      );
      response.content += " [Canceled]";
    }

    return messages;
  }),
  []
);

// Reducer (immutable with immer)
// export function reducerFactory(actions: MatchersOf<typeof chatRxFxService>) {
//   return produce((messages: Message[] = [], event) => {
//     if (actions.isRequest(event)) {
//       const userMessage = event.payload;
//       const origId = "" + userMessage.id;

//       // create placeholder
//       const assistantMessage: AssistantMessage = {
//         id: origId,
//         content: "",
//         role: "assistant",
//         createdAt: new Date(),
//         isComplete: false,
//       };

//       // prefix only the request in state, so updates find the response
//       messages.push({ ...userMessage, id: `req-${origId}` });
//       messages.push(assistantMessage);
//     }
//     if (actions.isResponse(event)) {
//       const chunk = event.payload;
//       const response = messages.find(
//         (m) => m.id === chunk.requestId && m.role === "assistant"
//       );
//       response.content += chunk.text;
//     }

//     return messages;
//   });
// }

function getWordStream(userMessage: UserMessage) {
  const responseText =
    mockResponses[userMessage.content] || mockResponses["default"];
  const words = responseText.split(" ");
  const initialDelay =
    userMessage.content === "What can you do?"
      ? PENDING_DELAY
      : LONGER_PENDING_DELAY;

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
}
