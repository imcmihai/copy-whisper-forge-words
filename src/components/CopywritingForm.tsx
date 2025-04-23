import React, { useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { useCopywritingGenerator, CopywritingInput } from '../hooks/useCopywritingGenerator';
import { Wand2, SendHorizontal, Sparkles, Target, Mic, ListChecks, Scale, Key, Goal, Globe, LanguagesIcon } from 'lucide-react';

// Define props interface including onSuccess
interface CopywritingFormProps {
  // REMOVED onSuccess prop definition
}

export const CopywritingForm: React.FC<CopywritingFormProps> = (/*{ onSuccess }*/) => {
  // Initialize state with all fields, including new ones
  const [input, setInput] = useState<CopywritingInput>({
    niche: '',
    productName: '',
    productDescription: '',
    tone: '',
    targetPublic: '',
    textFormat: '',
    textLength: '',
    keywords: '',
    textObjective: '',
    language: ''
  });

  // Get the generation function and loading state from the hook
  const { generateCopywriting, isLoading } = useCopywritingGenerator();

  // Generic handler to update state for any input field
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default browser form submission
    e.preventDefault();
    // Call the generation function from the hook with the current input state
    await generateCopywriting(input);
    // Call onSuccess after successful generation - REMOVED
    // if (typeof onSuccess === 'function') {
    //  onSuccess();
    // }
  };

  // Base input class for consistent styling
  const inputClassName = "bg-[#3a1465]/40 border-purple-500/30 text-white placeholder:text-gray-400 focus-visible:ring-[#FF2EE6] backdrop-blur-md";

  // Render the form
  return (
    <div className="space-y-6 relative z-20">
      {/* Form element with onSubmit handler */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* Niche Input */}
        <div className="space-y-2">
          <Label className="text-white/90 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF2EE6]" /> Niche
          </Label>
          <Input
            name="niche" // Add name attribute
            value={input.niche}
            onChange={handleInputChange} // Use generic handler
            placeholder="Enter product niche"
            required
            className={inputClassName}
          />
        </div>

        {/* Product Name Input */}
        <div className="space-y-2">
          <Label className="text-white/90 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00FFCC]" /> Product Name
          </Label>
          <Input
            name="productName" // Add name attribute
            value={input.productName}
            onChange={handleInputChange}
            placeholder="Enter product name"
            required
            className={inputClassName}
          />
        </div>

        {/* Product Description Input - Spanning both columns */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-white/90 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF2EE6]" /> Product Description
          </Label>
          <Input // Consider using Textarea if longer descriptions are expected
            name="productDescription" // Add name attribute
            value={input.productDescription}
            onChange={handleInputChange}
            placeholder="Enter product description"
            required
            className={inputClassName}
          />
        </div>

        {/* --- New Input Fields --- */}

        {/* Tone Input */}
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

        {/* Target Public Input */}
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

        {/* Text Format Input */}
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

        {/* Text Length Input */}
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
        
        {/* Keywords Input - Spanning both columns */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-white/90 flex items-center gap-2">
             <Key className="h-4 w-4 text-[#FF2EE6]" /> Keywords To Include
          </Label>
          <Input // Consider Textarea if many keywords expected
            name="keywords"
            value={input.keywords}
            onChange={handleInputChange}
            placeholder="Enter comma-separated keywords"
            className={inputClassName}
          />
        </div>

        {/* Text Objective Input - Spanning both columns */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-white/90 flex items-center gap-2">
             <Goal className="h-4 w-4 text-[#00FFCC]" /> Text Objective
          </Label>
          <Input // Consider Textarea for more detail
            name="textObjective"
            value={input.textObjective}
            onChange={handleInputChange}
            placeholder="Ex: sales, informing, engaging"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className="text-white/90 flex items-center gap-2">
             <LanguagesIcon className="h-4 w-4 text-[#00FFCC]" /> Language
          </Label>
          <Input // Consider Textarea for more detail
            name="language"
            value={input.language}
            onChange={handleInputChange}
            placeholder="The language you want the text to be written in"
            className={inputClassName}
          />
        </div>

        {/* Submit Button - Spanning both columns */}
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
