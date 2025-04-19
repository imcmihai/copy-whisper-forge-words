import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ChatHistorySidebar } from '@/components/chat/ChatHistorySidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { User } from '@supabase/supabase-js';
import { CopywritingInput } from '@/hooks/useCopywritingGenerator';

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
  
  const { generatedText, initialInput } = (location.state || { generatedText: null, initialInput: null }) as { generatedText: string | null, initialInput: CopywritingInput | null };

  const [messages, setMessages] = useState<Message[]>(() => {
    if (generatedText) {
      return [{ id: 'initial-0', content: generatedText, isUser: false }];
    } 
    return [];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let isMounted = true; 
    let hasProcessedInitialInput = false; // Flag to run new chat logic only once

    const initializeChat = async () => {
      // --- 1. Check Auth Status --- 
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
         console.error("Error fetching session:", sessionError);
         if (isMounted) toast({ title: "Error", description: "Could not verify user session.", variant: "destructive" });
         return;
      }
      const user = session?.user ?? null;
      if (isMounted) setCurrentUser(user);

      // --- 2. Handle Initial State & Potential Redirect --- 
      if (!generatedText) {
        // Only redirect if it's truly missing, not just during initial render phases
        if (location.state === null) { // Check if state was explicitly null/missing
           console.warn('Generated text missing, navigating to index.');
           navigate('/');
        }
        return; // Don't proceed without generatedText
      }
      
      // Initialize messages if needed
      if (isMounted && messages.length === 0 && generatedText) {
        setMessages([{ id: 'initial-0', content: generatedText, isUser: false }]);
      }

      // --- 3. Handle Logged-in User Specifics (Chat Creation & History) --- 
      if (user && initialInput && !hasProcessedInitialInput && isMounted) {
         hasProcessedInitialInput = true; // Mark as processed
         let tempChatId: string | null = null; 
         let newChatIdFromDb: string | null = null;

         const newChatTitle = initialInput.productName || 'New Chat';
         tempChatId = `temp-${Date.now()}`; 
         const optimisticChatEntry: ChatHistory = { id: tempChatId, title: newChatTitle };

         // --- Optimistic UI Update --- 
         setCurrentChat(tempChatId); 
         setChats(prev => [optimisticChatEntry, ...prev]); 
         // --- End Optimistic UI Update --- 

         // Clear location.state immediately after processing initialInput
         // Use replace to avoid adding a new entry to browser history
         navigate(location.pathname, { replace: true, state: { generatedText: generatedText, initialInput: null } }); 

         // --- Save to DB and Fetch --- 
         try {
             // Save new chat entry
             const { data: newChatData, error: chatError } = await supabase
                .from('chat_history')
                .insert({ user_id: user.id, title: newChatTitle })
                .select('id, title')
                .single();
             
             if (chatError) throw chatError;
             newChatIdFromDb = newChatData.id;

             // Update State with Real ID
             if (isMounted) {
                setCurrentChat(newChatIdFromDb); 
                setChats(prev => 
                   prev.map(chat => 
                     chat.id === tempChatId ? { ...chat, id: newChatIdFromDb! } : chat
                   )
                );
             } 

             // Fetch remaining history (excluding the new one by its *real* ID)
             const { data: historyData, error: historyError } = await supabase
                .from('chat_history')
                .select('id, title')
                .eq('user_id', user.id)
                .neq('id', newChatIdFromDb) // Exclude the one we just added
                .order('created_at', { ascending: false });

             if (historyError) throw historyError;

             // Combine and deduplicate
             if (isMounted) {
                setChats(prev => {
                   const currentChatEntry = prev.find(c => c.id === newChatIdFromDb); // Get the updated entry
                   const combined = [
                     ...(currentChatEntry ? [currentChatEntry] : []), // Ensure our current one is first
                     ...(historyData || [])
                   ];
                   return Array.from(new Map(combined.map(chat => [chat.id, chat])).values());
                });
             }

         } catch (error) {
            console.error('Error during chat save/fetch:', error);
            // Revert Optimistic Update on Failure
            if (isMounted) {
               toast({ title: "Save Error", description: "Could not save chat or fetch history.", variant: "destructive" });
               if (currentChat === tempChatId) {
                  setCurrentChat(null);
               }
               setChats(prev => prev.filter(chat => chat.id !== tempChatId));
            } 
         }

      } else if (user && !initialInput && isMounted) {
        // --- If logged in, but NOT a new generation, just fetch history --- 
        try {
            const { data: historyData, error: historyError } = await supabase
               .from('chat_history')
               .select('id, title')
               .eq('user_id', user.id)
               .order('created_at', { ascending: false });

            if (historyError) throw historyError;
            if (isMounted) {
               setChats(Array.from(new Map((historyData || []).map(chat => [chat.id, chat])).values()));
            }
        } catch (error) {
           console.error('Error fetching chat history:', error);
           if (isMounted) toast({ title: "Error", description: "Failed to load chat history.", variant: "destructive" });
        }
      }
    };

    initializeChat();

    return () => {
      isMounted = false; 
    };
  // Only re-run if navigate function, generatedText, or initialInput changes.
  }, [navigate, generatedText, initialInput]); 

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
    
    if (!inputValue.trim() || isLoading || !currentChat) { // Ensure currentChat exists
       if(!currentChat && currentUser) {
          toast({ title: "Error", description: "Cannot send message, chat session not initialized.", variant: "destructive" });
       }
       return;
    }
    
    const userMessage = inputValue;
    const currentMessages = [...messages, { id: Date.now().toString(), content: userMessage, isUser: true }];
    setMessages(currentMessages);
    setInputValue('');
    setIsLoading(true);
    
    let revisedText = '';

    try {
      const { data, error } = await supabase.functions.invoke('revise-copywriting', {
        body: {
          originalText: messages.find(msg => !msg.isUser)?.content || '',
          userInstructions: userMessage,
          previousMessages: currentMessages.slice(0, -1) 
        }
      });
      
      if (error) throw error;
      revisedText = data.revisedText;
      
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        content: revisedText, 
        isUser: false 
      }]);

      // --- Save chat and messages ONLY if user is logged in ---
      if (currentUser && currentChat) { // Ensure currentChat is set before trying to save messages
        
        // Save messages using the existing currentChat ID
        try {
          const { error: messageError } = await supabase
            .from('chat_messages')
            .insert([
              { chat_id: currentChat, content: userMessage, role: 'user' },
              { chat_id: currentChat, content: revisedText, role: 'assistant' }
            ]);

          if (messageError) {
            // Throw error to be caught below
            throw messageError; 
          }
        } catch (saveError) {
           console.error('Error saving messages:', saveError);
           toast({ 
              title: "Save Error", 
              description: `Failed to save message history: ${saveError.message}`,
              variant: "destructive" 
           });
           // Potentially revert message state update if saving fails?
        }
      } // --- End of authenticated user saving logic ---

    } catch (error) { // This catches errors from invoke AND message saving now
      console.error('Error revising or saving message:', error);
      // Don't show generic toast if it was a save error (already shown above)
      if (!error.message.includes('Failed to save message history')) { 
         toast({
           title: 'Error',
           description: 'Failed to update the copywriting text',
           variant: 'destructive'
         });
      }
      // Optional: Remove the user's message if AI fails?
      // setMessages(currentMessages.slice(0,-1)); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSelect = async (chatId: string) => {
    if (!currentUser || chatId === currentChat) return; // Prevent re-fetching same chat
    
    setCurrentChat(chatId);
    setIsLoading(true); // Indicate loading state
    setMessages([]); // Clear previous messages immediately

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('content, role')
        .eq('chat_id', chatId)
        .order('created_at');

      if (error) throw error;

      // Ensure data is mapped correctly
      const chatMessages: Message[] = data.map((msg, index) => ({
        id: `${chatId}-${index}`,
        content: msg.content || "", // Handle potential null content
        isUser: msg.role === 'user'
      }));

      setMessages(chatMessages);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load selected chat.',
        variant: 'destructive'
      });
      // Keep messages empty on error
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle starting a new chat
  const handleNewChat = () => {
    // Navigate back to the index page to fill the form again
    navigate('/');
  };

  // Function to handle deleting a chat
  const handleDeleteChat = async (chatId: string) => {
    if (!currentUser) return; // Should not be possible, but safe check

    try {
      // 1. Delete messages associated with the chat
      const { error: msgError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('chat_id', chatId);
      if (msgError) throw msgError;

      // 2. Delete the chat history entry itself
      const { error: chatError } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', chatId)
        .eq('user_id', currentUser.id); // Ensure user owns the chat
      if (chatError) throw chatError;

      // 3. Update local state
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      toast({ title: "Chat Deleted", description: "The chat has been permanently deleted." });

      // 4. If the deleted chat was the current one, reset the view
      if (currentChat === chatId) {
        setCurrentChat(null);
        setMessages([]); // Clear messages
        // Optionally navigate to '/' or show a placeholder
        navigate('/'); // Navigate to form page after deleting active chat
      }

    } catch (error) {
      console.error("Error deleting chat:", error);
      toast({ title: "Delete Error", description: "Failed to delete the chat.", variant: "destructive" });
    }
  };

  // Use currentUser state to determine if initial data fetch is complete (for logged-in users)
  // or rely on messages having content (for anonymous users)
  const isLoadingInitialData = currentUser === undefined || (currentUser && chats === undefined);

  if (messages.length === 0 && !currentUser) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A052E] to-[#2D0A4E]">
        <p className="text-white animate-pulse">Loading Chat...</p> 
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#10031F] to-[#1F063A] p-4 flex relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-[#FF2EE6]/20 via-transparent to-transparent rounded-full -translate-x-1/4 -translate-y-1/4 blur-3xl opacity-60 animate-pulse-slow pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-radial from-[#00FFCC]/15 via-transparent to-transparent rounded-full translate-x-1/4 translate-y-1/4 blur-3xl opacity-70 animate-pulse-slow-delay pointer-events-none"></div>
        
        {currentUser && (
          <ChatHistorySidebar 
            chats={chats} 
            currentChat={currentChat} 
            currentUser={currentUser}
            onChatSelect={handleChatSelect} 
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
          />
        )}
        
        <div className={`flex-1 ${currentUser ? 'ml-4' : 'mx-auto'} max-w-4xl flex flex-col h-[calc(100vh-2rem)] z-10 min-h-[300px]`}>
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
