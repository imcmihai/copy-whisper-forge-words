
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface HeroProps {
  onCTAClick: () => void;
}

export const Hero = ({ onCTAClick }: HeroProps) => {
  return (
    <section className="pt-28 md:pt-40 pb-20 md:pb-32 px-4 container mx-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="neon-text">AI-Powered</span> Copywriting <br /> 
            <span className="text-white">for your Brand</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-purple-200 mb-8 max-w-2xl">
            Transform your marketing content with breakthrough AI that writes compelling, 
            conversion-focused copy in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
            <Button 
              onClick={onCTAClick}
              size="lg"
              className="bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] hover:opacity-90 text-white py-6 px-8 text-lg rounded-xl shadow-[0_0_15px_rgba(255,46,230,0.5)]"
            >
              Start Creating Copy <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              className="border-purple-500/30 hover:bg-purple-500/20 text-white py-6 px-8 text-lg rounded-xl"
            >
              View Examples
            </Button>
          </div>
          
          <div className="text-purple-300 flex items-center gap-6 justify-center md:justify-start">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-[#1A052E]"></div>
              ))}
            </div>
            <p>Trusted by 10,000+ marketers</p>
          </div>
        </div>
        
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF2EE6] via-[#6C22BD] to-[#00FFCC] opacity-30 blur-3xl rounded-full"></div>
          <div className="relative glassmorphism p-8 rounded-2xl border border-purple-500/20 shadow-xl">
            <div className="text-center mb-4">
              <Sparkles className="inline-block text-[#00FFCC] h-6 w-6 mb-2" />
              <h3 className="text-xl font-medium">See AI Copywriting in Action</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-lg">
                <p className="text-sm text-purple-200">Generate compelling product descriptions that convert browsers into buyers with just a few clicks.</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <p className="text-sm text-purple-200">Create engaging social media captions that spark conversation and boost engagement rates.</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <p className="text-sm text-purple-200">Craft email subject lines that improve open rates and drive more clicks to your offers.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
