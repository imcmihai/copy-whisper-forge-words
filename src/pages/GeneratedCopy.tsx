import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ChatHistorySidebar } from '@/components/chat/ChatHistorySidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

interface ChatHistory {
  id: string;
  title: string;
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
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const checkAuthAndPendingActions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check for pending copywriting input after login
      const pendingInput = sessionStorage.getItem('pendingCopywritingInput');
      if (pendingInput) {
        // Clear the stored input to prevent repeated processing
        sessionStorage.removeItem('pendingCopywritingInput');
        
        // Parse the input and generate copywriting
        const input = JSON.parse(pendingInput);
        try {
          const { data: generatedData, error: openAiError } = await supabase.functions.invoke('generate-copywriting', {
            body: input
          });

          if (openAiError) throw openAiError;

          const { data: dbData, error: dbError } = await supabase
            .from('copywriting_texts')
            .insert({
              niche: input.niche,
              product_name: input.productName,
              product_description: input.productDescription,
              generated_text: generatedData.generatedText
            })
            .select()
            .single();

          if (dbError) throw dbError;

          toast({
            title: 'Copywriting Generated',
            description: 'Your copywriting text has been created successfully!'
          });

          // Update the messages state with the generated text
          setMessages([{ id: '1', content: generatedData.generatedText, isUser: false }]);
        } catch (error) {
          console.error('Error processing pending copywriting:', error);
          toast({
            title: 'Error',
            description: 'Failed to generate copywriting',
            variant: 'destructive'
          });
        }
      }

      // Fetch chats
      const fetchChats = async () => {
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
    };

    checkAuthAndPendingActions();
  }, [navigate, location.state]);

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
          .select('id, title')
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

  if (!generatedText && messages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] p-4">
        <Card className="w-full max-w-2xl p-6 glassmorphism border-purple-500/20">
          <p className="text-center text-gray-300">No generated text available.</p>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] p-4 flex">
        <ChatHistorySidebar 
          chats={chats} 
          currentChat={currentChat} 
          onChatSelect={handleChatSelect} 
        />
        <div className="flex-1 ml-4 max-w-4xl mx-auto h-[90vh] flex flex-col">
          <ChatInterface 
            messages={messages}
            inputValue={inputValue}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onInputChange={setInputValue}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default GeneratedCopy;
