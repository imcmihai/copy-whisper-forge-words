import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess'; // Import the hook we created

interface ModelSelectorProps {
  value: string; // The currently selected model ID (e.g., 'gpt-4o-mini')
  onChange: (value: string) => void; // Callback function when selection changes
  label?: string; // Optional label for the select dropdown
  placeholder?: string; // Optional placeholder text
}

// Helper function to get display names for models
const getModelDisplayName = (modelId: string): string => {
  switch (modelId) {
    case 'gpt-4o-mini': return 'GPT-4o Mini';
    case 'gpt-4o': return 'GPT-4o';
    case 'gpt-4.1': return 'GPT-4.1 (Pro)'; // Indicate Pro tier access
    default: return modelId; // Fallback to ID if unknown
  }
};

const ModelSelector = ({ 
    value, 
    onChange, 
    label = "AI Model", 
    placeholder = "Select model" 
}: ModelSelectorProps) => {
  const { getAvailableModels } = useFeatureAccess(); // Use the hook
  const availableModels = getAvailableModels();

  // If no models are available for some reason (e.g., error in hook), render nothing or a message
  if (!availableModels || availableModels.length === 0) {
      // console.warn("ModelSelector: No available models found.");
      // Optionally return null or a disabled state
      return (
          <div className="space-y-2">
              {label && <label className="text-sm font-medium text-muted-foreground">{label}</label>}
              <Select disabled>
                  <SelectTrigger>
                      <SelectValue placeholder="No models available" />
                  </SelectTrigger>
              </Select>
          </div>
      );
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full"> {/* Ensure trigger takes full width */} 
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent> {/* Position relative to trigger */} 
          {availableModels.map((model) => (
            <SelectItem key={model} value={model}>
              {getModelDisplayName(model)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelector; 