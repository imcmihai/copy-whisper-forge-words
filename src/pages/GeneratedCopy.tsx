/// <reference lib="dom.clipboard" />
import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// --- Main Component --- 

const GeneratedCopy = () => {
  // --- State Variables --- 
  // Get location object for accessing navigation state
  const location = useLocation();
  // Get navigation function
  const navigate = useNavigate();
  
  // Extract initial data passed via navigation state, providing defaults
  const { generatedText, initialInput } = (location.state || { generatedText: null, initialInput: null }) as { generatedText: string | null, initialInput: CopywritingInput | null };

  // State for the chat messages array
  const [messages, setMessages] = useState<Message[]>(() => {
    // Initialize messages with generatedText if available
    if (generatedText) {
      // Return initial message array
      return [{ id: 'initial-0', content: generatedText, isUser: false }];
    }
    // Otherwise, return an empty array
    return [];
  });
  // State for the chat input field value
  const [inputValue, setInputValue] = useState('');
  // State for tracking loading status (e.g., during AI response)
  const [isLoading, setIsLoading] = useState(false);
  // State for the list of chat history items for the sidebar
  const [chats, setChats] = useState<ChatHistory[]>([]);
  // State for the ID of the currently active chat session
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  // State for the currently authenticated user object (or null)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Ref for scrolling the chat area (implementation not shown)
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // --- Effects --- 

  // Effect to initialize chat state, auth, and history on load or when input changes
  useEffect(() => {
    // Flag to prevent state updates after component unmounts
    let isMounted = true; 
    // Flag to ensure new chat creation logic runs only once per initialInput
    let processedInput = false; 

    // Define the async function to perform initialization
    const initializeChat = async () => {
      // --- 1. Check Auth & Set User --- 
      try {
        // Check authentication status
        const user = await checkAuthStatus();
        // If component is still mounted, update the user state
        if (isMounted) setCurrentUser(user);

        // --- 2. Handle Initial State & Redirect --- 
        // Redirect if required initial text is missing
        if (!generatedText) {
          // Check if navigation state was explicitly missing (not just initial render)
          if (location.state === null) { 
             console.warn('Generated text missing, navigating to index.');
             navigate('/');
          }
          return; // Stop initialization if redirecting or missing text
        }
        
        // Set initial message if messages array is empty
        if (isMounted && messages.length === 0 && generatedText) {
          setMessages([{ id: 'initial-0', content: generatedText, isUser: false }]);
        }

        // --- 3. Handle Logged-in User Logic --- 
        if (user && isMounted) {
          // Define variable to hold the ID of a newly created chat
          let newChatId: string | null = null;
          // Define variable to hold the temp ID during optimistic update
          let tempChatIdUsed: string | null = null;

          // --- 3a. New Chat Creation (if initialInput exists and not yet processed) --- 
          if (initialInput && !processedInput) {
            // Mark initialInput as processed for this effect run
            processedInput = true;
            // Clear the initialInput from location state to prevent re-processing on re-renders
            navigate(location.pathname, { replace: true, state: { generatedText: generatedText, initialInput: null } }); 

            // Perform optimistic update and database insert for the new chat
            const { tempChatId, newChatIdFromDb } = await createNewChatOptimistically(user, initialInput, setCurrentChat, setChats);
            // Store the real ID if creation was successful
            newChatId = newChatIdFromDb;
            // Store the temp ID used
            tempChatIdUsed = tempChatId;

             // --- Save the initial generated message --- 
             // Check if chat creation was successful (got a real ID) and text exists
             if (newChatIdFromDb && generatedText) {
                 // Try saving the first message from the AI
                 try {
                   const { error: initialMsgError } = await supabase
                     .from('chat_messages') // Target table
                     .insert({ // Data to insert
                       chat_id: newChatIdFromDb, // Use the real chat ID
                       content: generatedText, // The initial AI-generated text
                       role: 'assistant' as const // Role is assistant
                     });
  
                   // If saving the initial message failed, throw error
                   if (initialMsgError) throw initialMsgError;
                 // Handle errors saving the initial message
                 } catch (initialMsgSaveError) {
                     // Log the error
                     console.error("Error saving initial message:", initialMsgSaveError);
                     // Show a toast notification
          toast({
                        title: "Save Error",
                        description: "Could not save the initial message for the new chat.",
                        variant: "destructive",
                     });
                      // Note: Chat history entry exists, but initial message save failed.
                 }
             } // --- End Save Initial Message --- 
          }

          // --- 3b. Fetch Chat History --- 
          // Fetch the rest of the chat history (excluding the one just created, if applicable)
          const history = await fetchChatHistory(user, newChatId, setChats);
          // If component is still mounted, update the chats state
          if (isMounted) {
            // Combine the current chats state (which might include the optimistically added/updated new chat)
            // with the fetched history, ensuring the current one remains and deduplicating.
            setChats(prevChats => {
               // Find the entry for the current chat (could be temp or real ID)
               const currentChatEntry = prevChats.find(c => c.id === (newChatId || tempChatIdUsed));
               // Combine: put current entry first, then fetched history
               const combined = [
                 ...(currentChatEntry ? [currentChatEntry] : []), 
                 ...history
               ];
               // Deduplicate using a Map based on ID
               return Array.from(new Map(combined.map(chat => [chat.id, chat])).values());
            });
          }
        }
      // Catch any errors during the entire initialization process
      } catch (initError) {
        // Log the initialization error
        console.error("Error during chat initialization:", initError);
        // No user-facing toast here as specific errors are handled in helpers
      }
    };

    // Execute the initialization function
    initializeChat();

    // Cleanup function to run when the component unmounts or dependencies change
    return () => {
      // Set the mounted flag to false to prevent state updates on unmounted component
      isMounted = false; 
    };
  // Dependencies array for the useEffect hook
  // Re-run effect if navigate, generatedText, or initialInput change
  }, [navigate, generatedText, initialInput, location.state]); // Added location.state as dep

  // --- Event Handlers --- 

  // Handler for copying text to clipboard (implementation not shown, assume correct)
  const copyToClipboard = useCallback((text: string) => {
    // Implementation details...
    navigator.clipboard.writeText(text).then(() => {
       toast({ title: "Copied", description: "Text copied to clipboard." });
    }).catch((err: any) => {
       console.error("Copy error:", err);
       toast({ title: "Copy Failed", variant: "destructive" });
    });
  }, []);

  // Handler for sending a new message or revising the text
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    // Prevent default form submission behavior
    e.preventDefault();
    
    // Trim whitespace from input value
    const trimmedInput = inputValue.trim();
    // Exit if input is empty or already loading
    if (!trimmedInput || isLoading) return;
    
    // Store the user's message content
    const userMessage = trimmedInput;
    // Create the new message object for the user
    const newUserMessage: Message = { id: Date.now().toString(), content: userMessage, isUser: true };
    
    // Optimistically update the messages state with the user's message
    setMessages(prev => [...prev, newUserMessage]);
    // Clear the input field
    setInputValue('');
    // Set loading state to true (for AI response)
    setIsLoading(true);
    
    // Variable to store the AI's revised text response
    let revisedText = '';

    // Start try block for AI call and message saving
    try {
      // Find the first non-user (assistant) message to use as original text for revision
      const originalTextForRevision = messages.find(msg => !msg.isUser)?.content || generatedText || ''; 
      
      // Invoke the 'revise-copywriting' Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('revise-copywriting', {
        body: { // Request body
          originalText: originalTextForRevision, // Text to be revised
          userInstructions: userMessage, // User's instructions for revision
          previousMessages: messages // Pass the current message history (excluding the new user message)
        }
      });
      
      // If the function invocation resulted in an error, throw it
      if (error) throw error;
      // Store the revised text from the response
      revisedText = data.revisedText;
      
      // Create the new message object for the assistant's response
      const assistantMessage: Message = { 
        id: (Date.now() + 1).toString(), // Generate a unique ID
        content: revisedText, // AI's response content
        isUser: false // Mark as not from the user
      }; 
      // Update the messages state with the assistant's response
      setMessages(prev => [...prev, assistantMessage]);

      // If the user is logged in and a chat session is active, save the messages
      if (currentUser && currentChat) {
        // Call helper function to save user and assistant messages
        await saveMessagesForUser(currentChat, userMessage, revisedText);
      }

    // Catch errors from AI function invocation or message saving
    } catch (error) {
      // Log the error
      console.error('Error revising or saving message:', error);
      // Show a generic error toast ONLY if it wasn't a save error (which shows its own toast)
      if (!(error instanceof Error && error.message.includes('Failed to save message history'))) { 
         toast({
           title: 'Revision Error',
           description: 'Failed to get revised text from AI.',
           variant: 'destructive'
         });
      }
      // Revert optimistic UI update: remove the user's message that failed
      setMessages(prev => prev.filter(msg => msg.id !== newUserMessage.id));
    // Finally block ensures loading state is reset
    } finally {
      // Set loading state back to false
      setIsLoading(false);
    }
  // Dependencies for the useCallback hook
  }, [inputValue, isLoading, messages, currentUser, currentChat, navigate, generatedText]);

  // Handler for selecting a chat from the history sidebar
  const handleChatSelect = useCallback(async (chatId: string) => {
    // Log the selection
    console.log(`handleChatSelect called with chatId: ${chatId}`);
    // Do nothing if user isn't logged in or the selected chat is already active
    if (!currentUser || chatId === currentChat) {
      console.log(`Skipping fetch: currentUser=${!!currentUser}, chatId === currentChat=${chatId === currentChat}`);
          return;
        }

    // Set the selected chat ID as the current chat
    setCurrentChat(chatId);
    // Set loading state to true
    setIsLoading(true); 
    // Clear the current messages immediately
    setMessages([]); 

    // Start try block for fetching messages
    try {
      // Log the fetch attempt
      console.log(`Fetching messages for chat ID: ${chatId}`);
      // Fetch messages from 'chat_messages' table for the selected chat ID
      const { data, error } = await supabase
        .from('chat_messages') // Target table
        .select('content, role') // Select required columns
        .eq('chat_id', chatId) // Filter by chat ID
        .order('created_at'); // Order by creation time

      // If fetching failed, throw the error
      if (error) {
         console.error('Supabase message fetch error object:', error);
         throw error;
      }

      // Log the raw data received
      console.log('Raw data from Supabase:', data);

      // Map the fetched data to the Message interface structure
      const chatMessages: Message[] = data.map((
          msg: { content: string | null, role: string | null }, // Added type for msg
          index: number // Added type for index
         ) => ({
        id: `${chatId}-${index}`, 
        content: msg.content || "", 
        isUser: msg.role === 'user' 
      }));
      
      // Log the mapped messages array
      console.log('Mapped chatMessages before setMessages:', chatMessages);

      // Update the messages state with the fetched messages
      setMessages(chatMessages);
      // Log successful state update
      console.log('setMessages called successfully');

    // Catch errors during message fetching
    } catch (error) {
      // Log the fetch error
      console.error('Error fetching chat messages:', error);
      // Show an error toast
      toast({
        title: 'Error',
        description: 'Failed to load selected chat.',
        variant: 'destructive'
      });
      // Keep messages empty on error (already cleared)
    // Finally block ensures loading state is reset
    } finally {
      // Set loading state back to false
      setIsLoading(false);
    }
  // Dependencies for the useCallback hook
  }, [currentUser, currentChat]);

  // Handler for the 'New Chat' button click
  const handleNewChat = useCallback(() => {
    // Navigate user back to the index page (form page)
    navigate('/');
  // Dependencies for the useCallback hook
  }, [navigate]);

  // Handler for deleting a chat
  const handleDeleteChat = useCallback(async (chatId: string) => {
    // Ensure user is logged in
    if (!currentUser) return; 

    // Log the deletion attempt
    console.log(`Attempting to delete chat ID: ${chatId}`);
    // Start try block for deletion operations
    try {
      // --- 1. Delete associated messages --- 
      // Delete all messages where chat_id matches
      const { error: msgError } = await supabase
        .from('chat_messages') // Target table
        .delete() // Delete operation
        .eq('chat_id', chatId); // Filter by chat ID
      // If message deletion fails, throw the error
      if (msgError) throw msgError;
      // Log successful message deletion
      console.log(`Deleted messages for chat ID: ${chatId}`);

      // --- 2. Delete chat history entry --- 
      // Delete the entry from chat_history table
      const { error: chatError } = await supabase
        .from('chat_history') // Target table
        .delete() // Delete operation
        .eq('id', chatId) // Filter by chat ID
        .eq('user_id', currentUser.id); // Ensure the logged-in user owns this chat
      // If chat history deletion fails, throw the error
      if (chatError) throw chatError;
       // Log successful chat history deletion
      console.log(`Deleted chat history entry for ID: ${chatId}`);

      // --- 3. Update local state --- 
      // Remove the deleted chat from the local 'chats' state
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      // Show a success toast
      toast({ title: "Chat Deleted", description: "The chat has been permanently deleted." });

      // --- 4. Reset view if current chat was deleted --- 
      // Check if the deleted chat was the one currently being viewed
      if (currentChat === chatId) {
        // Reset the current chat ID state
        setCurrentChat(null);
        // Clear the messages display
        setMessages([]); 
        // Navigate back to the form page
        navigate('/'); 
      }

    // Catch errors during deletion process
    } catch (error) {
      // Log the deletion error
      console.error("Error deleting chat:", error);
      // Show an error toast
      toast({ title: "Delete Error", description: "Failed to delete the chat.", variant: "destructive" });
    }
  // Dependencies for the useCallback hook
  }, [currentUser, currentChat, navigate]);

  // --- Render Logic --- 

  // Loading state indicator (simplistic version)
  // Display loading only if messages are empty AND user isn't logged in yet (initial load)
  if (messages.length === 0 && currentUser === undefined) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A052E] to-[#2D0A4E]">
        <p className="text-white animate-pulse">Loading Chat...</p> 
      </div>
    );
  }

  // Main component render
  return (
    // Provide sidebar context
    <SidebarProvider>
      {/* Main container div with background and layout */}
      <div className="min-h-screen bg-gradient-to-br from-[#10031F] to-[#1F063A] p-4 flex relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-[#FF2EE6]/20 via-transparent to-transparent rounded-full -translate-x-1/4 -translate-y-1/4 blur-3xl opacity-60 animate-pulse-slow pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-radial from-[#00FFCC]/15 via-transparent to-transparent rounded-full translate-x-1/4 translate-y-1/4 blur-3xl opacity-70 animate-pulse-slow-delay pointer-events-none"></div>
          
         {/* Render sidebar only if user is logged in */}
        {currentUser && (
        <ChatHistorySidebar 
            chats={chats} // Pass chat history list
            currentChat={currentChat} // Pass current active chat ID
            currentUser={currentUser} // Pass current user object
            onChatSelect={handleChatSelect} // Pass chat selection handler
            onNewChat={handleNewChat} // Pass new chat handler
            onDeleteChat={handleDeleteChat} // Pass delete chat handler
          />
        )}
        
        {/* Main Chat Area Container */}
        <div className={`flex-1 ${currentUser ? 'ml-4' : 'mx-auto'} max-w-4xl flex flex-col h-[calc(100vh-2rem)] z-10 min-h-[300px]`}>
          {/* Chat Interface Component */}
          <ChatInterface 
            messages={messages} // Pass messages array
            inputValue={inputValue} // Pass current input value
            isLoading={isLoading} // Pass loading state
            onSendMessage={handleSendMessage} // Pass message sending handler
            onInputChange={setInputValue} // Pass input change handler
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

// Export the component as default
export default GeneratedCopy;
