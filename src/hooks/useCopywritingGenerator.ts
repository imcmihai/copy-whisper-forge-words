// Import necessary hooks and utilities
import { useState } from 'react'; // React hook for managing component state
import { useNavigate } from 'react-router-dom'; // Hook for programmatic navigation
import { supabase } from '../integrations/supabase/client'; // Supabase client instance
import { toast } from '../components/ui/use-toast'; // Function to display toast notifications

// Define the structure for the copywriting form input
export interface CopywritingInput {
  niche: string; // The niche of the product
  productName: string; // The name of the product
  productDescription: string; // The description of the product
  // --- New Fields --- 
  tone: string; // Desired tone of the text
  targetPublic: string; // Target audience description
  textFormat: string; // Desired output format (email, ad, etc.)
  textLength: string; // Desired length indicator (short, medium, long, specific count)
  keywords: string; // Keywords to include
  textObjective: string; // Main goal of the text (sales, info, engagement)
  language: string; // ADDED: Language for the generated text
}

// Define the structure for the generation function arguments, including the model
export interface GenerateCopywritingPayload extends CopywritingInput {
    model: string; // Add the selected model
    frameworkId: string; // Add the frameworkId
}

// Helper function to save generated text and profile data for logged-in users
const saveDataForUser = async (userId: string, input: CopywritingInput, generatedText: string): Promise<void> => {
  // Wrap saving logic in a try-catch block for error handling
  try {
    // --- Save generated text --- 
    // Attempt to insert the generated text details into the 'copywriting_texts' table
    const { error: dbError } = await supabase
      .from('copywriting_texts') // Target the 'copywriting_texts' table
      .insert({ // Provide the data to insert
        user_id: userId, // RE-ADDED - Link text to the user
        niche: input.niche, // Save the niche from input
        product_name: input.productName, // Save the product name from input
        product_description: input.productDescription, // Save the product description from input
        generated_text: generatedText // Save the actual generated text
      });
    // If there was an error during insertion, throw it to be caught below
    if (dbError) throw dbError;

    // --- Update user profile --- 
    // Attempt to upsert (update or insert) data into the 'profiles' table
    const { error: profileError } = await supabase
      .from('profiles') // Target the 'profiles' table
      .upsert({ // Provide the data to upsert
        user_id: userId, // Match the profile based on user ID
        niche: input.niche, // Update/set the niche
        product_name: input.productName, // Update/set the product name
        product_description: input.productDescription, // Update/set the product description
      }, { onConflict: 'user_id' }); // Specify that 'user_id' is the conflict column for upsert
      
    // If there was an error updating the profile, log it as a warning
    if (profileError) {
      // Log the profile update error to the console
      console.warn('Failed to update profile after generation:', profileError);
      // Optionally show a non-blocking toast notification
      // toast({ title: "Profile Warning", description: "Could not sync latest inputs to profile.", variant: "default" });
    }

  // Catch any errors that occurred during the saving process (text or profile)
  } catch (saveError) {
    // Log the detailed save error to the console
    console.error('Error saving generated text or profile:', saveError);
    // Display a toast notification to the user about the save failure
    toast({
      title: 'Save Error', // Toast title
      description: 'Failed to save the generated text history.', // Toast description
      variant: 'destructive' // Use the destructive variant for errors
    });
    // Re-throw the error if you want the main function to also handle it (optional)
    // throw saveError; 
  }
};

// Custom hook for handling the copywriting generation process
export const useCopywritingGenerator = () => {
  // State variable to track if the generation process is loading
  const [isLoading, setIsLoading] = useState(false);
  // Hook to get the navigation function from react-router-dom
  const navigate = useNavigate();

  // Update function signature to accept payload including model
  const generateCopywriting = async (payload: GenerateCopywritingPayload) => {
    // Set loading state to true at the beginning of the process
    setIsLoading(true);

    // Start a try block to handle potential errors during the process
    try {
      // Check the user's current authentication session
      const { data: { session } } = await supabase.auth.getSession();
      // Determine if the user is logged in based on the session existence
      const isLoggedIn = !!session;
      // Get the user ID if the user is logged in, otherwise null
      const userId = session?.user?.id;

      // Invoke the Edge Function, passing the entire payload (including model)
      const { data: generatedData, error: openAiError } = await supabase.functions.invoke(
        'generate-copywriting',
        { body: payload } // Pass the full payload with input + model
      );

      // If there was an error invoking the Edge Function, throw it
      if (openAiError) throw openAiError;
      
      // Extract the generated text from the function's response data
      const generatedText = generatedData.generatedText;

      // Extract input fields from payload for saving (excluding model and frameworkId)
      const inputFields: CopywritingInput = { ...payload };
      delete (inputFields as any).model; // Remove model before saving
      delete (inputFields as any).frameworkId; // Remove frameworkId before saving

      // If the user is logged in and we have their ID, save the data
      if (isLoggedIn && userId) {
        // Pass only the input fields to saveDataForUser
        await saveDataForUser(userId, inputFields, generatedText);
      } 

      // Show a success toast notification to the user
      toast({
        title: 'Copywriting Generated', // Toast title
        description: 'Your copywriting text has been created successfully!' // Toast description
      });

      // Navigate the user to the generated copy page
      navigate(
        '/generated-copy', // Target route
        { 
          state: { // Pass state via navigation
            generatedText: generatedText, // Include the generated text
            initialInput: inputFields // Pass the input fields without model
          } 
        }
      );
    // Catch any errors that occurred during the try block
    } catch (error) {
      // Log the copywriting generation error to the console
      console.error('Copywriting generation error:', error);
      // Display an error toast notification to the user
      toast({
        title: 'Error', // Toast title
        description: 'Failed to generate copywriting', // Toast description
        variant: 'destructive' // Use the destructive variant for errors
      });
    // Finally block ensures this code runs regardless of errors
    } finally {
      // Set loading state back to false after the process completes or fails
      setIsLoading(false);
    }
  };

  // Return the generation function and loading state from the hook
  return { generateCopywriting, isLoading };
};
