
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListChecks, Scale, Key, Goal } from 'lucide-react';

interface TextSpecFieldsProps {
  input: {
    textFormat: string;
    textLength: string;
    keywords: string;
    textObjective: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const TextSpecFields: React.FC<TextSpecFieldsProps> = ({ input, handleInputChange }) => {
  const inputClassName = "bg-[#3a1465]/40 border-purple-500/30 text-white placeholder:text-gray-400 focus-visible:ring-[#FF2EE6] backdrop-blur-md";

  return (
    <>
      <div className="space-y-2">
        <Label className="text-white/90 flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-[#FF2EE6]" /> Text Format
        </Label>
        <Input
          name="textFormat"
          value={input.textFormat}
          onChange={handleInputChange}
          placeholder="Ex: email, ad, social media post"
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white/90 flex items-center gap-2">
          <Scale className="h-4 w-4 text-[#00FFCC]" /> Text Length
        </Label>
        <Input
          name="textLength"
          value={input.textLength}
          onChange={handleInputChange}
          placeholder="Ex: short, medium, ~100 words"
          className={inputClassName}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label className="text-white/90 flex items-center gap-2">
          <Key className="h-4 w-4 text-[#FF2EE6]" /> Keywords To Include
        </Label>
        <Input
          name="keywords"
          value={input.keywords}
          onChange={handleInputChange}
          placeholder="Enter comma-separated keywords"
          className={inputClassName}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label className="text-white/90 flex items-center gap-2">
          <Goal className="h-4 w-4 text-[#00FFCC]" /> Text Objective
        </Label>
        <Input
          name="textObjective"
          value={input.textObjective}
          onChange={handleInputChange}
          placeholder="Ex: sales, informing, engaging"
          className={inputClassName}
        />
      </div>
    </>
  );
};
