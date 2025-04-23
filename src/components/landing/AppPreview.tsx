import React from 'react';
import { Nut, Bot, CopyCheck } from 'lucide-react'; // Example icons
import FormImage from '../../../public/copywriting-form.png'
import GeneratedCopyImage from '../../../public/generate-copy.png';
import RefinedCopyImage from '../../../public/copywriting-form.png';
// Placeholder component for images - Replace with your actual image handling
const ImagePlaceholder = ({ description, className }: { description: string, className?: string }) => (
  <div className={`bg-white/10 border border-purple-500/20 rounded-lg flex items-center justify-center text-purple-300 text-sm aspect-video ${className}`}>
    {description}
  </div>
);

export const AppPreview = () => {
  const step = [
    {
      icon: <Nut className="h-8 w-8 text-[#FF2EE6]" />,
      title: "1. Define Your Needs",
      description: "Fill out our simple, guided form. Tell the AI about your product, target audience, desired tone, and format. No complex prompts needed!",
      imageDescription: "[Screenshot of Copywriting Form]",
      image: FormImage,
    },
    {
      icon: <Bot className="h-8 w-8 text-[#00FFCC]" />,
      title: "2. Generate Instantly",
      description: "Click 'Generate' and let our AI craft high-quality copy tailored to your inputs in seconds. See the results immediately.",
      imageDescription: "[Screenshot of Generated Copy Page]",
      image: GeneratedCopyImage,
    },
    {
      icon: <CopyCheck className="h-8 w-8 text-[#FF2EE6]" />,
      title: "3. Use or Refine",
      description: "Copy the generated text with one click. (Future: Use our intuitive chat interface to easily tweak and perfect the copy until it's exactly right).",
      imageDescription: "[Screenshot of Chat/Refinement UI - Optional/Future]",
      image: RefinedCopyImage,
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-[#140426] to-[#1A052E]">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            See How <span className="neon-text">Easy</span> It Is
          </h2>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            Get stunning copy in just a few simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          {step.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="mb-6 p-4 bg-purple-500/10 rounded-full border border-purple-500/20">
                {step.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
              <p className="text-purple-200 mb-8 text-lg leading-relaxed">{step.description}</p>
              {/* Replace ImagePlaceholder with your actual <img /> or Next/Image component */}
              <img src={step.image} className="w-full shadow-lg rounded-xl" />
              
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}; 