import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '@/lib/hooks/useUser';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PanelLeft, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, subscription, isLoading, error } = useUser();

  const DashboardLayout = () => {
    const { toggleSidebar } = useSidebar();

    return (
      <div className="flex w-full min-h-screen bg-gradient-to-br from-[#1A052E] to-[#2D0A4E]">
        <AppSidebar user={user!} />
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
          <DashboardContent user={user!} subscription={subscription} />
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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] text-white p-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard Data</h2>
        <p className="text-red-300 mb-4">{error.message || "An unexpected error occurred."}</p>
        <Button onClick={() => navigate('/')} variant="secondary">Go Home</Button>
      </div>
    );
  }

  if (!user) {
    console.error("Dashboard rendered without user after loading and no error.");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A052E] to-[#2D0A4E]">
        <p className="text-white">Authentication error. Redirecting...</p>
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
