
import { Chat } from "@/components/chat/Chat";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-bot">CopilotUI</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        <Chat />
      </main>
    </div>
  );
};

export default Index;
