import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { toast } from '../components/ui/use-toast';
import { SidebarProvider, useSidebar } from '../components/ui/sidebar';
import { ChatHistorySidebar } from '@/components/chat/ChatHistorySidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { User } from '@supabase/supabase-js';
import { CopywritingInput } from '@/hooks/useCopywritingGenerator';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, PanelLeft, SendHorizontal, ImageIcon, DownloadIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ImageGenerator from '@/components/ImageGenerator';
import ExportOptions from '@/components/ExportOptions';

// Import new hooks and components
import { useCredits } from '@/lib/hooks/useCredits';
import { useUser } from '@/lib/hooks/useUser';
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess';
import { getUserMessagesCountInChat } from '@/lib/api';
import { ChatToolsSidebar } from '@/components/chat/ChatToolsSidebar';

// --- Interfaces (Reverted Message type) ---
interface Message {
  id: string;
  content: string; // Keep content as string
  isUser: boolean;
}

interface ChatHistory {
  id: string;
  title: string;
}

// --- Helper Functions --- 

// Helper to create a new chat history entry and update states optimistically
const createNewChatOptimistically = async (
  user: User, 
  initialInput: CopywritingInput, 
  setCurrentChat: React.Dispatch<React.SetStateAction<string | null>>,
  setChats: React.Dispatch<React.SetStateAction<ChatHistory[]>>,
  navigate: ReturnType<typeof useNavigate>
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

    // Navigate to the new chat URL once ID is confirmed
    navigate(`/generated-copy/${newChatIdFromDb}`, { replace: true }); 

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
    // Optionally navigate back or to a default state on error
    navigate('/dashboard'); 
  }
  // Return the temporary and (potentially null) real ID
  return { tempChatId, newChatIdFromDb };
};

// Helper to fetch existing chat history for a user
const fetchChatHistory = async (
  user: User 
): Promise<ChatHistory[]> => {
  // Initialize fetched history as an empty array
  let fetchedHistory: ChatHistory[] = [];
  // Attempt to fetch chat history from the database
  try {
    // Base query to select ID and title from 'chat_history' for the given user
    const { data: historyData, error: historyError } = await supabase
       .from('chat_history')
       .select('id, title')
       .eq('user_id', user.id);

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

// --- Helper function to save image message (Stringified) --- 
const saveImageMessageForUser = async (
    currentChatId: string,
    imageUrl: string
): Promise<boolean> => {
    if (currentChatId.startsWith('temp-')) {
        console.warn('Attempted to save image message with temporary chat ID.');
        toast({ title: "Saving Chat...", description: "Finalizing chat session before saving image.", variant: "default" });
        return false;
    }
    console.log(`Attempting to save image message for chat ID: ${currentChatId}`);
    try {
        // Stringify the image information
        const messageContent = JSON.stringify({ type: 'image', url: imageUrl }); 
        const { error } = await supabase
            .from('chat_messages')
            .insert({
                chat_id: currentChatId,
                role: 'assistant' as const,
                content: messageContent, // Save the stringified JSON
            });
        if (error) throw error;
        console.log(`Successfully saved image message for chat ID: ${currentChatId}`);
        return true;
    } catch (saveError) {
        console.error('Error saving image message:', saveError);
        // Fix toast variant
        toast({ title: "Save Error", description: `Failed to save generated image to chat history.`, variant: "destructive" }); 
        return false;
   }
};

// --- Main Page Component (Replaces GeneratedCopyLayout) --- 
const GeneratedCopy = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { chatId: chatIdFromUrl } = useParams<{ chatId?: string }>();
  const queryClient = useQueryClient();
  const { isMobile, setOpenMobile, toggleSidebar } = useSidebar();
  
  // Get authenticated user - ProtectedRoute ensures user exists if we reach here
  const { user: currentUser, usage, isLoading: isLoadingUser } = useUser(); 
  const { tier, getMaxMessagesPerChat, getMaxChats } = useFeatureAccess();
  const { checkCredits, useCredits: deductCredits, isChecking: isCheckingCredits, isUsing: isUsingCredits } = useCredits(); // Get credit functions
  const [currentUserMessageCount, setCurrentUserMessageCount] = useState<number>(0);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false); // Added state for image generation loading

  // --- State Variables --- 
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // --- Data Loading Function (Moved Before Usage) --- 
  const loadMessagesForChat = useCallback(async (chatId: string) => {
      if (!currentUser) return;
      setIsLoadingMessages(true);
      setGeneratedImages([]); // Clear images when changing chat
      setCurrentUserMessageCount(0); // Reset count before fetching
      try {
         // Fetch messages and count in parallel
         const [messagesResult, countResult] = await Promise.all([
             supabase.from('chat_messages').select('content, role').eq('chat_id', chatId).order('created_at'),
             // Fetch count only needed for free tier
             tier === 'free' ? getUserMessagesCountInChat(chatId) : Promise.resolve(0) 
         ]);

         const { data: messagesData, error: messagesError } = messagesResult;
         if (messagesError) throw messagesError;

         const chatMessages: Message[] = (messagesData || []).map((msg: any, index: number) => ({ id: `${chatId}-${index}`, content: msg.content || "", isUser: msg.role === 'user' }));
         setMessages(chatMessages);
         
         // Set message count if free tier
         if (tier === 'free') {
             setCurrentUserMessageCount(countResult); 
         }

      } catch (error) {
         console.error('Error fetching chat messages or count:', error);
         toast({ title: 'Error', description: 'Failed to load selected chat.', variant: 'destructive' });
         setMessages([]); // Clear messages on error
         setCurrentUserMessageCount(0); // Reset count on error
      } finally { setIsLoadingMessages(false); }
  }, [currentUser, tier]); // Added tier dependency

  // --- Mutations (Declared before usage in handlers) ---
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
      // If the deleted chat was the current one, navigate to dashboard or latest chat
      if (currentChatId === deletedChatId) {
        const nextChat = updatedChats[0]; // Get the new latest chat
        if (nextChat) {
            navigate(`/generated-copy/${nextChat.id}`);
            setCurrentChatId(nextChat.id); // Set state directly
        } else {
            navigate('/dashboard'); // Navigate to dashboard if no chats left
            setCurrentChatId(null);
            setMessages([]);
            setGeneratedImages([]);
        }
      }
    },
    onError: (error) => {
      console.error("Mutation Error: Error deleting chat:", error);
      toast({ title: "Delete Error", description: "Failed to delete chat.", variant: "destructive" });
    }
  });

  // --- Effects --- 

  // Effect 1: Initialize based on URL or initial state (runs once or when user changes)
  useEffect(() => {
    let isMounted = true;
    if (!currentUser) return; // Should not happen due to ProtectedRoute, but safeguard

    const passedState = location.state as { generatedText?: string | null; initialInput?: CopywritingInput | null } | null;
    const generatedText = passedState?.generatedText;
    const initialInput = passedState?.initialInput;

    const initialize = async () => {
      // If initial input exists, create a new chat
      if (initialInput && generatedText) {
        console.log("Initial input detected, creating new chat session.");
        setMessages([{ id: 'initial-0', content: generatedText, isUser: false }]);
        // Clear location state after processing
        navigate(location.pathname, { replace: true, state: null }); 
        const { newChatIdFromDb } = await createNewChatOptimistically(currentUser, initialInput, setCurrentChatId, setChats, navigate);
        // Initial message saving is now handled within createNewChatOptimistically or needs separate logic
        // If newChatIdFromDb is available, save the initial assistant message
         if (newChatIdFromDb) {
             try { 
                 const { error } = await supabase.from('chat_messages').insert({ chat_id: newChatIdFromDb, content: generatedText, role: 'assistant' as const });
                 if (error) throw error;
             } catch (e) { console.error("Failed to save initial message", e); }
          }
      } else {
        // Fetch history if not creating new chat
        const history = await fetchChatHistory(currentUser);
        if (isMounted) {
          setChats(history);
          // Determine which chat to load based on URL or latest
          const targetChatId = chatIdFromUrl || history[0]?.id || null;
          if (targetChatId && targetChatId !== currentChatId) {
             // Use timeout to prevent potential state update conflicts if called immediately
            setTimeout(() => handleChatSelect(targetChatId), 0); 
          } else if (!targetChatId) {
              // Handle case with no history and no URL param (maybe show welcome/prompt?)
              setCurrentChatId(null);
              setMessages([]);
          }
        }
      }
    };

    initialize();
    return () => { isMounted = false; };
    // Rerun if user changes or if location.state contains initialInput (first load from form)
  }, [currentUser, location.state?.initialInput, chatIdFromUrl, navigate]); // Added dependencies

  // Effect 2: Load messages when currentChatId changes (and is not null/temp)
  useEffect(() => {
      if (currentChatId && !currentChatId.startsWith('temp-') && currentUser) {
          loadMessagesForChat(currentChatId);
      }
      // Clear messages and count if currentChatId becomes null
      if (!currentChatId) {
          setMessages([]);
          setCurrentUserMessageCount(0);
      }
  }, [currentChatId, currentUser, loadMessagesForChat]);

  // --- Event Handlers & Mutations --- 
  const handleChatSelect = useCallback((chatId: string) => {
    if (chatId === currentChatId) return; // Don't reload if already selected
    
    if (isMobile) {
      setOpenMobile(false); // Close mobile sidebar
    }
    // Navigate to the new chat URL
    navigate(`/generated-copy/${chatId}`); 
    setCurrentChatId(chatId); // Update state (effect will trigger message load)

  }, [currentChatId, isMobile, setOpenMobile, navigate]);

  // Updated handleSendMessage with credit check and revision state
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
     e.preventDefault();
     const trimmedInput = inputValue.trim();
     const currentlyProcessing = isRevising || isCheckingCredits || isUsingCredits || deleteChatMutation.isPending || isLoadingUser;

     // --- Added Robust Check --- 
     // Prevent sending if:
     // - Input is empty
     // - Already processing (revising, credit check, deleting)
     // - User object is missing
     // - Chat ID is missing or temporary
     // - User ID is missing or looks like a temporary placeholder
     if (!trimmedInput || 
         currentlyProcessing || 
         !currentUser || 
         !currentChatId || 
         currentChatId.startsWith('temp-') ||
         !currentUser.id || // Check if id exists
         currentUser.id.startsWith('temp-')) {
         
         console.warn("Send message prevented. Conditions not met:", {
             trimmedInput,
             currentlyProcessing,
             currentUserExists: !!currentUser,
             currentChatId,
             userId: currentUser?.id
         });
         return; // Stop execution
     }
     // --- End Added Check ---

     // --- Free Tier Message Limit Check ---
     if (tier === 'free') {
         const maxMessages = getMaxMessagesPerChat();
         // Use the state variable for current count
         if (currentUserMessageCount >= maxMessages) {
             toast({
                 title: 'Message Limit Reached',
                 description: `Free plan allows ${maxMessages} messages per chat. Please upgrade to send more.`,
                 variant: 'destructive',
             });
             return; // Stop submission
         }
         // No need for API call here as count is fetched on load
     }
     // --- End Check ---

     // --- Credit Calculation (Chat Message/Revise) --- 
     const requiredCredits = 5; // Fixed cost for chat messages/revisions
     
     // --- Credit Check (Only if requiredCredits > 0 and tier is not free) --- 
     // The condition `requiredCredits > 0` is now always true, so it simplifies to checking the tier.
     if (tier !== 'free') {
     const hasEnoughCredits = await checkCredits(requiredCredits);
     if (!hasEnoughCredits) {
         toast({ title: "Not enough credits", description: `Sending requires ${requiredCredits} credits.`, variant: "destructive" });
         return; 
         }
     }

     const userMessage = trimmedInput;
     const newUserMessage: Message = { id: Date.now().toString(), content: userMessage, isUser: true };
     setMessages(prev => [...prev, newUserMessage]);
     // Optimistically increment message count for free users
     if (tier === 'free') {
         setCurrentUserMessageCount(prev => prev + 1);
     }
     setInputValue('');
     setIsRevising(true); // Set revising state
     let revisedText = '';

     try {
       const originalText = messages.find(msg => !msg.isUser)?.content || '';
       const { data, error } = await supabase.functions.invoke('revise-copywriting', {
         body: { originalText, userInstructions: userMessage, previousMessages: messages }
       });
       if (error) throw error;

       revisedText = data.revisedText;
       const assistantMessage: Message = { id: (Date.now() + 1).toString(), content: revisedText, isUser: false }; 
       setMessages(prev => [...prev, assistantMessage]);

       // --- Deduct Credits (Only if paid tier) --- 
       if (tier !== 'free') {
           const creditsWereUsed = await deductCredits(requiredCredits, 'chat_interaction', { chatId: currentChatId!, messageLength: userMessage.length }); // Pass chatId
           if (!creditsWereUsed) { 
               console.warn("Revision succeeded, but credit deduction failed."); 
               toast({ title: "Warning", description: "Message sent, but failed to update credits.", variant: "default" });
           } else {
               console.log("Chat message credits deducted successfully.");
           }
       }

       await saveMessagesForUser(currentChatId!, userMessage, revisedText); // Added non-null assertion for currentChatId

     } catch (error) {
         console.error('Error revising or saving:', error);
         setMessages(prev => prev.filter(msg => msg.id !== newUserMessage.id));
         // Revert optimistic message count increment on error
         if (tier === 'free') {
             setCurrentUserMessageCount(prev => Math.max(0, prev - 1));
         }
         toast({ title: "Error", description: "Failed to get response or save message.", variant: "destructive" });
     } finally {
         setIsRevising(false); // Clear revising state
     }
  }, [
     inputValue, 
     messages, 
     currentUser, 
     currentChatId, 
     navigate, 
     checkCredits, 
     deductCredits, 
     isCheckingCredits, 
     isUsingCredits, 
     isRevising, 
     deleteChatMutation.isPending, 
     tier,
     getMaxMessagesPerChat,
     currentUserMessageCount,
     isLoadingUser
 ]);

  const handleNewChat = useCallback(() => { navigate('/frameworks'); }, [navigate]);
  
  const handleDeleteChat = useCallback((chatId: string) => {
    if (!currentUser || deleteChatMutation.isPending) { return; }
    deleteChatMutation.mutate(chatId);
  }, [currentUser, deleteChatMutation.isPending, deleteChatMutation]); // Added mutation to dependency array

  const handleImageGenerated = useCallback(async (imageUrl: string) => {
      // Optimistic UI update with stringified content
      const newImageMessage: Message = {
          id: `image-${Date.now()}`,
          content: JSON.stringify({ type: 'image', url: imageUrl }), // Stringify here too
          isUser: false,
      };
      setMessages(prev => [...prev, newImageMessage]);
      setGeneratedImages(prev => [...prev, imageUrl]);
      toast({ title: "Image Generated!", description: "Image added to chat." });

      // Save to database
      if (currentChatId && !currentChatId.startsWith('temp-')) {
          const saved = await saveImageMessageForUser(currentChatId, imageUrl);
          if (!saved) {
              // Revert optimistic update on save failure
              setMessages(prev => prev.filter(msg => msg.id !== newImageMessage.id));
              // Use correct toast variant here too if needed, already fixed in helper
              // toast({ title: "Save Failed", description: "Could not save image to chat history.", variant: "destructive" });
          }
      } else {
          console.warn("Cannot save image message, chat ID is temporary or missing.");
          // Revert optimistic update if chat ID is bad
          setMessages(prev => prev.filter(msg => msg.id !== newImageMessage.id));
      }
  }, [currentChatId]);

  // --- Derived State --- 
  const lastAssistantTextMessageContent = messages
      .slice()
      .reverse()
      .find(msg => !msg.isUser && !msg.content.startsWith('{"type":"image"') )
      ?.content || ''; 
  const isProcessing = isLoadingMessages || isRevising || isCheckingCredits || isUsingCredits || deleteChatMutation.isPending || isLoadingUser;
  const isInputDisabled = useMemo(() => {
    if (isProcessing) return true;
    if (tier === 'free') {
        if (usage && usage.activeChatCount >= getMaxChats()) return true;
        if (currentUserMessageCount >= getMaxMessagesPerChat()) return true;
    }
    return false;
  }, [isProcessing, tier, usage, getMaxChats, currentUserMessageCount, getMaxMessagesPerChat]);
  const currentChatFileNamePrefix = chats.find(c => c.id === currentChatId)?.title || 'chat-export';
  const showTools = !!lastAssistantTextMessageContent;

  // --- Render Logic --- 
  return (
    <div className="flex flex-col h-screen"> 
        <div className="min-h-screen bg-gradient-to-br from-[#10031F] to-[#1F063A] p-4 flex relative overflow-hidden">
            {/* Background animations */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-[#FF2EE6]/20 via-transparent to-transparent rounded-full -translate-x-1/4 -translate-y-1/4 blur-3xl opacity-60 animate-pulse-slow pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-radial from-[#00FFCC]/15 via-transparent to-transparent rounded-full translate-x-1/4 translate-y-1/4 blur-3xl opacity-70 animate-pulse-slow-delay pointer-events-none"></div>
            
            {/* Left Sidebar (Chat History) */}
            {currentUser && (
                <ChatHistorySidebar 
                    chats={chats}
                    currentChat={currentChatId}
                    currentUser={currentUser}
                    onChatSelect={handleChatSelect}
                    onNewChat={handleNewChat}
                    onDeleteChat={handleDeleteChat}
                />
            )}

            {/* NEW: Main Content Area (Chat + Tools) Wrapper - Flex row */}
            <div className={`flex-1 flex overflow-hidden ${currentUser ? 'md:ml-4' : 'mx-auto'} max-w-full`}> 
                {/* Chat Area (Left Column) */}
                <div className={`flex-1 flex flex-col h-[calc(100vh-2rem)] max-w-4xl bg-[#1a052e]/60 rounded-xl border border-purple-500/20 shadow-lg overflow-hidden`}>
                {/* Top Bar */} 
                <div className="p-2 sticky top-0 bg-[#1a052e]/80 backdrop-blur-sm z-20 flex items-center justify-between border-b border-purple-500/20"> 
                <div className="md:hidden"> 
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-purple-300 hover:text-white hover:bg-purple-500/20" aria-label="Toggle chat history sidebar">
                    <PanelLeft className="h-5 w-5" />
                    </Button>
                </div>
                        {/* Placeholder for potential title or other elements */}
                <div className="hidden md:block flex-1"></div> 
                        {/* Dashboard Button - Should be within the top bar div */}
                <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-purple-300 hover:text-white hover:bg-purple-500/20 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm" title="Go to Dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                </Button>
                    </div> { /* This closing div was missing or misplaced */}

                    {/* Mobile Tool Triggers */} 
                    {showTools && (
                        <div className="flex gap-1 md:hidden"> 
                            {/* Image Generator Modal Trigger */} 
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-purple-300 hover:text-white hover:bg-purple-500/20" title="Generate Image">
                                        <ImageIcon className="h-5 w-5" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#1a052e]/90 border-purple-500/30 text-white p-6 rounded-lg backdrop-blur-xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-white">Image Generation</DialogTitle>
                                    </DialogHeader>
                                    <ImageGenerator 
                                        prompt={lastAssistantTextMessageContent} 
                                        onImageGenerated={handleImageGenerated}
                                        disabled={isProcessing || isInputDisabled}
                                    />
                                </DialogContent>
                            </Dialog>
                            
                            {/* Export Options Modal Trigger */} 
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-purple-300 hover:text-white hover:bg-purple-500/20" title="Export Options">
                                        <DownloadIcon className="h-5 w-5" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#1a052e]/90 border-purple-500/30 text-white p-6 rounded-lg backdrop-blur-xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-white">Export Options</DialogTitle>
                                    </DialogHeader>
                                    <ExportOptions 
                                        content={lastAssistantTextMessageContent}
                                        images={generatedImages}
                                        fileNamePrefix={currentChatFileNamePrefix}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {/* Chat Interface Display */}
                <div className="flex-1 overflow-y-auto"> 
                <ChatInterface 
                    messages={messages}
                    inputValue={inputValue}
                    isLoading={isProcessing} 
                    onSendMessage={handleSendMessage}
                    onInputChange={setInputValue}
                    />
                </div>

                    {/* Chat Input Form */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-purple-500/30 bg-[#1a052e]/80 backdrop-blur-sm">
                        <div className="flex gap-2">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={
                                    isInputDisabled
                                        ? usage && usage.activeChatCount >= getMaxChats()
                                            ? "Maximum active chat limit reached. Upgrade plan."
                                            : "Message limit for this chat reached. Upgrade plan."
                                        : "Type your revision request..."
                                }
                                disabled={isInputDisabled}
                                className="flex-1 bg-[#2D0A4E]/60 border-purple-500/30 focus-visible:ring-[#FF2EE6] text-white placeholder:text-gray-400 backdrop-blur-md disabled:opacity-70 disabled:cursor-not-allowed"
                            />
                            <Button 
                                type="submit" 
                                size="icon" 
                                disabled={isInputDisabled}
                                className="bg-[#FF2EE6] hover:bg-[#FF2EE6]/80 text-white neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isInputDisabled ? (usage && usage.activeChatCount >= getMaxChats() ? "Maximum active chat limit reached" : "Message limit for this chat reached") : "Send message"}
                            >
                                <SendHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                </div>

                {/* NEW: Right Sidebar (Tools) - Conditionally Rendered */}
                {showTools && (
                    <div className="hidden md:flex md:flex-col ml-4 h-[calc(100vh-2rem)]">
                        <ChatToolsSidebar 
                            lastAssistantTextMessageContent={lastAssistantTextMessageContent}
                            handleImageGenerated={handleImageGenerated}
                            generatedImages={generatedImages}
                            isProcessing={isProcessing}
                            isInputDisabled={isInputDisabled} // Pass combined disabled state
                            fileNamePrefix={currentChatFileNamePrefix}/>
                    
                    </div>
                )}
            
            </div>
        </div>
    </div>
  );
};

// Removed the outer component, GeneratedCopy is now the default export
export default GeneratedCopy;


