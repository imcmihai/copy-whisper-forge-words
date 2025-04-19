import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface CopywritingInput {
  niche: string;
  productName: string;
  productDescription: string;
}

export const useCopywritingGenerator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const generateCopywriting = async (input: CopywritingInput) => {
    setIsLoading(true);

    try {
      // Check if user is logged in to determine if we should save data
      const { data: { session } } = await supabase.auth.getSession();
      const isLoggedIn = !!session;
      const userId = session?.user?.id;

      // Invoke the function to generate text
      const { data: generatedData, error: openAiError } = await supabase.functions.invoke('generate-copywriting', {
        body: input
      });

      if (openAiError) throw openAiError;
      
      // --- Save data ONLY if logged in ---
      if (isLoggedIn && userId) {
        try {
          // Save generated text
          const { error: dbError } = await supabase
            .from('copywriting_texts')
            .insert({
              user_id: userId, // Make sure user_id column exists
              niche: input.niche,
              product_name: input.productName,
              product_description: input.productDescription,
              generated_text: generatedData.generatedText
            });
          if (dbError) throw dbError; // Throw if text saving fails

          // Update profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              user_id: userId,
              niche: input.niche, 
              product_name: input.productName,
              product_description: input.productDescription,
              updated_at: new Date()
            }, { onConflict: 'user_id' });
            
          if (profileError) {
            console.warn('Failed to update profile after generation:', profileError);
            // Don't block navigation for profile update failure, maybe a subtle toast?
          }
        } catch (saveError) {
           console.error('Error saving generated text or profile:', saveError);
           toast({
             title: 'Save Error',
             description: 'Failed to save the generated text history.',
             variant: 'destructive'
           });
           // Decide if we should still navigate or stop here if saving is critical
        }
      } // --- End of saving logic ---

      toast({
        title: 'Copywriting Generated',
        description: 'Your copywriting text has been created successfully!'
      });

      // Navigate for everyone
      navigate('/generated-copy', { 
        state: { 
          generatedText: generatedData.generatedText,
          initialInput: input
        } 
      });
    } catch (error) {
      console.error('Copywriting generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate copywriting',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { generateCopywriting, isLoading };
};
