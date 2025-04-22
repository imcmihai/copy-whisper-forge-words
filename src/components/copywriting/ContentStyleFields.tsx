
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, Target } from 'lucide-react';

interface ContentStyleFieldsProps {
  input: {
    tone: string;
    targetPublic: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const ContentStyleFields: React.FC<ContentStyleFieldsProps> = ({ input, handleInputChange }) => {
  const inputClassName = "bg-[#3a1465]/40 border-purple-500/30 text-white placeholder:text-gray-400 focus-visible:ring-[#FF2EE6] backdrop-blur-md";

  return (
    <>
      <div className="space-y-2">
        <Label className="text-white/90 flex items-center gap-2">
          <Mic className="h-4 w-4 text-[#FF2EE6]" /> Tone
        </Label>
        <Input
          name="tone"
          value={input.tone}
          onChange={handleInputChange}
          placeholder="Ex: formal, informal, funny, serious"
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white/90 flex items-center gap-2">
          <Target className="h-4 w-4 text-[#00FFCC]" /> Target Public
        </Label>
        <Input
          name="targetPublic"
          value={input.targetPublic}
          onChange={handleInputChange}
          placeholder="Describe the target audience"
          className={inputClassName}
        />
      </div>
    </>
  );
};
