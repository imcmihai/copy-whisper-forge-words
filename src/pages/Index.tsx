
import { CopywritingForm } from '@/components/CopywritingForm';
import { Sparkles } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] p-4 flex items-center justify-center">
      <div className="w-full max-w-md relative">
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2EE6] via-[#6C22BD] to-[#00FFCC] opacity-30 blur-3xl animate-gradient" />
        
        <div className="glassmorphism relative z-10 p-8 rounded-2xl">
          <div className="flex items-center justify-center gap-2 mb-6">
            <h1 className="text-3xl font-bold neon-text">CopyWhisper</h1>
            <Sparkles className="h-6 w-6 text-[#00FFCC]" />
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF2EE6]/20 to-[#00FFCC]/20 blur-xl" />
            <CopywritingForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
