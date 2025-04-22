
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';

interface CTAProps {
  onCTAClick: () => void;
}

export const CallToAction = ({ onCTAClick }: CTAProps) => {
  return (
    <section className="py-16 md:py-24 px-4 bg-[#140426]">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="glassmorphism p-10 md:p-16 rounded-3xl border border-purple-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF2EE6] via-[#6C22BD] to-[#00FFCC] opacity-10 blur-3xl"></div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">
            Ready to Transform Your <span className="neon-text">Content Strategy</span>?
          </h2>
          
          <p className="text-xl text-purple-200 mb-10 max-w-3xl mx-auto relative z-10">
            Join thousands of marketers who are saving time and increasing conversions with AI-powered copywriting.
          </p>
          
          <Button 
            onClick={onCTAClick}
            size="lg"
            className="bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] hover:opacity-90 text-white py-6 px-10 text-lg rounded-xl shadow-[0_0_15px_rgba(255,46,230,0.5)] relative z-10"
          >
            Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
