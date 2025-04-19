import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCopywritingGenerator, CopywritingInput } from '@/hooks/useCopywritingGenerator';
import { Wand2, SendHorizontal, Sparkles } from 'lucide-react';

// Define props interface including onSuccess
interface CopywritingFormProps {
  // REMOVED onSuccess prop definition
}

export const CopywritingForm: React.FC<CopywritingFormProps> = (/*{ onSuccess }*/) => {
  const [input, setInput] = useState<CopywritingInput>({
    niche: '',
    productName: '',
    productDescription: ''
  });

  const { generateCopywriting, isLoading } = useCopywritingGenerator();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateCopywriting(input);
    // Call onSuccess after successful generation - REMOVED
    // if (typeof onSuccess === 'function') {
    //  onSuccess();
    // }
  };

  return (
    <div className="space-y-6 relative z-20">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white/90 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF2EE6]" />
            Niche
          </Label>
          <Input
            value={input.niche}
            onChange={(e) => setInput({...input, niche: e.target.value})}
            placeholder="Enter product niche"
            required
            className="bg-[#3a1465]/40 border-purple-500/30 text-white placeholder:text-gray-400 focus-visible:ring-[#FF2EE6] backdrop-blur-md"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white/90 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00FFCC]" />
            Product Name
          </Label>
          <Input
            value={input.productName}
            onChange={(e) => setInput({...input, productName: e.target.value})}
            placeholder="Enter product name"
            required
            className="bg-[#3a1465]/40 border-purple-500/30 text-white placeholder:text-gray-400 focus-visible:ring-[#FF2EE6] backdrop-blur-md"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white/90 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF2EE6]" />
            Product Description
          </Label>
          <Input
            value={input.productDescription}
            onChange={(e) => setInput({...input, productDescription: e.target.value})}
            placeholder="Enter product description"
            required
            className="bg-[#3a1465]/40 border-purple-500/30 text-white placeholder:text-gray-400 focus-visible:ring-[#FF2EE6] backdrop-blur-md"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] hover:opacity-90 text-white font-medium py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,46,230,0.5)]"
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
      </form>
    </div>
  );
};
