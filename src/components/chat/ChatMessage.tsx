import React from 'react';
import { Bot, Copy, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
}

// Helper function to check if content is a stringified image JSON
const isImageContent = (content: string): { type: 'image', url: string } | null => {
    try {
        // Only parse if it looks like our specific JSON structure
        if (content.startsWith('{"type":"image","url":"') && content.endsWith('"}')) {
            const parsed = JSON.parse(content);
            if (parsed && typeof parsed === 'object' && parsed.type === 'image' && typeof parsed.url === 'string') {
                return parsed;
            }
        }
    } catch (e) {
        // Ignore parsing errors, treat as text
        return null;
    }
    return null;
};

export const ChatMessage = ({ content, isUser }: ChatMessageProps) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Text has been copied to your clipboard",
      });
    }).catch(err => {
      toast({
        title: "Failed to copy",
        description: "An error occurred while copying the text",
        variant: "destructive"
      });
    });
  };

  // Check if the content represents an image
  const imageInfo = isImageContent(content);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] p-4 rounded-2xl flex group relative transition-all duration-300 text-white
        ${isUser 
          ? "bg-[#6C22BD] rounded-tr-none neon-glow" 
          : "glassmorphism rounded-tl-none neon-border"}`}
      >
        {/* Copy button should not appear for images, or should copy URL? For now, hide. */}
        {!isUser && !imageInfo && (
            <div className="absolute top-2 -left-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                onClick={() => copyToClipboard(content)} 
                className="p-1 bg-[#3a1465]/60 backdrop-blur-md rounded-full hover:bg-[#4A1A82] transition-colors"
                >
                <Copy className="h-4 w-4 text-[#00FFCC]" />
                </button>
            </div>
        )}
        <div className="flex gap-3 items-start">
          {!isUser && (
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#4A1A82] flex items-center justify-center shadow-[0_0_10px_rgba(157,78,221,0.4)]">
              <Bot className="h-5 w-5 text-[#FF2EE6]" />
            </div>
          )}
          <div className="flex-1">
            {/* Render image or text based on parsed content */}
            {imageInfo ? (
                <div className="overflow-hidden rounded-lg border border-purple-500/30 shadow-md">
                    <img 
                        src={imageInfo.url}
                        alt="Generated image in chat" 
                        className="max-w-full h-auto object-contain cursor-pointer"
                        onClick={() => window.open(imageInfo.url, '_blank')}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                </div>
            ) : (
                <div className="whitespace-pre-wrap">{content}</div>
            )}
          </div>
          {isUser && (
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#6C22BD] flex items-center justify-center shadow-[0_0_10px_rgba(108,34,189,0.4)]">
              <User className="h-5 w-5 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
