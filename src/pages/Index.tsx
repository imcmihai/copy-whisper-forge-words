
import { CopywritingForm } from '@/components/CopywritingForm';
import { Sparkles, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      // If user has just signed in, redirect to generated-copy
      if (event === 'SIGNED_IN') {
        navigate('/generated-copy');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleSignUp = () => {
    navigate('/auth?mode=signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] p-4 flex items-center justify-center">
      <div className="w-full max-w-md relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2EE6] via-[#6C22BD] to-[#00FFCC] opacity-30 blur-3xl animate-gradient" />
        
        <div className="glassmorphism relative z-10 p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold neon-text">CopyWhisper</h1>
              <Sparkles className="h-6 w-6 text-[#00FFCC]" />
            </div>
            {user ? null : (
              <div className="flex gap-2">
                <Button 
                  onClick={handleLogin} 
                  variant="outline" 
                  className="bg-[#3a1465]/40 text-white hover:bg-[#4A1A82]/60"
                >
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Button>
                <Button 
                  onClick={handleSignUp} 
                  className="bg-[#FF2EE6] text-white hover:bg-[#FF2EE6]/80"
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                </Button>
              </div>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF2EE6]/20 to-[#00FFCC]/20 blur-xl" />
            <CopywritingForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
