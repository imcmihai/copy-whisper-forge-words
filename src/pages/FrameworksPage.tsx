import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { frameworks, Framework } from '@/lib/constants'; // Assuming constants are in lib
import { CheckCircle, Sparkles, Loader2 } from 'lucide-react';

// Helper to categorize frameworks for styling (optional)
const getFrameworkCategory = (id: string): string => {
  if (['aida', 'pas', '4ps'].includes(id)) return 'persuasion';
  if (['bab', 'psr'].includes(id)) return 'transformation';
  if (['fab', 'howto'].includes(id)) return 'clarity';
  return 'default';
};

const FrameworksPage = () => {
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  const handleSelectFramework = (id: string) => {
    setSelectedFrameworkId(id);
  };

  const handleContinue = () => {
    if (selectedFrameworkId) {
      setIsNavigating(true);
      console.log(`Navigating with framework: ${selectedFrameworkId}`);
      // Simulate navigation delay if needed, or just navigate
      setTimeout(() => {
         navigate('/copywriting-form', { state: { frameworkId: selectedFrameworkId } });
         // No need to setIsNavigating(false) as the component will unmount
      }, 150); // Short delay for visual feedback
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] p-4 md:p-8 flex flex-col items-center">
       {/* Optional: Add a subtle gradient overlay or pattern if desired */}
      <div className="w-full max-w-6xl relative">
        {/* Animated gradient background element (optional, for effect) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2EE6] via-[#6C22BD] to-[#00FFCC] opacity-10 blur-3xl animate-gradient -z-10" />

        <div className="glassmorphism relative z-10 p-6 md:p-10 rounded-2xl border border-purple-500/20 shadow-xl">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold neon-text mb-3 flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-[#FF2EE6]" />
              Choose Your Copywriting Framework
              <Sparkles className="h-6 w-6 text-[#00FFCC]" />
            </h1>
            <p className="text-lg text-purple-300/90 max-w-3xl mx-auto">
              Select a structure to guide the AI. Each framework offers a different approach to crafting compelling copy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {frameworks.map((framework: Framework) => {
              const isSelected = selectedFrameworkId === framework.id;
              const category = getFrameworkCategory(framework.id);
              
              // Define hover styles based on category
              let hoverStyle = 'hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(192,132,252,0.3)]'; // Default purple hover
              if (category === 'persuasion') {
                hoverStyle = 'hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(255,46,230,0.3)]';
              } else if (category === 'transformation') {
                hoverStyle = 'hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(0,255,204,0.3)]';
              }

              return (
                <Card 
                  key={framework.id} 
                  onClick={() => handleSelectFramework(framework.id)}
                  className={`cursor-pointer transition-all duration-300 ease-in-out glassmorphism border border-purple-500/20 text-white h-full flex flex-col ${hoverStyle} ${
                    isSelected 
                      ? 'border-pink-500/80 ring-2 ring-pink-500/70 shadow-[0_0_20px_rgba(255,46,230,0.6)] bg-white/10 scale-105' 
                      : 'bg-white/5'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-1">
                      <CardTitle className="text-xl font-semibold text-white">{framework.name}</CardTitle>
                      {isSelected && (
                        <CheckCircle className="h-6 w-6 text-pink-400 flex-shrink-0" />
                      )}
                    </div>
                    <CardDescription className="text-purple-300/80 text-sm">{framework.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-xs text-purple-400/90 italic">
                      <span className="font-semibold not-italic text-purple-300">Best for:</span> {framework.useCase}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center mt-8">
            <Button 
              onClick={handleContinue} 
              disabled={!selectedFrameworkId || isNavigating}
              size="lg"
              className="w-full md:w-auto px-10 py-3 bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] hover:opacity-90 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,46,230,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isNavigating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Proceeding...
                </>
              ) : (
                'Continue with Selected Framework'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameworksPage; 