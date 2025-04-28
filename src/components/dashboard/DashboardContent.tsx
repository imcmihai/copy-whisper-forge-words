import { User } from '@supabase/supabase-js';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare, TrendingUp, Clock, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { UserSubscription } from '@/lib/api';
import ActiveChatsDisplay from '@/components/ActiveChatsDisplay';

interface DashboardContentProps {
  user: User | null;
  subscription: UserSubscription | null;
}

// --- React Query Fetching Functions ---

// Fetch counts for stats
const fetchDashboardStats = async (userId: string) => {
  const { count: totalCopies, error: copiesError } = await supabase
    .from('copywriting_texts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (copiesError) throw copiesError;

  const { count: totalChats, error: chatsError } = await supabase
    .from('chat_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (chatsError) throw chatsError;

  return { totalCopies: totalCopies || 0, totalChats: totalChats || 0 };
};

// Fetch recent copies
const fetchRecentCopies = async (userId: string) => {
  const { data: copies, error } = await supabase
    .from('copywriting_texts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) throw error;
  return copies || [];
};

export function DashboardContent({ user, subscription }: DashboardContentProps) {
  const navigate = useNavigate();
  const userId = user?.id;

  // --- React Query Hooks ---

  // Query for dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboardStats', userId],
    queryFn: () => fetchDashboardStats(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Query for recent copies
  const { data: recentCopies, isLoading: isLoadingCopies } = useQuery({
    queryKey: ['recentCopies', userId],
    queryFn: () => fetchRecentCopies(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
  
  // Combined loading state (or handle individually)
  const isLoading = isLoadingStats || isLoadingCopies;

  // --- Event Handlers ---
  const handleCreateNewCopy = () => {
    navigate('/frameworks');
  };

  const handleGoToChats = () => {
    navigate('/generated-copy');
  };

  // Helper to capitalize tier name
  const capitalize = (s: string | null | undefined) => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Free';

  // --- Render Logic ---
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      {/* --- User/Subscription Info Header --- */}
      <div className="mb-8 p-6 border border-purple-500/20 rounded-lg bg-white/5 backdrop-blur-lg shadow-lg">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Welcome back, <span className="neon-text">{user?.email || 'User'}</span>
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Current Plan Display */}
              <div className="bg-white/10 p-4 rounded-md">
                  <p className="text-sm text-purple-300 mb-1">Current Plan</p>
                  <p className="font-semibold text-lg text-white capitalize">
                      {capitalize(subscription?.tier)} 
                  </p>
              </div>
              
              {/* Replace CreditDisplay with ActiveChatsDisplay */}
              <div className="md:col-span-1">
                  <ActiveChatsDisplay />
              </div>

              {/* Upgrade Button */} 
              {subscription?.tier !== 'pro' && (
                  <div className="flex items-center justify-center md:justify-end h-full">
                      <Button 
                          asChild
                          className="bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] text-white font-semibold px-5 py-2.5 rounded-md transition-all duration-200 hover:opacity-90 shadow-md"
                      >
                          <Link to="/pricing">Upgrade Plan</Link>
                      </Button>
                  </div>
              )}
          </div>
      </div>

      {/* Action Buttons Bar */} 
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <div className="flex gap-3">
            <Button 
              onClick={handleCreateNewCopy}
              className="bg-gradient-to-r from-[#6C22BD] to-[#9b87f5] text-white font-medium py-2 px-4 rounded-md transition-all duration-200 hover:text-black hover:bg-white shadow-sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Copy
            </Button>
            <Button 
              onClick={handleGoToChats}
              variant="outline" 
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-white py-2 px-4 rounded-md shadow-sm"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              View Chats
            </Button>
        </div>
      </div>

      {/* Stats & Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white/5 backdrop-blur-lg border-purple-500/20 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-[#00FFCC]" />
              Activity Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
               <p className="text-purple-300 animate-pulse">Loading stats...</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <p className="text-sm text-purple-300">Total Copies</p>
                  <p className="text-2xl font-semibold neon-text">{stats?.totalCopies ?? 0}</p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <p className="text-sm text-purple-300">Total Chats</p>
                  <p className="text-2xl font-semibold neon-text">{stats?.totalChats ?? 0}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-lg border-purple-500/20 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Star className="mr-2 h-5 w-5 text-[#FF2EE6]" />
              Quick Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li className="flex items-start">
                <div className="h-1.5 w-1.5 rounded-full bg-[#00FFCC] mt-1.5 mr-2"></div>
                <span>Be specific with your product descriptions</span>
              </li>
              <li className="flex items-start">
                <div className="h-1.5 w-1.5 rounded-full bg-[#00FFCC] mt-1.5 mr-2"></div>
                <span>Specify your target audience in the niche field</span>
              </li>
              <li className="flex items-start">
                <div className="h-1.5 w-1.5 rounded-full bg-[#00FFCC] mt-1.5 mr-2"></div>
                <span>Use the chat to refine your generated copy</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="hidden lg:block bg-transparent border-none"></Card>
      </div>

      {/* Recent Copies Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-[#00FFCC]" />
          Recent Copies
        </h2>
        
        {isLoadingCopies ? (
          <div className="text-center py-8">
            <p className="text-purple-300 animate-pulse">Loading recent copies...</p>
          </div>
        ) : recentCopies && recentCopies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentCopies.map((copy) => (
              <Card key={copy.id} className="bg-white/5 backdrop-blur-lg border-purple-500/20 text-white hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="text-lg truncate">{copy.product_name}</CardTitle>
                  <CardDescription className="text-purple-300 truncate">
                    Niche: {copy.niche}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300 line-clamp-3">
                    {copy.generated_text.substring(0, 120)}...
                  </p>
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-purple-300/70">
                    Created: {new Date(copy.created_at).toLocaleDateString()}
                  </p>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/5 backdrop-blur-lg border-purple-500/20 text-white p-6">
            <div className="text-center">
              <p className="text-purple-300 mb-4">You haven't created any copies yet</p>
              <Button 
                onClick={handleCreateNewCopy}
                className="bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] text-white font-semibold py-2 rounded-md transition-all duration-200 hover:opacity-90"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Your First Copy
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Feature Highlight Section */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Feature Highlight</h2>
        <Card className="bg-white/5 backdrop-blur-lg border-purple-500/20 text-white overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2 neon-text">AI-Powered Chat Revisions</h3>
              <p className="text-sm text-gray-300 mb-4">
                Did you know you can chat with our AI to refine your generated copy? 
                Our intelligent chat system allows you to request specific changes, 
                adjustments to tone, or completely new variations.
              </p>
              <Button 
                onClick={handleGoToChats}
                variant="secondary" 
                className="bg-[#3a1465]/40 text-white hover:bg-[#4A1A82]/60 border-purple-500/30"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Try Chat Revisions
              </Button>
            </div>
            <div className="bg-gradient-to-br from-[#6C22BD] to-[#9b87f5] p-6 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-white mx-auto mb-2 opacity-80" />
                <p className="text-sm text-white/80">
                  "Refine, enhance, and perfect your copy through conversation"
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
