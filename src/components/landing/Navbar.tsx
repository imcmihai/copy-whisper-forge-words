import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

interface NavbarProps {
  currentUser: User | null;
  isLoading: boolean;
}

export const Navbar = ({ currentUser, isLoading }: NavbarProps) => {
  const navigate = useNavigate();
  
  return (
    <nav className="fixed w-full z-50 bg-gradient-to-r from-[#1A052E]/80 to-[#2D0A4E]/80 backdrop-blur-md border-b border-purple-500/20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold neon-text">CopyWhisper</h1>
        </div>

        <div className="flex gap-4 items-center">
          {!isLoading && (
            currentUser ? (
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] hover:opacity-90"
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/auth')}
                  className="text-purple-300 hover:text-white hover:bg-purple-500/20"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => navigate('/auth?mode=signup')}
                  className="bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] hover:opacity-90"
                >
                  Sign Up Free
                </Button>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );
};
