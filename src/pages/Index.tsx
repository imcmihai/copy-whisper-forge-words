
import { CopywritingForm } from '@/components/CopywritingForm';
import { Sparkles, LogIn, UserPlus, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

const Index = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        setCurrentUser(session?.user ?? null);
        setIsLoading(false);
      }
    };
    
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
       if (isMounted) {
         setCurrentUser(session?.user ?? null);
         setIsLoading(false);
       }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Redirect to dashboard if user is logged in
  if (!isLoading && currentUser) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] p-4 flex flex-col items-center justify-center relative">
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {currentUser ? (
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="ghost"
            size="icon"
            className="text-purple-300 hover:text-white hover:bg-purple-500/20 rounded-full"
            title="Go to Dashboard"
          >
            <UserIcon className="h-5 w-5" />
          </Button>
        ) : (
          <>
            <Button 
              onClick={() => navigate('/auth')}
              variant="outline" 
              className="bg-[#3a1465]/40 text-white hover:bg-[#4A1A82]/60 border-purple-500/30"
            >
              <LogIn className="mr-2 h-4 w-4" /> Login
            </Button>
            <Button 
              onClick={() => navigate('/auth?mode=signup')}
              className="bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] text-white hover:opacity-90 shadow-[0_0_10px_rgba(255,46,230,0.4)]"
            >
              <UserPlus className="mr-2 h-4 w-4" /> Sign Up
            </Button>
          </>
        )}
      </div>

      <div className="w-full max-w-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2EE6] via-[#6C22BD] to-[#00FFCC] opacity-10 blur-3xl animate-gradient -z-10" />
        
        <div className="glassmorphism relative z-10 p-8 rounded-2xl border border-purple-500/20 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold neon-text mb-2">CopyWhisper</h1>
            <p className="text-lg text-gray-300 flex items-center justify-center gap-2">
              Generate amazing copy with AI <Sparkles className="h-5 w-5 text-[#00FFCC]" />
            </p>
          </div>
          
          <CopywritingForm />
        </div>
      </div>
    </div>
  );
};

export default Index;
