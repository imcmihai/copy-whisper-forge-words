import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Adjusted path
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter, // Ensure CardFooter is imported if used
  } from "@/components/ui/card";
import { useToast } from '@/components/ui/use-toast'; 
import { useNavigate } from 'react-router-dom';

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Add confirm password state
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: "Please ensure both passwords are the same.",
          variant: "destructive",
        });
        return;
      }

    // Add password strength check if desired
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        // Options like email confirmation can be added here if enabled in Supabase
        // options: {
        //   emailRedirectTo: window.location.origin,
        // }
      });

      if (error) {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signup successful!",
          description: "Please check your email to confirm your account if required, otherwise you can log in.", // Adjust message based on email confirmation setting
        });
        // Optionally navigate to dashboard or show a message
        // navigate('/dashboard'); 
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Something went wrong",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-purple-500/30 shadow-xl rounded-2xl mt-6">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-white">Create Account</CardTitle>
        <CardDescription className="text-purple-300 pt-2">
          Sign up to start generating amazing copy with AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 px-8 pb-6">
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label htmlFor="password" className="text-purple-300">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-white/5 border border-purple-500/30 text-white placeholder-purple-300/50 rounded-md transition-all duration-200 ease-in-out focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 focus:outline-none hover:border-purple-400/70"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-purple-300">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-white/5 border border-purple-500/30 text-white placeholder-purple-300/50 rounded-md transition-all duration-200 ease-in-out focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 focus:outline-none hover:border-purple-400/70"
            />
          </div>
          <Button 
             type="submit" 
             className="w-full bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] text-white font-semibold py-2 rounded-md transition-all duration-200 hover:opacity-90 disabled:opacity-50"
             disabled={loading}
            >
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-center text-sm justify-center pb-8">
        <span className="text-purple-300">Already have an account?</span>
        <button 
            onClick={() => document.querySelector('[data-state="inactive"][value="login"]')?.click()} 
            className="underline ml-1 text-[#00FFCC] hover:text-[#FF2EE6]"
          >
            Login
        </button> 
      </CardFooter>
    </Card>
  );
};

export default SignupForm; 