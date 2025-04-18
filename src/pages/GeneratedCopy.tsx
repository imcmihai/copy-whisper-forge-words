
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

const GeneratedCopy = () => {
  const location = useLocation();
  const { generatedText } = location.state || { generatedText: null };
  const [messages, setMessages] = useState<Message[]>(() => {
    if (generatedText) {
      return [{ id: '1', content: generatedText, isUser: false }];
    }
    return [];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!generatedText) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-2xl p-6">
          <p className="text-center text-gray-500">No generated text available.</p>
        </Card>
      </div>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue;
    setInputValue('');
    
    // Add user message to chat
    const newUserMessageId = Date.now().toString();
    setMessages(prev => [...prev, { id: newUserMessageId, content: userMessage, isUser: true }]);
    
    setIsLoading(true);
    
    try {
      // Call the edge function to update the copywriting based on user feedback
      const { data, error } = await supabase.functions.invoke('revise-copywriting', {
        body: {
          originalText: generatedText,
          userInstructions: userMessage,
          previousMessages: messages
        }
      });
      
      if (error) throw error;
      
      // Add AI response to chat
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        content: data.revisedText, 
        isUser: false 
      }]);
    } catch (error) {
      console.error('Error revising copywriting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the copywriting text',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto h-[80vh] flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden shadow-lg">
          <div className="p-4 border-b bg-primary text-primary-foreground">
            <h1 className="text-xl font-bold">Copywriting Assistant</h1>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isUser 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-muted rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-muted rounded-tl-none">
                    <div className="whitespace-pre-wrap">Updating copy...</div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your revision request..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default GeneratedCopy;
