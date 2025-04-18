
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCopywritingGenerator, CopywritingInput } from '@/hooks/useCopywritingGenerator';

export const CopywritingForm: React.FC = () => {
  const [input, setInput] = useState<CopywritingInput>({
    niche: '',
    productName: '',
    productDescription: ''
  });

  const { generateCopywriting, isLoading, generatedText } = useCopywritingGenerator();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateCopywriting(input);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Niche</Label>
          <Input
            value={input.niche}
            onChange={(e) => setInput({...input, niche: e.target.value})}
            placeholder="Enter product niche"
            required
          />
        </div>
        <div>
          <Label>Product Name</Label>
          <Input
            value={input.productName}
            onChange={(e) => setInput({...input, productName: e.target.value})}
            placeholder="Enter product name"
            required
          />
        </div>
        <div>
          <Label>Product Description</Label>
          <Input
            value={input.productDescription}
            onChange={(e) => setInput({...input, productDescription: e.target.value})}
            placeholder="Enter product description"
            required
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Copywriting'}
        </Button>
      </form>

      {generatedText && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Generated Copywriting:</h3>
          <p>{generatedText}</p>
        </div>
      )}
    </div>
  );
};
