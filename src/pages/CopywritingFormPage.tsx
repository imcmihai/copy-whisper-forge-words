import { CopywritingForm } from '@/components/CopywritingForm';
import { Sparkles } from 'lucide-react';

const CopywritingFormPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] p-4 flex flex-col items-center justify-center relative">
      <div className="w-full max-w-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2EE6] via-[#6C22BD] to-[#00FFCC] opacity-10 blur-3xl animate-gradient -z-10" />
        
        <div className="glassmorphism relative z-10 p-8 rounded-2xl border border-purple-500/20 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold neon-text mb-2">Generate New Copy</h1>
            <p className="text-lg text-gray-300 flex items-center justify-center gap-2">
              Fill in the details below <Sparkles className="h-5 w-5 text-[#00FFCC]" />
            </p>
          </div>
          
          <CopywritingForm />
        </div>
      </div>
    </div>
  );
};

export default CopywritingFormPage; 