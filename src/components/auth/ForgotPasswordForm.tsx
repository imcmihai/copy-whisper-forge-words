import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Adjusted path
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast'; 
import { Link } from 'react-router-dom';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Construct the redirect URL dynamically
    const redirectUrl = `${window.location.origin}/reset-password`; 

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast({
        title: 'Error sending reset email',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Don't set local message, rely on toast
      toast({
        title: 'Check your email',
        description: 'A password reset link has been sent to your email address.',
      });
      setEmail(''); // Clear the input field on success
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-purple-500/30 shadow-xl rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white">Forgot Password</CardTitle>
          <CardDescription className="text-purple-300 pt-2">
            Enter your email to receive a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
          <form onSubmit={handlePasswordReset} className="space-y-4">
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
            <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] text-white font-semibold py-2 rounded-md transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
           <div className="mt-6 text-center text-sm">
             <Link to="/auth" 
                   className="text-purple-300 hover:text-[#00FFCC] underline">
               Back to Login
             </Link>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordForm; 