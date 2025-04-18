
import { CopywritingForm } from '@/components/CopywritingForm';

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Copywriting Generator</h1>
        <CopywritingForm />
      </div>
    </div>
  );
};

export default Index;
