import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        toast({ title: "Not authorized", description: "Please log in to view your profile.", variant: "destructive" });
        navigate('/auth'); // Redirect if not logged in
      } else {
        setUser(user);
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    setIsLoading(false);
    if (error) {
      toast({ title: "Logout Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      navigate('/'); // Redirect to home page after logout
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A052E] to-[#2D0A4E]">
        <p className="text-white animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <Card className="w-full max-w-md p-8 glassmorphism border-purple-500/20">
        <h1 className="text-3xl font-bold text-center mb-6 neon-text">Your Profile</h1>
        <div className="space-y-4 mb-6">
          <p className="text-white/90">Email: <span className="font-medium text-white">{user.email}</span></p>
          {/* Add more profile details here if needed */}
        </div>
        <Button 
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          {isLoading ? 'Logging out...' : 'Logout'}
        </Button>
      </Card>
    </div>
  );
};

export default Profile; 