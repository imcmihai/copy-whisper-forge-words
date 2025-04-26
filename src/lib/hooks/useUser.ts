import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    getUserSubscription,
    UserSubscription,
    UserUsageCounts, // Import the new interface
    getActiveChatCount, // Import new helpers
    getFeatureUsageCount, // Import new helpers
} from '@/lib/api';
import { User } from '@supabase/supabase-js';
import { useEffect } from 'react';

// Define the structure returned by the hook
interface UseUserReturn {
  user: User | null;
  subscription: UserSubscription | null;
  usage: UserUsageCounts | null; // Add usage counts
  isLoading: boolean;
  error: Error | null;
  mutate: () => void; // Function to manually refetch user/subscription data
}

// Define the query key for React Query
const userQueryKey = ['user', 'subscription', 'usage']; // Updated query key

// Define the data structure fetched by the query function
interface UserData {
    user: User | null;
    subscription: UserSubscription | null;
    usage: UserUsageCounts | null;
}

export const useUser = (): UseUserReturn => {
  const queryClient = useQueryClient();

  // Fetch function combining auth check, subscription, and usage fetch
  const fetchUserData = async (): Promise<UserData> => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
        console.error("Auth error fetching user:", authError);
        return { user: null, subscription: null, usage: null };
    }

    if (!user) {
        // If no user, return null for all
        return { user: null, subscription: null, usage: null };
    }

    // If user exists, fetch subscription and usage details in parallel
    try {
        // Use Promise.all to fetch concurrently
        const [subscription, activeChatCount, imageGenerationCount, textExportCount] = await Promise.all([
            getUserSubscription(), // Fetches subscription details
            getActiveChatCount(), // Fetches active chat count
            getFeatureUsageCount('image_generation'), // Fetches image usage
            getFeatureUsageCount('text_export') // Fetches text export usage
        ]);

        const usage: UserUsageCounts = {
            activeChatCount,
            imageGenerationCount,
            textExportCount
        };

        return { user, subscription, usage };

    } catch (fetchError) {
        console.error("Error fetching subscription or usage data in useUser:", fetchError);
        // Return user but null for subscription/usage on error
        // Decide if partial data is acceptable or if the whole query should fail
        return { user, subscription: null, usage: null };
    }
  };

  // Use React Query to fetch and manage the combined state
  const { data, isLoading, error, refetch } = useQuery<UserData, Error>({
    queryKey: userQueryKey,
    queryFn: fetchUserData,
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: 1, // Retry once on error
    enabled: !!queryClient.getQueryData(['user', 'initialLoadComplete']), // Only run if initial auth check is done (optional optimization)
  });

  // Listen to Supabase auth changes
  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth State Change Detected (useUser): ${event}`);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Invalidate the entire user data query on auth changes
        queryClient.invalidateQueries({ queryKey: userQueryKey });
      }
      // Optional: Mark initial load complete after first SIGNED_IN or initial check
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
           queryClient.setQueryData(['user', 'initialLoadComplete'], true);
      }
    });

    // Trigger initial fetch attempt manually once listener is set up
    // This helps if the component mounts after the INITIAL_SESSION event
    queryClient.prefetchQuery({ queryKey: userQueryKey, queryFn: fetchUserData });

    return () => {
      console.log("Unsubscribing auth listener (useUser)");
      authSubscription?.unsubscribe();
    };
  }, [queryClient]); // Dependency array includes queryClient

  const mutate = () => {
    queryClient.invalidateQueries({ queryKey: userQueryKey });
  };

  return {
    user: data?.user ?? null,
    subscription: data?.subscription ?? null,
    usage: data?.usage ?? null, // Return usage counts
    isLoading,
    error: error || null,
    mutate,
  };
}; 