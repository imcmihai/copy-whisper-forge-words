import React from 'react';
import { SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton, Sidebar } from '../../components/ui/sidebar';
import { MessageSquare, Plus, X } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/use-toast';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

interface ChatHistoryProps {
  chats: Array<{ id: string; title: string }>;
  currentChat: string | null;
  currentUser: User | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
}

export const ChatHistorySidebar = ({ chats, currentChat, currentUser, onChatSelect, onNewChat, onDeleteChat }: ChatHistoryProps) => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  
  const handleNewChatClick = () => {
    if (currentUser) {
      onNewChat();
    } else {
      toast({
        title: "Authentication Required",
        description: "Sign in to create and save multiple chats.",
        variant: "default",
      });
    }
  };

  const openDeleteConfirm = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      onDeleteChat(chatToDelete);
    }
    setIsAlertOpen(false);
    setChatToDelete(null);
  };

  return (
    <Sidebar className="w-64 bg-[#1F063A]/70 border-r border-purple-500/30 backdrop-blur-xl rounded-lg shadow-2xl overflow-hidden flex flex-col">
      <SidebarContent className="h-full flex flex-col">
        <div className="p-4 border-b border-purple-500/20 flex-shrink-0 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-purple-900">Chat History</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNewChatClick}
            className="text-purple-300 hover:text-white hover:bg-purple-500/10 disabled:opacity-50"
            title="Start New Chat"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
        <SidebarGroup className="p-2 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
          <SidebarMenu>
            {chats.length === 0 ? (
              <p className="text-sm text-gray-400 px-3 py-2 text-center">No chats yet.</p>
            ) : (
              chats.map((chat) => (
                <SidebarMenuItem key={chat.id} className="mb-1 group relative">
                  <SidebarMenuButton 
                    onClick={() => onChatSelect(chat.id)}
                    isActive={chat.id === currentChat}
                    className={`
                      flex items-center justify-between w-full text-left pl-3 pr-8 py-2.5 rounded-lg text-base transition-all duration-200 ease-out group relative overflow-hidden 
                      ${chat.id === currentChat 
                        ? 'bg-gradient-to-r from-[#FF2EE6]/60 to-[#00FFCC]/60 text-white font-semibold shadow-lg scale-[1.02]'
                        : 'text-purple-950 font-medium hover:bg-white/10 hover:text-purple-700 hover:scale-[1.03] focus:bg-white/15 focus:outline-none active:scale-[1.01]'
                      }
                    `}
                  >
                    {chat.id === currentChat && (
                       <span className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-r-full"></span>
                    )}
                    <div className="flex items-center overflow-hidden pl-1">
                      <MessageSquare 
                         className={`mr-2.5 h-6 w-6 flex-shrink-0 transition-colors duration-150 ease-in-out 
                         ${chat.id === currentChat ? 'text-white' : 'text-purple-300 group-hover:text-[#FF2EE6]'}`}
                      />
                      <span className={`truncate ${chat.id === currentChat ? 'font-semibold' : 'font-medium'}`}>
                        {chat.title}
                      </span>
                    </div>
                  </SidebarMenuButton>
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={(e) => openDeleteConfirm(chat.id, e)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out rounded-md z-10"
                    title="Delete Chat"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-[#1F063A] border-purple-500/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This action cannot be undone. This will permanently delete this chat
              history and its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-purple-500/30 hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
};
