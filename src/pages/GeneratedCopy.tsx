import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { supabase } from '../integrations/supabase/client';
import { toast } from '../components/ui/use-toast';
import { SidebarProvider, useSidebar } from '../components/ui/sidebar';
import { ChatHistorySidebar } from '@/components/chat/ChatHistorySidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { User } from '@supabase/supabase-js';
import { CopywritingInput } from '@/hooks/useCopywritingGenerator';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

interface ChatHistory {
  id: string;
  title: string;
}

// --- Helper Functions --- 

// Helper to check authentication status
const checkAuthStatus = async (): Promise<User | null> => {
  // Attempt to get the current session
  const { data: { session }, error } = await supabase.auth.getSession();
  // Log and throw error if session fetching fails
  if (error) {
    console.error("Error fetching session:", error);
    toast({ title: "Error", description: "Could not verify user session.", variant: "destructive" });
    throw error; // Re-throw to potentially handle upstream
  }
  // Return the user object from the session, or null if no session
  return session?.user ?? null;
};

// Helper to create a new chat history entry and update states optimistically
const createNewChatOptimistically = async (
  user: User, 
  initialInput: CopywritingInput, 
  setCurrentChat: React.Dispatch<React.SetStateAction<string | null>>,
  setChats: React.Dispatch<React.SetStateAction<ChatHistory[]>>
): Promise<{tempChatId: string, newChatIdFromDb: string | null}> => {
  // Generate a temporary ID for the optimistic update
  const tempChatId = `temp-${Date.now()}`;
  // Determine the chat title, defaulting if product name is missing
  const newChatTitle = initialInput.productName || 'New Chat';
  // Create the optimistic chat entry object
  const optimisticChatEntry: ChatHistory = { id: tempChatId, title: newChatTitle };

  // --- Optimistic UI Update --- 
  // Set the current chat to the temporary ID
  setCurrentChat(tempChatId); 
  // Prepend the optimistic entry to the chats list
  setChats(prev => [optimisticChatEntry, ...prev]); 
  // --- End Optimistic UI Update --- 

  // Variable to store the real ID from the database
  let newChatIdFromDb: string | null = null;
  // Attempt to save the new chat entry to the database
  try {
    // Insert the new chat history record
    const { data: newChatData, error: chatError } = await supabase
      .from('chat_history') // Target table
      .insert({ user_id: user.id, title: newChatTitle }) // Data to insert
      .select('id') // Select the generated ID
      .single(); // Expect a single row back
     
    // If there was an error during insertion, throw it
    if (chatError) throw chatError;

    // Store the real ID returned from the database
    newChatIdFromDb = newChatData.id;

    // --- Update State with Real ID --- 
    // Set the current chat to the real ID
    setCurrentChat(newChatIdFromDb);
    // Find the temporary entry in the chats list and update its ID to the real one
    setChats(prev => 
       prev.map(chat => 
         chat.id === tempChatId ? { ...chat, id: newChatIdFromDb! } : chat
       )
    );
    // --- End Update State --- 

  // Handle errors during database insertion
  } catch (error) {
    // Log the error
    console.error('Error creating new chat history entry:', error);
    // Show an error toast
    toast({ title: "Save Error", description: "Could not save this chat to history.", variant: "destructive" });
    // --- Revert Optimistic Update on Failure --- 
    // Reset current chat if it was the temporary one
    setCurrentChat(prev => prev === tempChatId ? null : prev);
    // Remove the temporary chat entry from the list
    setChats(prev => prev.filter(chat => chat.id !== tempChatId));
     // --- End Revert --- 
  }
  // Return the temporary and (potentially null) real ID
  return { tempChatId, newChatIdFromDb };
};

// Helper to fetch existing chat history for a user
const fetchChatHistory = async (
  user: User, 
  excludeId: string | null, // Optionally exclude an ID (like one just created)
  setChats: React.Dispatch<React.SetStateAction<ChatHistory[]>>
): Promise<ChatHistory[]> => {
  // Initialize fetched history as an empty array
  let fetchedHistory: ChatHistory[] = [];
  // Attempt to fetch chat history from the database
  try {
    // Base query to select ID and title from 'chat_history' for the given user
    let query = supabase
       .from('chat_history')
       .select('id, title')
       .eq('user_id', user.id);

    // If an ID to exclude is provided, add a .neq condition
    if (excludeId) {
       query = query.neq('id', excludeId);
    }

    // Execute the query, ordering by creation date descending
    const { data: historyData, error: historyError } = await query
       .order('created_at', { ascending: false });

    // If there was an error fetching, throw it
    if (historyError) throw historyError;

    // Store the fetched data, defaulting to an empty array if null
    fetchedHistory = historyData || [];

  // Handle errors during database fetch
  } catch (error) {
    // Log the error
    console.error('Error fetching chat history:', error);
    // Show an error toast
    toast({ title: "Error", description: "Failed to load chat history.", variant: "destructive" });
  }
  // Return the fetched history (might be empty)
  return fetchedHistory;
};

// Helper function to save chat messages for an authenticated user
const saveMessagesForUser = async (
   currentChatId: string,
   userMessage: string,
   revisedText: string
): Promise<void> => {
   // Check if the chat ID is temporary; if so, wait and don't save yet
   if (currentChatId.startsWith('temp-')) {
      // Log a warning
      console.warn('Attempted to save message with temporary chat ID. Waiting for real ID.');
      // Show a toast informing the user
      toast({ title: "Saving Chat...", description: "Finalizing chat session before saving message.", variant: "default"});
      // Stop the saving process
      return; 
   }
   // Log the attempt to save messages
   console.log(`Attempting to save messages for chat ID: ${currentChatId}`);
   // Start a try block for the database operation
   try {
      // Define the messages to be saved
      const messagesToSave = [
         { chat_id: currentChatId, content: userMessage, role: 'user' as const }, // User message
         { chat_id: currentChatId, content: revisedText, role: 'assistant' as const } // AI response
      ];
      // Log the messages being saved
      console.log('Messages to save:', messagesToSave);

      // Execute the insert operation into 'chat_messages' table
      const { error: messageError } = await supabase
         .from('chat_messages')
         .insert(messagesToSave);

      // If an error occurred during insertion, throw it
      if (messageError) {
         // Log the detailed error object
         console.error('Supabase message save error object:', messageError);
         // Throw the error to be handled by the calling function
         throw messageError; 
      } else {
         // Log successful save
         console.log(`Successfully saved messages for chat ID: ${currentChatId}`);
      }
   // Catch any errors during the save attempt
   } catch (saveError) {
      // Log the caught error
      console.error('Error saving messages (caught): ', saveError);
      // Show an error toast
      toast({ 
         title: "Save Error", // Toast title
         description: `Failed to save message history: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`,
         variant: "destructive" // Use destructive style
      });
       // Re-throw the error so the main handler knows saving failed
       throw saveError;
   }
};

// --- Inner Layout Component (Now contains the core logic) --- 
const GeneratedCopyLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile, setOpenMobile, toggleSidebar } = useSidebar();

  // --- State Variables --- 
  const [messages, setMessages] = useState<Message[]>(() => {
     const passedState = location.state as { generatedText?: string | null } | null;
     const generatedText = passedState?.generatedText;
     return generatedText ? [{ id: 'initial-0', content: generatedText, isUser: false }] : [];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // --- Effects --- 
  useEffect(() => {
    let isMounted = true; 
    const initializeChat = async () => {
      try {
        const user = await checkAuthStatus();
        if (isMounted) setCurrentUser(user);

        const passedState = location.state as { generatedText?: string | null; initialInput?: CopywritingInput | null } | null;
        const generatedText = passedState?.generatedText;
        const initialInput = passedState?.initialInput;
        let newChatId: string | null = null;
        let tempChatIdUsed: string | null = null;
        let shouldFetchHistory = true;

        if (initialInput && user && generatedText) {
          console.log("Initial input detected, creating new chat session.");
          const { tempChatId, newChatIdFromDb } = await createNewChatOptimistically(user, initialInput, setCurrentChat, setChats);
          newChatId = newChatIdFromDb;
          tempChatIdUsed = tempChatId;
          shouldFetchHistory = false;

          if (isMounted && messages.length === 0) {
            setMessages([{ id: 'initial-0', content: generatedText, isUser: false }]);
          }
          if (newChatIdFromDb) {
             try { 
                 const { error } = await supabase.from('chat_messages').insert({ chat_id: newChatIdFromDb, content: generatedText, role: 'assistant' as const });
                 if (error) throw error;
             } catch (e) { console.error("Failed to save initial message", e); /* Toast? */ }
          }
          navigate(location.pathname, { replace: true, state: { generatedText: generatedText, initialInput: null } });
          
        } else if (initialInput && (!user || !generatedText)) {
            console.error("Form navigation error: Missing user or generatedText.");
            toast({ title: "Error", description: "Could not initialize new chat.", variant: "destructive" });
            navigate('/');
            return;
        } else {
          console.log("No initial input detected (direct navigation or refresh).");
          if (!user && isMounted) { 
             console.log("User not logged in for direct navigation."); 
             shouldFetchHistory = false;
          }
        }
        
        if (shouldFetchHistory && user && isMounted) {
          console.log("Fetching existing chat history.");
          const history = await fetchChatHistory(user, null, setChats);
          let combinedHistory: ChatHistory[] = [];
          if (isMounted) {
             setChats(prevChats => {
                const currentChatEntry = prevChats.find(c => c.id === (newChatId || tempChatIdUsed));
                const safeHistory = Array.isArray(history) ? history : []; 
                combinedHistory = [
                   ...(currentChatEntry ? [currentChatEntry] : []), 
                   ...safeHistory
                ];
                return Array.from(new Map(combinedHistory.map(chat => [chat.id, chat])).values());
             });

             if (!initialInput && !currentChat && combinedHistory.length > 0) {
                const latestChatId = combinedHistory[0].id;
                console.log(`Direct navigation: Auto-selecting latest chat ${latestChatId}`);
                setTimeout(() => { if (isMounted) { handleChatSelect(latestChatId); } }, 0);
             }
          }
        }
      } catch (initError) { console.error("Error during chat initialization:", initError); }
    };
    initializeChat();
    return () => { isMounted = false; };
  }, [navigate, location.state]);

  // --- Event Handlers & Mutations --- 
  const handleChatSelect = useCallback(async (chatId: string) => {
    if (!currentUser || chatId === currentChat) { return; }
    
    let closedMobile = false;
    if (isMobile) {
      setOpenMobile(false);
      closedMobile = true;
    }
    
    if (closedMobile) {
       await new Promise(resolve => setTimeout(resolve, 300));
    }

    setCurrentChat(chatId);
    setIsLoading(true); 
    setMessages([]); 
    try {
       console.log(`Fetching messages for chat ID: ${chatId}`);
       const { data, error } = await supabase.from('chat_messages').select('content, role').eq('chat_id', chatId).order('created_at');
       if (error) throw error;
       const chatMessages: Message[] = data.map((msg: any, index: number) => ({ id: `${chatId}-${index}`, content: msg.content || "", isUser: msg.role === 'user' }));
       setMessages(chatMessages);
    } catch (error) {
       console.error('Error fetching chat messages:', error);
       toast({ title: 'Error', description: 'Failed to load selected chat.', variant: 'destructive' });
    } finally { setIsLoading(false); }
  }, [currentUser, currentChat, isMobile, setOpenMobile]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
     e.preventDefault();
     const trimmedInput = inputValue.trim();
     if (!trimmedInput || isLoading) return;
     const userMessage = trimmedInput;
     const newUserMessage: Message = { id: Date.now().toString(), content: userMessage, isUser: true };
     setMessages(prev => [...prev, newUserMessage]);
     setInputValue('');
     setIsLoading(true);
     let revisedText = '';
     try {
       const originalText = messages.find(msg => !msg.isUser)?.content || '';
       const { data, error } = await supabase.functions.invoke('revise-copywriting', { body: { originalText, userInstructions: userMessage, previousMessages: messages } });
       if (error) throw error;
       revisedText = data.revisedText;
       const assistantMessage: Message = { id: (Date.now() + 1).toString(), content: revisedText, isUser: false }; 
       setMessages(prev => [...prev, assistantMessage]);
       if (currentUser && currentChat) { await saveMessagesForUser(currentChat, userMessage, revisedText); }
     } catch (error) { console.error('Error revising:', error); setMessages(prev => prev.filter(msg => msg.id !== newUserMessage.id));
     } finally { setIsLoading(false); }
  }, [inputValue, isLoading, messages, currentUser, currentChat, navigate]);

  const handleNewChat = useCallback(() => { navigate('/'); }, [navigate]);

  const deleteChatMutation = useMutation({ 
    mutationFn: async (chatId: string) => {
      if (!currentUser) throw new Error("User not auth");
      const { error: msgError } = await supabase.from('chat_messages').delete().eq('chat_id', chatId);
      if (msgError) throw msgError;
      const { error: chatError } = await supabase.from('chat_history').delete().eq('id', chatId).eq('user_id', currentUser.id);
      if (chatError) throw chatError;
      return chatId;
    },
    onSuccess: (deletedChatId) => {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', currentUser?.id] });
      const originalChats = [...chats];
      const updatedChats = originalChats.filter(chat => chat.id !== deletedChatId);
      setChats(updatedChats);
      toast({ title: "Chat Deleted" });
      if (currentChat === deletedChatId) {
        const deletedIndex = originalChats.findIndex(chat => chat.id === deletedChatId);
        let nextChatId: string | null = null;
        if (updatedChats.length > 0) { nextChatId = deletedIndex > 0 ? updatedChats[deletedIndex - 1].id : updatedChats[0].id; }
        if (nextChatId) { setTimeout(() => handleChatSelect(nextChatId!), 0); }
         else { setCurrentChat(null); setMessages([]); }
      }
    },
    onError: (error) => {
      console.error("Mutation Error: Error deleting chat:", error);
      toast({ 
        title: "Delete Error", 
        description: "Failed to delete the chat. Please try again.", 
        variant: "destructive" 
      });
    }
  });
  
  const handleDeleteChat = useCallback((chatId: string) => {
    if (!currentUser) { /* Toast */ return; }
    deleteChatMutation.mutate(chatId);
  }, [currentUser, deleteChatMutation]);

  // --- Render Logic --- 


  return (
    <div className="flex flex-col h-screen">
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
      <div className={`flex-1 ${currentUser ? 'md:ml-4' : 'mx-auto'} max-w-4xl flex flex-col h-[calc(100vh-2rem)] z-10 min-h-[300px]`}> 
        <div className="md:hidden p-2 sticky top-0 bg-[#10031F]/80 backdrop-blur-sm z-20 flex items-center"> 
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-purple-300 hover:text-white hover:bg-purple-500/20" aria-label="Toggle chat history sidebar">
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>
        <ChatInterface 
            messages={messages}
            inputValue={inputValue}
            isLoading={isLoading || deleteChatMutation.isPending}
            onSendMessage={handleSendMessage}
            onInputChange={setInputValue}
          />
      </div>
    </div>
    </div>
   
  );
};

// --- Outer Component (Handles Auth Check & Provider) --- 
const GeneratedCopy = () => {
  const navigate = useNavigate();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null; // Variable to hold the unsubscribe function

    const checkAuthAndListen = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          // Decide how to handle session errors, maybe show error state?
          if (isMounted) setInitialLoadComplete(true); // Mark load complete even on error? Or navigate?
          return;
        }

        if (!session && isMounted) {
          console.log("No session, redirecting...");
          navigate('/auth?redirect=/generated-copy');
          // No need to set load complete here, redirect handles it
          return;
        } else if (session && isMounted) {
          console.log("Session found.");
          setInitialLoadComplete(true);
        }

        // Setup listener only if initial check passed or is ongoing
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (!isMounted) return;
          console.log(`Auth event: ${event}`);
          if (event === 'SIGNED_OUT') {
            setInitialLoadComplete(false); // Reset loading state
            navigate('/auth');
          } else if (event === 'SIGNED_IN') {
            // Ensure load is marked complete if user signs in
            if (!initialLoadComplete) setInitialLoadComplete(true);
          }
        });
        
        // Store the unsubscribe function
        unsubscribe = subscription.unsubscribe; 

      } catch (error) {
         console.error("Error in checkAuthAndListen:", error);
         // Handle unexpected errors if needed
         if (isMounted) setInitialLoadComplete(true); // Allow rendering potentially?
      }
    };

    checkAuthAndListen();

    // Cleanup function for the useEffect hook
    return () => {
      isMounted = false;
      if (unsubscribe) {
        console.log("Unsubscribing from auth state changes.");
        unsubscribe();
      }
    };
  }, [navigate]); // Only navigate is a dependency

  // Loading indicator
  if (!initialLoadComplete) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A052E] to-[#2D0A4E]">
         <p className="text-white animate-pulse">Initializing Chat...</p> 
       </div>
     ); 
  }

  // Render the provider and layout once auth is checked
  return (
    <SidebarProvider>
      <GeneratedCopyLayout />
    </SidebarProvider>
  );
};

export default GeneratedCopy;


