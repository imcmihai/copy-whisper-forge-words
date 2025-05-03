import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { supabase } from '@/integrations/supabase/client'; // Adjusted path
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const ResetPasswordForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Use state for inline error
  const navigate = useNavigate();
  const { toast } = useToast();

  // IMPORTANT: Supabase handles the token automatically when the user
  // lands on this page via the link. The updateUser function below
  // works because the session/user object has been updated internally
  // by the Supabase client library upon detecting the recovery token in the URL.
  // You might need a global Auth Listener (onAuthStateChange) in your App.tsx
  // or context provider to ensure the user state is correctly updated application-wide
  // when the recovery event happens.

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    // Consider adding more robust password strength checks
    if (password.length < 6) { 
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    // Use updateUser to set the new password for the logged-in user (via recovery link)
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message); // Show error inline
      toast({
        title: 'Error updating password',
        description: updateError.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password Updated',
        description: 'Your password has been reset successfully. You can now log in.',
      });
      // Redirect to login after a delay
      setTimeout(() => navigate('/auth'), 3000); // Redirect to the main Auth page
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-purple-500/30 shadow-xl rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white">Reset Your Password</CardTitle>
          <CardDescription className="text-purple-300 pt-2">
            Enter and confirm your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-purple-300">New Password</Label>
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
              <Label htmlFor="confirmPassword" className="text-purple-300">Confirm New Password</Label>
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
            {error && <p className="text-sm text-red-400">{error}</p>} 
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] text-white font-semibold py-2 rounded-md transition-all duration-200 hover:opacity-90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordForm; 