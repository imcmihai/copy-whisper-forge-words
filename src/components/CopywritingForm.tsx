
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, SendHorizontal } from 'lucide-react';
import { useCopywritingGenerator, CopywritingInput } from '@/hooks/useCopywritingGenerator';
import { ProductInfoFields } from './copywriting/ProductInfoFields';
import { ContentStyleFields } from './copywriting/ContentStyleFields';
import { TextSpecFields } from './copywriting/TextSpecFields';

export const CopywritingForm: React.FC = () => {
  const [input, setInput] = useState<CopywritingInput>({
    niche: '',
    productName: '',
    productDescription: '',
    tone: '',
    targetPublic: '',
    textFormat: '',
    textLength: '',
    keywords: '',
    textObjective: ''
  });

  const { generateCopywriting, isLoading } = useCopywritingGenerator();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateCopywriting(input);
  };

  return (
    <div className="space-y-6 relative z-20">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <ProductInfoFields input={input} handleInputChange={handleInputChange} />
        <ContentStyleFields input={input} handleInputChange={handleInputChange} />
        <TextSpecFields input={input} handleInputChange={handleInputChange} />
        
        <div className="md:col-span-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] hover:opacity-90 text-white font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,46,230,0.5)]"
          >
            {isLoading ? (
              <>
                <Wand2 className="h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <SendHorizontal className="h-5 w-5" />
                Generate Copywriting
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
