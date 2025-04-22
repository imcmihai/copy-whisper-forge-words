
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare, TrendingUp, Clock, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

interface DashboardContentProps {
  user: User | null;
}

export function DashboardContent({ user }: DashboardContentProps) {
  const navigate = useNavigate();
  const [recentCopies, setRecentCopies] = useState<Tables<'copywriting_texts'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCopies: 0,
    totalChats: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        // Fetch recent copywriting texts
        const { data: copies, error: copiesError } = await supabase
          .from('copywriting_texts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (!copiesError && copies) {
          setRecentCopies(copies);
        }

        // Get total copies count
        const { count: totalCopies } = await supabase
          .from('copywriting_texts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get total chats count
        const { count: totalChats } = await supabase
          .from('chat_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setStats({
          totalCopies: totalCopies || 0,
          totalChats: totalChats || 0
        });
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, [user]);

  const handleCreateNewCopy = () => {
    navigate('/');
  };

  const handleGoToChats = () => {
    navigate('/generated-copy');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold neon-text">Dashboard</h1>
        <Button 
          onClick={handleCreateNewCopy}
          className="bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] text-white font-semibold px-4 py-2 rounded-md transition-all duration-200 hover:opacity-90"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Create New Copy
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white/5 backdrop-blur-lg border-purple-500/20 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-[#00FFCC]" />
              Activity Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-sm text-purple-300">Total Copies</p>
                <p className="text-2xl font-semibold neon-text">{stats.totalCopies}</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-sm text-purple-300">Total Chats</p>
                <p className="text-2xl font-semibold neon-text">{stats.totalChats}</p>
              </div>
            </div>
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

        <Card className="bg-white/5 backdrop-blur-lg border-purple-500/20 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5 text-[#9b87f5]" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleCreateNewCopy}
              className="w-full bg-gradient-to-r from-[#6C22BD] to-[#9b87f5] text-white font-medium py-2 rounded-md transition-all duration-200 hover:opacity-90"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Copy
            </Button>
            <Button 
              onClick={handleGoToChats}
              variant="outline" 
              className="w-full border-purple-500/30 text-white hover:bg-purple-500/20"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              View Chats
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Copies Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-[#00FFCC]" />
          Recent Copies
        </h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-purple-300 animate-pulse">Loading recent copies...</p>
          </div>
        ) : recentCopies.length > 0 ? (
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
