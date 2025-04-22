import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
      setIsLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session) {
          navigate('/auth');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const DashboardLayout = () => {
    const { toggleSidebar } = useSidebar();

    return (
      <div className="flex w-full min-h-screen bg-gradient-to-br from-[#1A052E] to-[#2D0A4E]">
        <AppSidebar user={user} />
        <div className="flex-grow flex flex-col">
          <div className="md:hidden p-2 sticky top-0 bg-[#1A052E]/80 backdrop-blur-sm z-20 flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar} 
              className="text-purple-300 hover:text-white hover:bg-purple-500/20"
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          </div>
          <DashboardContent user={user} />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A052E] to-[#2D0A4E]">
        <p className="text-white animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <DashboardLayout />
    </SidebarProvider>
  );
};

export default Dashboard;
