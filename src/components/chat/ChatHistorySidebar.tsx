
import { SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton, Sidebar } from '@/components/ui/sidebar';

interface ChatHistoryProps {
  chats: Array<{ id: string; title: string }>;
  currentChat: string | null;
  onChatSelect: (chatId: string) => void;
}

export const ChatHistorySidebar = ({ chats, currentChat, onChatSelect }: ChatHistoryProps) => {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {chats.map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <SidebarMenuButton 
                  onClick={() => onChatSelect(chat.id)}
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
  );
};
