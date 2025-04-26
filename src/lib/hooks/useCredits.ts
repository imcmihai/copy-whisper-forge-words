import { useState } from 'react';
import { useUser } from './useUser'; // Assuming this will be created in the same directory
import { supabase } from '@/integrations/supabase/client'; // Adjusted path based on Auth.tsx
import { toast } from "@/components/ui/use-toast"; // Added for user feedback

// Placeholder types - align with your actual useUser hook return type
// type User = { id: string } | null;
// type Subscription = { creditsRemaining: number } | null;
// type MutateUser = () => void; // Placeholder for SWR/React Query mutate or similar state update function

// // Placeholder useUser hook - REMOVED
// const useUser = (): { user: User; subscription: Subscription; mutate: MutateUser } => ({
//   user: { id: 'temp-user-id' }, // Example user
//   subscription: { creditsRemaining: 1500 }, // Example subscription
//   mutate: () => console.log('Mutate user data...') // Example mutate function
// });


export const useCredits = () => {
  const { user, subscription, mutate } = useUser(); // Replace with actual hook import later
  const [isChecking, setIsChecking] = useState(false);
  const [isUsing, setIsUsing] = useState(false); // Added state for useCredits operation

  /**
   * Checks if the user has enough credits for a given action.
   * @param requiredCredits The number of credits needed.
   * @returns True if the user has enough credits, false otherwise.
   */
  const checkCredits = async (requiredCredits: number): Promise<boolean> => {
    // Ensure user and subscription data are loaded and valid
    if (!user || !subscription || typeof subscription.creditsRemaining !== 'number') {
        console.warn('User or subscription data not available for credit check.');
        return false; 
    }
    // Ensure requiredCredits is a positive number
    if (requiredCredits <= 0) {
        console.warn('Required credits must be a positive number.');
        return false;
    }

    setIsChecking(true);

    try {
      // Fetch the latest credits remaining directly for accuracy, or rely on the hook's data
      // Option 1: Rely on potentially stale data from the hook (simpler)
      const { creditsRemaining } = subscription;

      // Option 2: Fetch fresh data (more reliable but adds latency)
      // const { data, error } = await supabase
      //   .from('users') // Assuming your table is named 'users'
      //   .select('credits_remaining')
      //   .eq('id', user.id)
      //   .single();
      // if (error || !data) {
      //   console.error('Error fetching latest credits:', error);
      //   return false;
      // }
      // const creditsRemaining = data.credits_remaining;

      return creditsRemaining >= requiredCredits;

    } catch (error) {
      console.error('Error checking credits:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Deducts credits from the user's account for using a feature.
   * Calls the 'use_credits' database function.
   * @param amount The number of credits to deduct.
   * @param featureType A string identifying the feature being used.
   * @param metadata Optional JSON object for additional usage details.
   * @returns True if credits were successfully deducted, false otherwise.
   */
  const useCredits = async (amount: number, featureType: string, metadata = {}): Promise<boolean> => {
    // Basic validation
    if (!user || !subscription) {
        console.warn('User or subscription data not available for using credits.');
        return false;
    }
     if (amount <= 0) {
        console.warn('Credit usage amount must be a positive number.');
        return false;
    }

    // --- Add a check for valid user ID ---
    if (!user || !user.id || user.id.startsWith('temp-') || user.id.length !== 36) { // Basic UUID length check
        console.error('Attempted to use credits with invalid or temporary user ID:', user?.id);
        toast({ title: "Authentication Error", description: "Cannot use credits without a valid user session.", variant: "destructive" });
        return false;
    }
    // --- End check ---

    setIsUsing(true);

    try {
      // Optional: Re-check credits immediately before attempting to use them
      const hasEnough = await checkCredits(amount);
      if (!hasEnough) {
          console.log('Attempted to use credits, but not enough available.');
          // Optionally trigger a notification to the user (e.g., using toast)
          toast({ title: "Not enough credits", description: `Requires ${amount} credits. Upgrade your plan or wait for renewal.`, variant: "warning" }); // Updated toast message
          return false;
      }

      // Call the Supabase database function to deduct credits and log usage
      const { data: success, error } = await supabase.rpc('use_credits', {
        p_user_id: user.id,
        p_amount: amount,
        p_feature_type: featureType,
        p_metadata: metadata
      });

      if (error) {
          console.error('Error calling use_credits function:', error);
           toast({ title: "Credit Usage Error", description: "Could not deduct credits. Please try again later.", variant: "destructive" }); // Added error toast
          throw error; // Re-throw to be caught by the outer catch block
      }
      
      if (!success) {
          console.warn('use_credits function returned false, likely insufficient credits on server-side check.');
          // Handle case where server-side check failed even if client-side passed (race condition, etc.)
          toast({ title: "Credit usage failed", description: "There might have been an issue deducting credits.", variant: "warning" }); // Updated toast message
          return false;
      }

      // If successful, trigger a refresh of the user/subscription data
      // This ensures the UI reflects the new credit balance.
      // The exact method depends on your state management (SWR, React Query, Zustand, Context API)
      mutate(); // Call the mutate function from useUser hook

      console.log(`Successfully used ${amount} credits for ${featureType}.`);
      return true;

    } catch (error) {
      console.error('Error using credits:', error);
      // Optionally show a generic error to the user
      toast({ title: "Error", description: "Could not process credit usage.", variant: "destructive" }); // Updated toast message
      return false;
    } finally {
        setIsUsing(false);
    }
  };

  return {
    checkCredits,
    useCredits,
    isChecking,
    isUsing, // Expose the loading state for the useCredits action
  };
}; 