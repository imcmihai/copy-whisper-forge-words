import { useUser } from './useUser'; // Assuming useUser hook is in the same directory

// Define the possible features controlled by subscription tiers
type Feature = 
  | 'unlimited_chats'          // Basic & Pro: Can have more than 3 chats
  | 'image_generation'         // Basic & Pro: Can use the image generation feature
  | 'high_quality_images'      // Pro only: Can generate high-quality images (e.g., DALL-E 3)
  | 'advanced_models'          // Pro only: Can select models like GPT-4.1
  | 'unlimited_regenerations'  // Basic & Pro: Can regenerate copy more than twice
  | 'markdown_export'          // Basic & Pro: Can export as Markdown
  | 'all_exports';             // Pro only: Can export as HTML (and potentially others)

// Define the features available for each subscription tier
// Note: 'free' tier features are implicitly defined by what's *not* included in paid tiers
// and by specific limits like max_chats or max_regenerations handled separately.
const featureMatrix: Record<string, Feature[]> = {
  free: [], // Free users get baseline access, specific limits handled elsewhere
  basic: [
    'unlimited_chats',
    'image_generation', // Basic image generation (e.g., DALL-E 2)
    'unlimited_regenerations',
    'markdown_export'
  ],
  pro: [
    'unlimited_chats',
    'image_generation',
    'high_quality_images', // Access to better image models
    'advanced_models', // Access to better text models
    'unlimited_regenerations',
    'markdown_export', // Includes basic export options
    'all_exports' // Includes HTML and potentially other formats
  ]
};

// Define available AI models per tier
const modelMatrix: Record<string, string[]> = {
    free: ['gpt-4o-mini'],
    basic: ['gpt-4o-mini', 'gpt-4o'],
    pro: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1'] // Assuming gpt-4.1 is the advanced model
}

export const useFeatureAccess = () => {
  // We still rely on the useUser hook, which needs to provide subscription info
  const { subscription } = useUser(); 
  
  // Determine the user's tier, defaulting to 'free' if no subscription info is available
  const tier = subscription?.tier?.toLowerCase() || 'free'; // Ensure tier is lowercase and default to free

  /**
   * Checks if the current user has access to a specific feature based on their tier.
   * @param feature The feature to check access for.
   * @returns True if the user has access, false otherwise.
   */
  const hasAccess = (feature: Feature): boolean => {
    // Get the list of features for the user's tier, defaulting to an empty array if tier is unknown
    const allowedFeatures = featureMatrix[tier] || [];
    return allowedFeatures.includes(feature);
  };

  /**
   * Gets the list of AI models available to the user based on their tier.
   * @returns An array of available model identifiers (e.g., ['gpt-4o-mini', 'gpt-4o']).
   */
  const getAvailableModels = (): string[] => {
    return modelMatrix[tier] || modelMatrix['free']; // Default to free models if tier is unknown
  };

  /**
   * Gets the maximum number of active chats allowed for the user's tier.
   * @returns The maximum number of chats (or Infinity for unlimited).
   */
  const getMaxChats = (): number => {
    // Free tier has a limit, Basic and Pro are unlimited
    if (tier === 'free') return 3;
    return Infinity; // Represents unlimited
  };

  /**
   * Gets the maximum number of regenerations allowed per copy for the user's tier.
   * @returns The maximum number of regenerations (or Infinity for unlimited).
   */
  const getMaxRegenerations = (): number => {
    // Free tier has a limit, Basic and Pro are unlimited
    if (tier === 'free') return 2;
    return Infinity; // Represents unlimited
  };

  // --- NEW: Function to get max messages per chat ---
  /**
   * Gets the maximum number of user messages allowed per chat for the free tier.
   * @returns The maximum number of messages (or Infinity for paid tiers).
   */
  const getMaxMessagesPerChat = (): number => {
      if (tier === 'free') return 3;
      return Infinity;
  };
  // --- END NEW ---

  // --- NEW: Function to get max image generations ---
  /**
   * Gets the maximum number of image generations allowed for the free tier.
   * @returns The maximum number of images (or Infinity for paid tiers).
   */
  const getMaxImageGenerations = (): number => {
      if (tier === 'free') return 1;
      // Assuming paid tiers have image generation included, potentially limited by credits elsewhere
      // If Basic/Pro also had a hard count limit, adjust here.
      // Returning Infinity implies the limit is handled by credits or feature access flags.
      return Infinity; 
  };
  // --- END NEW ---

  // --- NEW: Function to get max text exports ---
  /**
   * Gets the maximum number of plain text exports allowed for the free tier.
   * @returns The maximum number of exports (or Infinity for paid tiers).
   */
  const getMaxTextExports = (): number => {
      if (tier === 'free') return 1;
      // Assuming paid tiers have export options included, potentially limited by credits/feature flags.
      return Infinity;
  };
  // --- END NEW ---

  return {
    tier, // Expose the current tier for potential direct use
    hasAccess,
    getAvailableModels,
    getMaxChats,
    getMaxRegenerations,
    getMaxMessagesPerChat, // Expose new limit function
    getMaxImageGenerations, // Expose new limit function
    getMaxTextExports, // Expose new limit function
  };
}; 