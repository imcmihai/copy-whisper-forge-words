import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
  
        if (error) {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login successful",
            description: "Welcome back!",
          });
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error('Login error:', error);
        toast({
          title: "Something went wrong",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
  };

  return (
    <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-purple-500/30 shadow-xl rounded-2xl mt-6">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-white">Welcome Back</CardTitle>
        <CardDescription className="text-purple-300 pt-2">
          Log in to access your AI copywriting tools.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 px-8 pb-6">
        <form onSubmit={handleLogin} className="space-y-4">
           {/* Email Input */}
           <div className="grid gap-2">
             <Label htmlFor="email" className="text-purple-300">Email</Label>
             <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                disabled={loading}
                className="w-full bg-white/5 border border-purple-500/30 text-white placeholder-purple-300/50 rounded-md transition-all duration-200 ease-in-out focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 focus:outline-none hover:border-purple-400/70"
              /> 
           </div>
           {/* Password Input */}
           <div className="grid gap-2">
             <Label htmlFor="password" className="text-purple-300">Password</Label>
             <Input 
                id="password" 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-white/5 border border-purple-500/30 text-white placeholder-purple-300/50 rounded-md transition-all duration-200 ease-in-out focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 focus:outline-none hover:border-purple-400/70"
              /> 
           </div>
           {/* Submit Button */}
           <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] text-white font-semibold py-2 rounded-md transition-all duration-200 hover:opacity-90 disabled:opacity-50"
              disabled={loading}
            > 
             {loading ? 'Signing in...' : 'Sign in'}
           </Button>
         </form>
         {/* Forgot Password Link */}
         <div className="mt-4 text-center text-sm">
           <Link
             to="/forgot-password"
             className="text-purple-300 hover:text-[#00FFCC] underline"
           >
             Forgot your password?
           </Link>
         </div>
       </CardContent>
       {/* Optional: Link to Sign Up - You might want to activate this later */}
        <CardFooter className="text-center text-sm justify-center pb-8">
          <span className="text-purple-300">Don't have an account?</span>
          <button 
            onClick={() => document.querySelector('[data-state="inactive"][value="signup"]')?.click()} 
            className="underline ml-1 text-[#00FFCC] hover:text-[#FF2EE6]"
          >
            Sign up
          </button> 
        </CardFooter>
     </Card>
  );
};

export default LoginForm; 