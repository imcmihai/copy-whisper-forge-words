import React from 'react';
import ImageGenerator from '@/components/ImageGenerator';
import ExportOptions from '@/components/ExportOptions';

interface ChatToolsSidebarProps {
  lastAssistantTextMessageContent: string;
  handleImageGenerated: (imageUrl: string) => void;
  generatedImages: string[];
  isProcessing: boolean;
  isInputDisabled: boolean; // Combined disabled state from parent
  fileNamePrefix: string;
}

export const ChatToolsSidebar: React.FC<ChatToolsSidebarProps> = ({
  lastAssistantTextMessageContent,
  handleImageGenerated,
  generatedImages,
  isProcessing,
  isInputDisabled,
  fileNamePrefix
}) => {
  // Only render if there is content to base tools on
  if (!lastAssistantTextMessageContent) {
    return null; 
  }

  return (
    <div className="w-80 flex-shrink-0 p-4 space-y-4 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-purple-700 scrollbar-track-transparent">
      {/* Image Generator */}
      <ImageGenerator 
          prompt={lastAssistantTextMessageContent} 
          onImageGenerated={handleImageGenerated}
          disabled={isProcessing || isInputDisabled} // Pass down the combined disabled state
      />
      
      {/* Export Options */}
      <ExportOptions 
          content={lastAssistantTextMessageContent}
          images={generatedImages}
          fileNamePrefix={fileNamePrefix}
      />
      
      {/* Add more tools here later if needed */}
    </div>
  );
}; 