
import { RefreshCw } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

interface ChatInterfaceProps {
  messages: Message[];
  inputValue: string;
  isLoading: boolean;
  onSendMessage: (e: React.FormEvent) => void;
  onInputChange: (value: string) => void;
}

export const ChatInterface = ({ 
  messages, 
  inputValue, 
  isLoading, 
  onSendMessage, 
  onInputChange 
}: ChatInterfaceProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-purple-500/20 glassmorphism">
      <div className="p-4 border-b border-purple-500/30 bg-[#4A1A82]/60 backdrop-blur-md flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">AI Copywriting Assistant</h1>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              content={message.content} 
              isUser={message.isUser} 
            />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] p-4 rounded-2xl bg-[#3a1465]/60 backdrop-blur-md border border-purple-500/20 rounded-tl-none shadow-[0_0_10px_rgba(157,78,221,0.3)] text-white">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#4A1A82] flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-[#FF2EE6] animate-spin" />
                  </div>
                  <div className="whitespace-pre-wrap flex items-center gap-1">
                    <span className="inline-block h-2 w-2 bg-[#FF2EE6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="inline-block h-2 w-2 bg-[#FF2EE6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="inline-block h-2 w-2 bg-[#FF2EE6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={onSendMessage} className="p-4 border-t border-purple-500/30 glassmorphism">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Type your revision request..."
            disabled={isLoading}
            className="flex-1 bg-[#2D0A4E]/60 border-purple-500/30 focus-visible:ring-[#FF2EE6] text-white placeholder:text-gray-400 backdrop-blur-md"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading}
            className="bg-[#FF2EE6] hover:bg-[#FF2EE6]/80 text-white neon-glow"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
