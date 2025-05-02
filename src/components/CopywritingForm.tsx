import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCopywritingGenerator, CopywritingInput, GenerateCopywritingPayload } from '../hooks/useCopywritingGenerator';
import { useCredits } from '@/lib/hooks/useCredits';
import { useUser } from '@/lib/hooks/useUser';
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess';
import ModelSelector from '@/components/ModelSelector';
import { toast } from '@/components/ui/use-toast';
import { Wand2, SendHorizontal, Sparkles, Target, Mic, ListChecks, Scale, Key, Goal, Globe, LanguagesIcon, Loader2 } from 'lucide-react';

// Define props interface
interface CopywritingFormProps {
  frameworkId: string; // Add the frameworkId prop
}

export const CopywritingForm: React.FC<CopywritingFormProps> = ({ frameworkId }) => { // Destructure frameworkId
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
  const [model, setModel] = useState('gpt-4o-mini');

  // Get the generation function and original loading state from the hook
  const { generateCopywriting, isLoading: isGenerating } = useCopywritingGenerator();
  // Get credit hooks
  const { checkCredits, useCredits: deductCredits, isChecking, isUsing } = useCredits();
  const { user, usage, isLoading: isLoadingUser } = useUser();
  const { tier, getMaxChats } = useFeatureAccess();
  const navigate = useNavigate();

  // Combine loading states
  const isLoading = isGenerating || isChecking || isUsing || isLoadingUser;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: value }));
  };

  // Updated Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Free Tier Chat Limit Check ---
    if (tier === 'free') {
        const maxChats = getMaxChats();
        if (usage && usage.activeChatCount >= maxChats) {
            toast({
                title: 'Chat Limit Reached',
                description: `Free plan allows ${maxChats} active chats. Please upgrade to create more.`,
                variant: 'destructive',
            });
            return; // Stop submission
        }
    }
    // --- End Check ---

    // --- Credit Calculation (Fixed Cost) ---
    const requiredCredits = 20; // Fixed cost for initial generation
    // const lengthLower = input.textLength?.toLowerCase() || '';
    // if (lengthLower.includes('medium')) {
    //   requiredCredits = 60;
    // } else if (lengthLower.includes('long')) {
    //   requiredCredits = 100;
    // } else if (lengthLower.includes('extra') || lengthLower.includes('xl')) {
    //   requiredCredits = 150;
    // } else if (lengthLower.includes('short')) {
    //     requiredCredits = 30;
    // }

    try {
      // --- Credit Check (Applies to paid tiers primarily now) ---
      if (tier !== 'free') { // Only check credits for non-free users
      const hasEnoughCredits = await checkCredits(requiredCredits);
      if (!hasEnoughCredits) {
        toast({
          title: 'Not enough credits',
          description: `This generation requires ${requiredCredits} credits. Please upgrade or wait for renewal.`,
          variant: 'destructive',
        });
        return; // Stop submission if not enough credits
      }
      }

      // --- Call Generation (Pass model and frameworkId) ---
      const payload: GenerateCopywritingPayload = { ...input, model, frameworkId }; // Include frameworkId here
      console.log('Submitting form with payload:', payload);
      await generateCopywriting(payload); 
      // --- If generateCopywriting was successful, we proceed ---

      // --- Deduct Credits (Only for non-free tiers AFTER successful generation) ---
      let creditsAttempted = false;
      if (tier !== 'free') {
        creditsAttempted = true; // Mark that we tried to deduct credits
      const creditsWereUsed = await deductCredits(
          requiredCredits, 
          'text_generation', 
          { textLength: input.textLength, model } // Include model in metadata
      );
      
      if (!creditsWereUsed) {
            console.warn("Generation succeeded, but credit deduction failed post-operation (e.g., race condition, insufficient credits detected server-side).");
            // Optional: Show a warning toast to the user, but still allow them to proceed
            // as the main operation (generation) was successful.
            toast({
              title: 'Warning: Credit Deduction Issue',
              description: 'Copy generated, but failed to deduct credits. Please check your balance or contact support if this persists.',
              variant: 'default', // Or a custom warning variant
            });
        } else {
            console.log("Credits deducted successfully post-generation.");
        }
      }

      console.log("Copy generation and credit deduction (if applicable) process completed.");
      
      // IMPORTANT: Navigation should happen here *after* generation and credit deduction attempt.
      // If `generateCopywriting` navigates internally on success, this line might be redundant
      // or need adjustment based on how that hook signals completion.
      // Assuming generateCopywriting *doesn't* navigate internally for this example:
      // navigate('/generated-copy'); // Or wherever the generated copy is shown

    } catch (error) {
      console.error('Error during form submission process:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      // No navigation happens if there's an error during check or generation
    }
    // No finally block needed to reset isLoading, as the hooks manage their own states,
    // and navigation will unmount the component anyway.
  };

  const inputClassName = "bg-[#3a1465]/40 border-purple-500/30 text-white placeholder:text-gray-400 focus-visible:ring-[#FF2EE6] backdrop-blur-md";

  return (
    <div className="space-y-6 relative z-20">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* Niche Input */}
        <div className="space-y-2">
          <Label className="text-white/90 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF2EE6]" /> Niche
          </Label>
          <Input name="niche" value={input.niche} onChange={handleInputChange} placeholder="Enter product niche" required className={inputClassName} />
        </div>

        {/* Product Name Input */}
        <div className="space-y-2">
          <Label className="text-white/90 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00FFCC]" /> Product Name
          </Label>
          <Input name="productName" value={input.productName} onChange={handleInputChange} placeholder="Enter product name" required className={inputClassName} />
        </div>

        {/* Product Description Input */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-white/90 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF2EE6]" /> Product Description
          </Label>
          <Input name="productDescription" value={input.productDescription} onChange={handleInputChange} placeholder="Enter product description" required className={inputClassName} />
        </div>

        {/* Tone Input */}
        <div className="space-y-2">
          <Label className="text-white/90 flex items-center gap-2">
             <Mic className="h-4 w-4 text-[#FF2EE6]" /> Tone
          </Label>
          <Input name="tone" value={input.tone} onChange={handleInputChange} placeholder="Ex: formal, informal, funny, serious" className={inputClassName} />
        </div>

        {/* Target Public Input */}
        <div className="space-y-2">
          <Label className="text-white/90 flex items-center gap-2">
             <Target className="h-4 w-4 text-[#00FFCC]" /> Target Public
          </Label>
          <Input name="targetPublic" value={input.targetPublic} onChange={handleInputChange} placeholder="Describe the target audience" className={inputClassName} />
        </div>

        {/* Text Format Input */}
        <div className="space-y-2">
          <Label className="text-white/90 flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-[#FF2EE6]" /> Text Format
          </Label>
          <Input name="textFormat" value={input.textFormat} onChange={handleInputChange} placeholder="Ex: email, ad, social media post" className={inputClassName} />
        </div>

        {/* Text Length Input */}
        <div className="space-y-2">
          <Label className="text-white/90 flex items-center gap-2">
             <Scale className="h-4 w-4 text-[#00FFCC]" /> Text Length
          </Label>
          <Input name="textLength" value={input.textLength} onChange={handleInputChange} placeholder="Ex: short, medium, ~100 words" className={inputClassName} />
        </div>
        
        {/* Keywords Input */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-white/90 flex items-center gap-2">
             <Key className="h-4 w-4 text-[#FF2EE6]" /> Keywords To Include
          </Label>
          <Input name="keywords" value={input.keywords} onChange={handleInputChange} placeholder="Enter comma-separated keywords" className={inputClassName} />
        </div>

        {/* Text Objective Input */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-white/90 flex items-center gap-2">
             <Goal className="h-4 w-4 text-[#00FFCC]" /> Text Objective
          </Label>
          <Input name="textObjective" value={input.textObjective} onChange={handleInputChange} placeholder="Ex: sales, informing, engaging" className={inputClassName} />
        </div>
        
        {/* Language Input */}
        <div className="space-y-2">
          <Label className="text-white/90 flex items-center gap-2">
             <LanguagesIcon className="h-4 w-4 text-[#00FFCC]" /> Language
          </Label>
          <Input name="language" value={input.language} onChange={handleInputChange} placeholder="The language you want the text to be written in" className={inputClassName} />
        </div>

        {/* --- Model Selector --- */} 
        <div className="space-y-2">
            <ModelSelector 
                value={model} 
                onChange={setModel} 
                label="Select AI Model" 
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
