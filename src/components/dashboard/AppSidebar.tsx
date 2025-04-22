
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { UserCircle, PlusCircle, MessageSquare, LayoutDashboard } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AppSidebarProps {
  user: User | null;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleCreateCopyClick = () => {
    navigate('/');  // Redirects to the Index page, which contains the CopywritingForm
  };

  const handleChatClick = () => {
    navigate('/generated-copy');  // Redirects to the Copy Chats page
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 px-2">
          <div className="relative cursor-pointer" onClick={handleProfileClick}>
            <Avatar className="h-10 w-10 border-2 border-purple-500/50">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-[#6C22BD] to-[#9b87f5] text-white">
                {user?.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-sm font-medium text-white overflow-hidden text-ellipsis">
              {user?.email?.split('@')[0] || 'User'}
            </h3>
            <p className="text-xs text-purple-300/80 overflow-hidden text-ellipsis">
              {user?.email || 'Anonymous'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <div className="mb-6">
          <Button 
            className="w-full bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] text-white font-semibold py-2 rounded-md transition-all duration-200 hover:opacity-90"
            onClick={handleCreateCopyClick}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Copy
          </Button>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={window.location.pathname === '/dashboard'} 
              onClick={handleDashboardClick}
              tooltip="Dashboard"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={window.location.pathname === '/generated-copy'} 
              onClick={handleChatClick}
              tooltip="Copy Chats"
            >
              <MessageSquare className="h-5 w-5" />
              <span>Copy Chats</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={window.location.pathname === '/profile'} 
              onClick={handleProfileClick}
              tooltip="Profile"
            >
              <UserCircle className="h-5 w-5" />
              <span>My Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="text-center text-xs text-purple-300/60">
          <p>CopyWhisper © 2025</p>
          <p>AI-Powered Copywriting</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
