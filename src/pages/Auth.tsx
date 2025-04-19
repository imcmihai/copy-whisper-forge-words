
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isSignUp = searchParams.get('mode') === 'signup';
  
  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Redirect to generated-copy if already logged in
        navigate('/generated-copy');
      }
    };
    
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          toast({
            title: 'Sign Up Error',
            description: error.message,
            variant: 'destructive'
          });
          return;
        }

        toast({
          title: 'Sign Up Successful',
          description: 'Please check your email to confirm your account.',
        });
        
        // Redirect to the generated-copy page
        navigate('/generated-copy');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            title: 'Login Error',
            description: error.message,
            variant: 'destructive'
          });
          return;
        }

        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
        
        // Redirect to the generated-copy page instead of home
        navigate('/generated-copy');
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] p-4 flex items-center justify-center">
      <Card className="w-full max-w-md p-8 glassmorphism border-purple-500/20">
        <h1 className="text-3xl font-bold text-center mb-6 neon-text">
          {isSignUp ? 'Sign Up' : 'Login'}
        </h1>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-white/90">Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="bg-[#3a1465]/40 border-purple-500/30 text-white placeholder:text-gray-400 focus-visible:ring-[#FF2EE6] backdrop-blur-md"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-white/90">Password</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="bg-[#3a1465]/40 border-purple-500/30 text-white placeholder:text-gray-400 focus-visible:ring-[#FF2EE6] backdrop-blur-md"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] hover:opacity-90 text-white font-medium py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,46,230,0.5)]"
          >
            {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-white/70">
              {isSignUp 
                ? 'Already have an account? ' 
                : 'Don\'t have an account? '}
              <a 
                href={isSignUp ? '/auth' : '/auth?mode=signup'} 
                className="text-[#FF2EE6] hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(isSignUp ? '/auth' : '/auth?mode=signup');
                }}
              >
                {isSignUp ? 'Login' : 'Sign Up'}
              </a>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
