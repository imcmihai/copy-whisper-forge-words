import { supabase } from '@/integrations/supabase/client'; // Ensure this path is correct
import { User } from '@supabase/supabase-js';

// Define the expected structure for user subscription data
// Align this with the columns selected in getUserSubscription and your actual database schema
export interface UserSubscription {
  tier: string | null;
  creditsRemaining: number | null;
  creditsTotal: number | null;
  startDate: string | null; // ISO date string
  endDate: string | null; // ISO date string
  stripeSubscriptionId: string | null;
}

// Define the expected structure for credit transaction data
// Align this with the columns in your credit_transactions table
export interface CreditTransaction {
  id: number;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string; // ISO date string
}

// --- NEW: Interface for Usage Counts ---
export interface UserUsageCounts {
    activeChatCount: number;
    imageGenerationCount: number;
    textExportCount: number;
}
// --- END NEW ---

/**
 * Invokes the Supabase Edge Function to create a Stripe Checkout session.
 * @param {object} payload - The data to send to the function.
 * @param {string} payload.priceId - The Stripe Price ID for the plan.
 * @param {string} payload.userId - The ID of the user subscribing.
 * @param {string} payload.returnUrl - The URL to redirect to after checkout.
 * @returns {Promise<{ url: string }>} A promise resolving to the Stripe Checkout session URL.
 * @throws Will throw an error if the function invocation fails.
 */
export const createCheckoutSession = async ({
  priceId,
  userId,
  returnUrl,
}: {
  priceId: string;
  userId: string;
  returnUrl: string;
}): Promise<{ url: string }> => {
  console.log('Invoking create-checkout-session with:', { priceId, userId, returnUrl });
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId, userId, returnUrl },
  });

  if (error) {
    console.error('Error invoking create-checkout-session:', error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }

  if (!data || !data.url) {
      console.error('Invalid response from create-checkout-session:', data);
      throw new Error('Failed to get checkout URL from the server.');
  }
  
  console.log('Received checkout URL:', data.url);
  return data; // Should contain { url: string }
};

/**
 * Invokes the Supabase Edge Function to generate an image.
 * @param {object} payload - The data to send to the function.
 * @param {string} payload.prompt - The prompt for image generation.
 * @returns {Promise<{ imageUrl: string }>} A promise resolving to the generated image URL.
 * @throws Will throw an error if the function invocation fails.
 */
export const generateImage = async ({
  prompt,
}: {
  prompt: string;
}): Promise<{ imageUrl: string }> => {
  console.log('Invoking generate-image with prompt:', { prompt: prompt.substring(0, 50) + '...' });
  const { data, error } = await supabase.functions.invoke('generate-image', {
    body: { prompt },
  });

  if (error) {
    console.error('Error invoking generate-image:', error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
  
  if (!data || !data.imageUrl) {
      console.error('Invalid response from generate-image:', data);
      throw new Error('Failed to get image URL from the server.');
  }

  console.log('Received image URL:', data.imageUrl);
  return data; // Should contain { imageUrl: string }
};

/**
 * Fetches the current user's subscription details from the database.
 * Assumes the user is already authenticated via Supabase Auth.
 * @returns {Promise<UserSubscription | null>} A promise resolving to the user's subscription data or null if not found/error.
 * @throws Will throw an error if the user is not authenticated.
 */
export const getUserSubscription = async (): Promise<UserSubscription | null> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
      console.warn('getUserSubscription called but user is not authenticated.');
      throw new Error('User not authenticated');
  }

  try {
    // Adjust the table name to 'profiles' if that's what you use
    const { data, error, status } = await supabase
      .from('profiles') // Or 'users' depending on your table name
      .select(`
        subscription_tier,
        credits_remaining,
        credits_total,
        subscription_start_date,
        subscription_end_date,
        stripe_subscription_id
      `)
      .eq('user_id', user.id)
      .single(); // Use single() as each user should have one profile/subscription row

    if (error && status !== 406) {
      // 406 status means no row found, which is not necessarily an error here (e.g., new user)
      console.error('Error fetching user subscription:', error);
      throw error;
    }

    if (!data) {
        console.log(`No subscription data found for user ${user.id}. Returning default free state.`);
        // Return a default structure for a free user if no record exists
        return {
            tier: 'free',
            creditsRemaining: 100, // Default free credits
            creditsTotal: 100, // Default free credits
            startDate: null,
            endDate: null,
            stripeSubscriptionId: null,
        };
    }

    // Map database columns to the UserSubscription interface
    return {
      tier: data.subscription_tier,
      creditsRemaining: data.credits_remaining,
      creditsTotal: data.credits_total,
      startDate: data.subscription_start_date,
      endDate: data.subscription_end_date,
      stripeSubscriptionId: data.stripe_subscription_id,
    };

  } catch (error) {
      console.error('Unexpected error in getUserSubscription:', error);
      // Depending on requirements, you might want to return null or re-throw
      return null; 
  }
};

/**
 * Fetches the credit transaction history for the current user.
 * Assumes the user is already authenticated.
 * @returns {Promise<CreditTransaction[]>} A promise resolving to an array of credit transactions.
 * @throws Will throw an error if the user is not authenticated or if the query fails.
 */
export const getCreditHistory = async (): Promise<CreditTransaction[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.warn('getCreditHistory called but user is not authenticated.');
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('credit_transactions') // Ensure this table name is correct
    .select('*') // Select all columns explicitly defined in the interface
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }); // Show most recent first

  if (error) {
    console.error('Error fetching credit history:', error);
    throw error;
  }

  return data || []; // Return fetched data or an empty array if null/undefined
}; 

// --- NEW: Function to get active chat count ---
/**
 * Fetches the count of non-archived chats for the current user.
 * Assumes the user is authenticated.
 * @returns {Promise<number>} The count of active chats.
 */
export const getActiveChatCount = async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
        // Assuming 'chats' table and an 'is_archived' or similar boolean column
        // Modify query based on your actual schema for identifying active chats
        const { count, error } = await supabase
            .from('chat_history') // CORRECTED TABLE NAME
            .select('*', { count: 'exact', head: true }) // Efficiently count rows
            .eq('user_id', user.id)
            // Assuming 'is_deleted' does not exist on chat_history, remove this line or adjust based on schema
            // .eq('is_deleted', false); // REMOVED - Adjust if your schema has this

        if (error) {
            console.error('Error fetching active chat count:', error);
            throw error;
        }
        return count ?? 0;
    } catch (error) {
        console.error('Unexpected error in getActiveChatCount:', error);
        return 0; // Return 0 on error
    }
};
// --- END NEW ---

// --- NEW: Function to get user message count in a specific chat ---
/**
 * Fetches the count of messages sent by the user in a specific chat.
 * @param {string} chatId - The ID of the chat to check.
 * @returns {Promise<number>} The count of user messages in the chat.
 */
export const getUserMessagesCountInChat = async (chatId: string): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    if (!chatId) return 0; // Cannot count messages without a chat ID

    try {
        // @ts-ignore - Ignoring persistent deep type instantiation error for this specific query
        // Fetch only the count, removing head: true and specific select columns
        const { count, error } = await supabase
            .from('chat_messages' as 'chat_messages')
            .select(undefined, { count: 'exact' }) // Use undefined for select, only get count
            .eq('chat_id', chatId)
            // .eq('user_id', user.id) // REMOVED: Column does not exist on this table
            .eq('role', 'user');

        if (error) {
            console.error('Error fetching user message count in chat:', error);
            throw error;
        }
        return count ?? 0;
    } catch (error) {
        console.error('Unexpected error in getUserMessagesCountInChat:', error);
        return 0;
    }
};
// --- END NEW ---

// --- NEW: Function to get specific feature usage count ---
/**
 * Fetches the count of times a specific feature was used by the current user.
 * @param {string} featureType - The type of feature (e.g., 'image_generation', 'text_export').
 * @returns {Promise<number>} The usage count for the feature.
 */
export const getFeatureUsageCount = async (featureType: 'image_generation' | 'text_export'): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
        const { count, error } = await supabase
            .from('feature_usage')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('feature_type', featureType);

        if (error) {
            console.error(`Error fetching usage count for ${featureType}:`, error);
            throw error;
        }
        return count ?? 0;
    } catch (error) {
        console.error(`Unexpected error in getFeatureUsageCount for ${featureType}:`, error);
        return 0;
    }
};
// --- END NEW ---

// --- NEW: Function to record feature usage ---
/**
 * Records an instance of feature usage in the database.
 * Should be called *after* a feature limited by count (for free users) is successfully used.
 * @param {string} featureType - The type of feature used.
 * @param {object} [metadata={}] - Optional metadata about the usage.
 * @returns {Promise<boolean>} True if recording was successful, false otherwise.
 */
export const recordFeatureUsage = async (featureType: 'image_generation' | 'text_export', metadata = {}): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn('Cannot record feature usage: User not authenticated.');
        return false;
    }

    try {
        const { error } = await supabase
            .from('feature_usage')
            .insert({
                user_id: user.id,
                feature_type: featureType,
                credits_used: 0, // Credits are not used for these specific limits in free tier
                metadata: metadata
            });

        if (error) {
            console.error(`Error recording feature usage for ${featureType}:`, error);
            throw error;
        }
        console.log(`Successfully recorded usage for ${featureType} by user ${user.id}`);
        return true;
    } catch (error) {
        console.error('Unexpected error in recordFeatureUsage:', error);
        return false;
    }
};
// --- END NEW --- 