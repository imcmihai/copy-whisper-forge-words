import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ImageIcon, XCircle } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser'; // Import useUser
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess'; // Hook to check tier permissions
import { useCredits } from '@/lib/hooks/useCredits'; // Hook for credit checking and usage
import { generateImage, recordFeatureUsage } from '@/lib/api'; // Assumed API function for image generation & NEW record function
import { toast } from '@/components/ui/use-toast'; // Using toast for user feedback

interface ImageGeneratorProps {
  prompt: string; // Base prompt (last assistant message)
  onImageGenerated: (imageUrl: string) => void; // Callback when an image is successfully generated
  disabled?: boolean; // Optional prop to disable the generator
}

const ImageGenerator = ({ prompt: basePrompt, onImageGenerated, disabled = false }: ImageGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null); // State for displayed image
  const [freeGenerationDoneThisSession, setFreeGenerationDoneThisSession] = useState(false); // Local state
  const [imagePromptModifier, setImagePromptModifier] = useState(""); // State for the new input
  const { user, usage, mutate, isLoading: isLoadingUser } = useUser(); // Get user, usage, mutate
  const { tier, hasAccess, getMaxImageGenerations } = useFeatureAccess(); // Get tier, access check, and limits
  const { useCredits: deductCredits, checkCredits, isChecking, isUsing } = useCredits(); // Get credit functions and states

  const hasImageAccess = hasAccess('image_generation'); // Still relevant for paid tiers
  const hasHighQualityAccess = hasAccess('high_quality_images');

  // --- Check if limit reached for free tier ---
  const maxImages = getMaxImageGenerations();
  const isFreeTierLimitReached = tier === 'free' && usage && usage.imageGenerationCount >= maxImages;

  const handleGenerateImage = async (highQuality: boolean) => {
    setError(null); // Clear previous errors
    setGeneratedImageUrl(null); // Clear previous image on new attempt
    
    // Construct the final prompt
    const finalPrompt = imagePromptModifier 
        ? `${imagePromptModifier}. Based on the text: "${basePrompt}"` 
        : basePrompt; // Use base prompt if modifier is empty

    if (!finalPrompt || finalPrompt.trim().length === 0) {
        setError('Cannot generate image without a base text or prompt modifier.');
        toast({ title: "Missing Content", description: "Cannot generate image without text context.", variant: "warning" });
        return;
    }

    // Check combined limit state (data from hook OR local state)
    if (tier === 'free' && (isFreeTierLimitReached || freeGenerationDoneThisSession)) {
        toast({ title: "Image Limit Reached", description: `Free plan allows ${maxImages} image generation. Please upgrade.`, variant: "destructive" });
        return;
    }

    // Define credit cost based on quality (only applies to paid tiers)
    const requiredCredits = highQuality ? 100 : 50; // Example costs

    // --- Credit Check (for paid tiers) ---
    if (tier !== 'free') {
    const canAfford = await checkCredits(requiredCredits);
    if (!canAfford) {
          setError(`Not enough credits. Need ${requiredCredits}.`);
          toast({ title: "Insufficient Credits", description: `Image generation requires ${requiredCredits} credits.`, variant: "warning" });
      return;
        }
    }

    setIsGenerating(true);

    try {
      // Call the API function to generate the image
      const { imageUrl } = await generateImage({
        prompt: finalPrompt,
        highQuality,
      });

      if (!imageUrl) {
          throw new Error("Image generation request succeeded but no URL was returned.")
      }

      let creditsSuccessfullyHandled = true;
      // --- Deduct Credits (Paid Tiers) OR Record Usage (Free Tier) ---
      if (tier !== 'free') {
          console.log(`[ImageGenerator] User tier is ${tier}. Deducting credits...`);
      const creditsUsed = await deductCredits(
        requiredCredits,
        'image_generation',
            { prompt: finalPrompt.substring(0, 100), highQuality }
      );
      if (!creditsUsed) {
              creditsSuccessfullyHandled = false;
          console.warn("Image generated, but failed to deduct credits.");
          setError("Image generated, but failed to update credits. Please contact support.");
              toast({ title: "Credit Error", description: "Image generated but credits may not have been deducted.", variant: "warning" });
          }
      } else {
          // Record usage for free tier
          console.log(`[ImageGenerator] User tier is free. Attempting to record feature usage...`);
          const usageRecorded = await recordFeatureUsage('image_generation', { prompt: finalPrompt.substring(0, 100), highQuality });
          console.log(`[ImageGenerator] recordFeatureUsage returned: ${usageRecorded}`); // Log the result
          
          if (usageRecorded) {
              console.log(`[ImageGenerator] Usage recorded successfully. Mutating data and setting local state.`);
              mutate(); // Trigger data refresh
              setFreeGenerationDoneThisSession(true); // Set local state immediately
          } else {
              // This block runs if recordFeatureUsage returned false
              console.warn("[ImageGenerator] Usage recording FAILED (recordFeatureUsage returned false). Setting local state anyway.");
              setFreeGenerationDoneThisSession(true); 
              toast({ title: "Usage Recording Failed", description: "Image generated, but usage count might be incorrect.", variant: "warning" });
      }
      }
      // --- End Credit/Usage Handling ---

      // Call the success callback only if credits/usage were handled (or decide if image should be shown anyway)
      if (creditsSuccessfullyHandled) { 
          setGeneratedImageUrl(imageUrl); // Set state to display the image
      onImageGenerated(imageUrl);
          toast({ title: "Image Generated!", description: "Your image is ready.", variant: "success" });
      }

    } catch (err) {
      console.error("Image generation failed:", err);
      const message = err instanceof Error ? err.message : 'Failed to generate image. Please try again.';
      setError(message);
      toast({ title: "Generation Failed", description: message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Decide if the component should be rendered at all
  // Free users should see it (until limit), Basic/Pro check hasAccess
  const shouldRender = tier === 'free' || hasImageAccess;
  if (!shouldRender) {
     return <p className="text-sm text-muted-foreground p-4">Image generation requires a Basic or Pro plan.</p>;
  }

  // Determine if the buttons should be disabled
  const anyLoading = isGenerating || isChecking || isUsing || isLoadingUser || disabled;
  const isDisabled = anyLoading || (tier === 'free' && (isFreeTierLimitReached || freeGenerationDoneThisSession));

  // --- Calculate display count for free tier --- 
  const freeTierDisplayCount = tier === 'free' 
      ? (freeGenerationDoneThisSession ? maxImages : usage?.imageGenerationCount ?? 0)
      : 0;

  return (
    <div className="space-y-3 p-4 border border-purple-500/20 rounded-xl bg-white/5 backdrop-blur-lg shadow-lg text-card-foreground">
      <h3 className="font-semibold text-base text-white">Generate Image</h3>
      <p className="text-sm text-purple-300/80">
        {tier === 'free' 
          ? `Free plan: ${freeTierDisplayCount}/${maxImages} generated.`
          : `Generate an image based on your text. Uses ${hasHighQualityAccess ? '50-100' : '50'} credits.`}
      </p>

      <div className="space-y-1.5">
          <Label htmlFor="image-prompt-modifier" className="text-sm font-medium text-purple-300/80">
              Add image details (optional)
          </Label>
          <Input 
              id="image-prompt-modifier"
              value={imagePromptModifier}
              onChange={(e) => setImagePromptModifier(e.target.value)}
              placeholder="e.g., futuristic style, watercolor painting, photorealistic..."
              disabled={isDisabled}
              className="bg-[#1F063A]/60 border-purple-600/50 focus-visible:ring-[#FF2EE6] text-white placeholder:text-gray-400/70 backdrop-blur-md disabled:opacity-60 disabled:cursor-not-allowed rounded-md"
          />
      </div>

      {generatedImageUrl && (
        <div className="mt-4 p-2 border border-purple-500/20 rounded-lg relative bg-black/30">
            <img 
                src={generatedImageUrl} 
                alt="Generated image based on prompt" 
                className="rounded-md w-full max-w-sm mx-auto shadow-lg" 
            />
            <Button 
                variant="ghost" 
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white hover:bg-black/80 transition-opacity duration-200"
                onClick={() => setGeneratedImageUrl(null)} 
                title="Hide image"
            >
                <XCircle className="h-4 w-4" />
            </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-2">
        <Button
          variant="outline"
          onClick={() => handleGenerateImage(false)}
          disabled={isDisabled}
          size="sm"
          className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 rounded-md shadow-sm"
          title={isDisabled && tier === 'free' ? `Free plan limit of ${maxImages} image reached` : (tier === 'free' ? 'Generate Image (Free Tier)' : 'Generate Image (50 Credits)')}
        >
          {isGenerating && !hasHighQualityAccess ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            <><ImageIcon className="mr-2 h-4 w-4" /> {tier === 'free' ? 'Generate Image' : 'Image (50 Credits)'}</>
          )}
        </Button>

        {tier !== 'free' && hasHighQualityAccess && (
          <Button
            onClick={() => handleGenerateImage(true)}
            disabled={isDisabled}
            size="sm"
            variant="default" 
            className="bg-gradient-to-r from-[#FF2EE6]/80 to-[#00FFCC]/80 hover:opacity-90 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200 rounded-md shadow-md"
            title="Generate High Quality Image (100 Credits)"
          >
            {isGenerating && hasHighQualityAccess ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating HQ...</>
            ) : (
                <>✨ High Quality (100 Credits)</>
            )}
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive font-medium mt-2">{error}</p>}
      {(tier === 'free' && (isFreeTierLimitReached || freeGenerationDoneThisSession)) && (
         <p className="text-sm text-amber-400 font-medium mt-2">
              Free image generation limit reached. <a href="/pricing" className="underline">Upgrade</a> for more.
         </p>
      )}
    </div>
  );
};

export default ImageGenerator; 