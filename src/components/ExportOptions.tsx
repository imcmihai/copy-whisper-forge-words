import React from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon, FileTextIcon, CodeIcon } from 'lucide-react';
// Assuming you have or will add a Markdown icon component or library
// If using lucide-react, there isn't a direct Markdown icon, so using FileTextIcon as placeholder or consider another icon.
import { FileText as MarkdownIcon } from 'lucide-react'; // Example using FileTextIcon for Markdown
import { useUser } from '@/lib/hooks/useUser'; // Import useUser
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess'; // Hook to check feature access
import { recordFeatureUsage } from '@/lib/api'; // Import recordFeatureUsage
import { toast } from '@/components/ui/use-toast'; // Import toast

interface ExportOptionsProps {
  content: string; // The main text content to export
  images?: string[]; // Optional array of generated image URLs
  fileNamePrefix?: string; // Optional prefix for downloaded files
}

const ExportOptions = ({ content, images = [], fileNamePrefix = 'copy-air-export' }: ExportOptionsProps) => {
  const { user, usage, mutate, isLoading: isLoadingUser } = useUser(); // Get user, usage, mutate
  const { tier, hasAccess, getMaxTextExports } = useFeatureAccess(); // Get tier, access check, and limits

  // Check access for different export formats
  const hasMarkdownAccess = hasAccess('markdown_export');
  const hasAllExportsAccess = hasAccess('all_exports'); // Controls HTML export
  const hasImageAccess = hasAccess('image_generation'); // Controls image download button visibility

  // --- Check if limit reached for free tier ---
  const maxTextExports = getMaxTextExports();
  const isFreeTextExportLimitReached = tier === 'free' && usage && usage.textExportCount >= maxTextExports;

  // --- Export Functions --- 

  const exportPlainText = async () => { // Make async to await recording
    // --- Free Tier Limit Check ---
    if (isFreeTextExportLimitReached) {
        toast({ title: "Export Limit Reached", description: `Free plan allows ${maxTextExports} text export. Please upgrade.`, variant: "destructive" });
        return;
    }

    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileNamePrefix}.txt`;
      document.body.appendChild(a); // Required for Firefox
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // --- Record Usage for Free Tier --- 
      if (tier === 'free') {
          const recorded = await recordFeatureUsage('text_export');
          if (recorded) {
              mutate(); // Refresh user data
          } else {
              console.warn("Text exported, but failed to record usage for free tier.");
          }
      }
      // --- End Recording ---

    } catch (error) {
        console.error("Error exporting plain text:", error)
        toast({ title: "Export Error", description: "Could not export as plain text.", variant: "destructive" });
    }
  };

  const exportMarkdown = () => {
    if (!hasMarkdownAccess) return;
    // No specific count limit for Markdown on free tier in this setup
    // ... rest of markdown export logic ...
     try {
      // Basic Markdown conversion (can be enhanced)
      const markdownContent = content.replace(/\n/g, '  \n'); // Add double space for line breaks
      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileNamePrefix}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error exporting Markdown:", error)
        toast({ title: "Export Error", description: "Could not export as Markdown.", variant: "destructive" });
    }
  };

  const exportHTML = () => {
    if (!hasAllExportsAccess) return;
    // No specific count limit for HTML on free tier in this setup
    // ... rest of html export logic ...
     try {
      // Simple HTML structure
      const imageTags = images.map(img => `<img src="${img}" alt="Generated image" style="max-width: 100%; height: auto; margin: 20px 0; display: block;" />`).join('\n');
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Copy</title>
  <style>
    body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 20px auto; padding: 20px; border: 1px solid #eee; } 
    p { margin-bottom: 1em; }
    img { max-width: 100%; height: auto; margin: 20px 0; display: block; }
  </style>
</head>
<body>
  <h1>Exported Content</h1>
  <div>${content.replace(/\n/g, '<br>\n')}</div>
  ${imageTags ? '<h2>Generated Images</h2>' : ''}
  ${imageTags}
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileNamePrefix}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
         console.error("Error exporting HTML:", error)
         toast({ title: "Export Error", description: "Could not export as HTML.", variant: "destructive" });
    }
  };

  const exportImages = async () => {
    // No specific count limit for image export on free tier (limit is on generation)
    // ... rest of image export logic ...
     if (!hasImageAccess || images.length === 0) return;

    // Download images one by one
    for (let i = 0; i < images.length; i++) {
      try {
        const imageUrl = images[i];
        // Fetch the image data as a blob to handle potential CORS issues with direct download
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        // Try to determine a file extension or default to png
        const extension = blob.type.split('/')[1] || 'png';
        a.download = `${fileNamePrefix}-image-${i + 1}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // Add a small delay between downloads if needed
        await new Promise(resolve => setTimeout(resolve, 100)); 
      } catch (error) {
          console.error(`Error exporting image ${i+1}:`, error);
          // Notify user about the specific image failure
          // Use toast instead of alert for consistency
          toast({ title: `Image ${i+1} Export Failed`, description: "Could not download this image.", variant: "warning" });
      }
    }
  };

  // Check if there are any export options available at all
  // Adjusted logic slightly - free users *can* export plain text once
  const canExportAnything = tier === 'free' || hasMarkdownAccess || hasAllExportsAccess || (hasImageAccess && images.length > 0);

  return (
    <div className="space-y-3 p-4 border border-purple-500/20 rounded-xl bg-white/5 backdrop-blur-lg shadow-lg text-card-foreground">
      <h3 className="font-semibold text-base text-white">Export Options</h3>
      
      {/* Display usage count for free tier */} 
      {tier === 'free' && (
          <p className="text-sm text-purple-300/80">
              Free plan: {usage?.textExportCount ?? 0}/{maxTextExports} text export used.
          </p>
      )}

      {!canExportAnything && !images.length && tier !== 'free' ? ( // Adjusted condition
          <p className="text-sm text-purple-300/80">No export options available for the current content or your plan.</p>
      ) : (
          <div className="flex flex-wrap gap-2">
              {/* Plain Text - Limited for free tier */} 
              <Button 
                  variant="outline" 
                  onClick={exportPlainText} 
                  size="sm"
                  disabled={isFreeTextExportLimitReached || isLoadingUser}
                  title={isFreeTextExportLimitReached ? `Free plan limit of ${maxTextExports} text export reached` : "Export as Plain Text"}
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 rounded-md shadow-sm"
              >
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  Plain Text
              </Button>

              {/* Markdown - Requires Basic+ */} 
              {hasMarkdownAccess && (
                  <Button 
                    variant="outline" 
                    onClick={exportMarkdown} 
                    size="sm"
                    disabled={isLoadingUser}
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 rounded-md shadow-sm"
                  >
                      <MarkdownIcon className="mr-2 h-4 w-4" />
                      Markdown
                  </Button>
              )}

              {/* HTML - Requires Pro */} 
              {hasAllExportsAccess && (
                  <Button 
                    variant="outline" 
                    onClick={exportHTML} 
                    size="sm"
                    disabled={isLoadingUser}
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 rounded-md shadow-sm"
                  >
                      <CodeIcon className="mr-2 h-4 w-4" />
                      HTML
                  </Button>
              )}

              {/* Images - Requires Basic+ and images must exist */} 
              {hasImageAccess && images.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={exportImages} 
                    size="sm"
                    disabled={isLoadingUser}
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 rounded-md shadow-sm"
                  >
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Images ({images.length})
                  </Button>
              )}
          </div>
      )}
       {isFreeTextExportLimitReached && (
         <p className="text-sm text-amber-400 font-medium mt-2">
              Free text export limit reached. <a href="/pricing" className="underline hover:text-white">Upgrade</a> for more options.
         </p>
      )}
    </div>
  );
};

export default ExportOptions; 