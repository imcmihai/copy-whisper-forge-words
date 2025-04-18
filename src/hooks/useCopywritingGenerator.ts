
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface CopywritingInput {
  niche: string;
  productName: string;
  productDescription: string;
}

export const useCopywritingGenerator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);

  const generateCopywriting = async (input: CopywritingInput) => {
    setIsLoading(true);
    setGeneratedText(null);

    try {
      // Simulate copywriting generation (replace with actual AI logic later)
      const mockGeneratedText = `Compelling copywriting for ${input.productName} in the ${input.niche} niche!`;

      const { data, error } = await supabase
        .from('copywriting_texts')
        .insert({
          niche: input.niche,
          product_name: input.productName,
          product_description: input.productDescription,
          generated_text: mockGeneratedText
        })
        .select()
        .single();

      if (error) throw error;

      setGeneratedText(mockGeneratedText);
      toast({
        title: 'Copywriting Generated',
        description: 'Your copywriting text has been created successfully!'
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

  return { generateCopywriting, isLoading, generatedText };
};
