
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Copy, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

const GeneratedCopy = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { generatedText } = location.state || { generatedText: null };
  const [messages, setMessages] = useState<Message[]>(() => {
    if (generatedText) {
      return [{ id: '1', content: generatedText, isUser: false }];
    }
    return [];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<{ id: string; title: string }[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchChats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('chat_history')
        .select('id, title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error);
        return;
      }

      setChats(data || []);
    };

    fetchChats();
  }, [navigate]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Text has been copied to your clipboard",
      });
    }).catch(err => {
      toast({
        title: "Failed to copy",
        description: "An error occurred while copying the text",
        variant: "destructive"
      });
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue;
    setInputValue('');
    
    const newUserMessageId = Date.now().toString();
    setMessages(prev => [...prev, { id: newUserMessageId, content: userMessage, isUser: true }]);
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('revise-copywriting', {
        body: {
          originalText: generatedText,
          userInstructions: userMessage,
          previousMessages: messages
        }
      });
      
      if (error) throw error;
      
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        content: data.revisedText, 
        isUser: false 
      }]);

      // Save chat if it's the first message
      if (!currentChat) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: chatData, error: chatError } = await supabase
          .from('chat_history')
          .insert({ 
            user_id: user?.id, 
            title: userMessage.length > 50 ? userMessage.slice(0, 50) + '...' : userMessage 
          })
          .select('id')
          .single();

        if (chatError) {
          console.error('Error creating chat:', chatError);
          return;
        }

        setCurrentChat(chatData.id);
        setChats(prev => [{ id: chatData.id, title: chatData.title }, ...prev]);
      }

      // Save messages to chat_messages
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert([
          { chat_id: currentChat, content: userMessage, role: 'user' },
          { chat_id: currentChat, content: data.revisedText, role: 'assistant' }
        ]);

      if (messageError) {
        console.error('Error saving messages:', messageError);
      }
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

  const handleChatSelect = async (chatId: string) => {
    setCurrentChat(chatId);

    const { data, error } = await supabase
      .from('chat_messages')
      .select('content, role')
      .eq('chat_id', chatId)
      .order('created_at');

    if (error) {
      console.error('Error fetching chat messages:', error);
      return;
    }

    const chatMessages = data.map((msg, index) => ({
      id: `${index + 1}`,
      content: msg.content,
      isUser: msg.role === 'user'
    }));

    setMessages(chatMessages);
  };

  if (!generatedText) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] p-4">
        <Card className="w-full max-w-2xl p-6 glassmorphism border-purple-500/20">
          <p className="text-center text-gray-300">No generated text available.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] p-4 flex">
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton 
                    onClick={() => handleChatSelect(chat.id)}
                    isActive={chat.id === currentChat}
                  >
                    {chat.title}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      
      <div className="flex-1 ml-4 max-w-4xl mx-auto h-[90vh] flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden border-purple-500/20 glassmorphism">
          <div className="p-4 border-b border-purple-500/30 bg-[#4A1A82]/60 backdrop-blur-md flex justify-between items-center">
            <h1 className="text-xl font-bold flex items-center gap-2 text-white">
              <span className="relative">
                <Bot className="h-6 w-6 text-[#FF2EE6]" />
                <span className="absolute w-2 h-2 bg-[#00FFCC] rounded-full -top-1 -right-1 animate-pulse"></span>
              </span>
              AI Copywriting Assistant
            </h1>
          </div>
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={cn(
                      "max-w-[85%] p-4 rounded-2xl flex group relative transition-all duration-300 text-white", 
                      message.isUser 
                        ? "bg-[#6C22BD] rounded-tr-none neon-glow" 
                        : "glassmorphism rounded-tl-none neon-border"
                    )}
                  >
                    <div className="absolute top-2 -left-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!message.isUser && (
                        <button 
                          onClick={() => copyToClipboard(message.content)} 
                          className="p-1 bg-[#3a1465]/60 backdrop-blur-md rounded-full hover:bg-[#4A1A82] transition-colors"
                        >
                          <Copy className="h-4 w-4 text-[#00FFCC]" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {!message.isUser && (
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#4A1A82] flex items-center justify-center shadow-[0_0_10px_rgba(157,78,221,0.4)]">
                          <Bot className="h-5 w-5 text-[#FF2EE6]" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                      {message.isUser && (
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#6C22BD] flex items-center justify-center shadow-[0_0_10px_rgba(108,34,189,0.4)]">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
          <form onSubmit={handleSendMessage} className="p-4 border-t border-purple-500/30 glassmorphism">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
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
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default GeneratedCopy;
