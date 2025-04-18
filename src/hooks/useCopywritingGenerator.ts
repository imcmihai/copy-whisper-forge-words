
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
      const { data: generatedData, error: openAiError } = await supabase.functions.invoke('generate-copywriting', {
        body: input
      });

      if (openAiError) throw openAiError;

      const { data: dbData, error: dbError } = await supabase
        .from('copywriting_texts')
        .insert({
          niche: input.niche,
          product_name: input.productName,
          product_description: input.productDescription,
          generated_text: generatedData.generatedText
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: 'Copywriting Generated',
        description: 'Your copywriting text has been created successfully!'
      });

      navigate('/generated-copy', { state: { generatedText: generatedData.generatedText } });
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

