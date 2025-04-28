import { CopywritingForm } from '@/components/CopywritingForm';
import { Sparkles, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const CopywritingFormPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const frameworkId = location.state?.frameworkId as string | undefined;

  useEffect(() => {
    if (!frameworkId) {
      console.warn('No framework selected, redirecting to framework selection.');
      navigate('/frameworks');
    }
  }, [frameworkId, navigate]);

  if (!frameworkId) {
    return null;
  }

  console.log("Framework ID received in form:", frameworkId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] p-4 flex flex-col items-center justify-center relative">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/dashboard')}
        className="absolute top-4 right-4 text-purple-300 hover:text-white hover:bg-purple-500/20 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
        title="Go to Dashboard"
      >
        <LayoutDashboard className="h-5 w-5" />
        <span>Dashboard</span>
      </Button>

      <div className="w-full max-w-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2EE6] via-[#6C22BD] to-[#00FFCC] opacity-10 blur-3xl animate-gradient -z-10" />
        
        <div className="glassmorphism relative z-10 p-8 rounded-2xl border border-purple-500/20 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold neon-text mb-2">Generate New Copy</h1>
            <p className="text-lg text-gray-300 flex items-center justify-center gap-2">
              Fill in the details below <Sparkles className="h-5 w-5 text-[#00FFCC]" />
            </p>
          </div>
          
          <CopywritingForm frameworkId={frameworkId} />
        </div>
      </div>
    </div>
  );
};

export default CopywritingFormPage; 