
import { useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';

const GeneratedCopy = () => {
  const location = useLocation();
  const { generatedText } = location.state || { generatedText: null };

  if (!generatedText) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-2xl p-6">
          <p className="text-center text-gray-500">No generated text available.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Generated Copywriting</h1>
          <div className="space-y-4 whitespace-pre-wrap">
            {generatedText}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GeneratedCopy;
