
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

interface ProductInfoFieldsProps {
  input: {
    niche: string;
    productName: string;
    productDescription: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const ProductInfoFields: React.FC<ProductInfoFieldsProps> = ({ input, handleInputChange }) => {
  const inputClassName = "bg-[#3a1465]/40 border-purple-500/30 text-white placeholder:text-gray-400 focus-visible:ring-[#FF2EE6] backdrop-blur-md";

  return (
    <>
      <div className="space-y-2">
        <Label className="text-white/90 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#FF2EE6]" /> Niche
        </Label>
        <Input
          name="niche"
          value={input.niche}
          onChange={handleInputChange}
          placeholder="Enter product niche"
          required
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white/90 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#00FFCC]" /> Product Name
        </Label>
        <Input
          name="productName"
          value={input.productName}
          onChange={handleInputChange}
          placeholder="Enter product name"
          required
          className={inputClassName}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label className="text-white/90 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#FF2EE6]" /> Product Description
        </Label>
        <Input
          name="productDescription"
          value={input.productDescription}
          onChange={handleInputChange}
          placeholder="Enter product description"
          required
          className={inputClassName}
        />
      </div>
    </>
  );
};
