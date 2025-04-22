
import { MessageSquare, Star, Rocket, Lightbulb, TrendingUp, Check } from 'lucide-react';

export const Features = () => {
  const features = [
    {
      icon: <MessageSquare className="h-10 w-10 text-[#FF2EE6]" />,
      title: "SEO-Optimized Content",
      description: "Generate keyword-rich copy that ranks higher in search engines and drives organic traffic to your website."
    },
    {
      icon: <Star className="h-10 w-10 text-[#00FFCC]" />,
      title: "Conversion-Focused",
      description: "Create persuasive copy that speaks directly to your audience's pain points and drives them to take action."
    },
    {
      icon: <Rocket className="h-10 w-10 text-[#FF2EE6]" />,
      title: "Lightning Fast",
      description: "Generate multiple variations of high-quality copy in seconds, not hours or days."
    },
    {
      icon: <Lightbulb className="h-10 w-10 text-[#00FFCC]" />,
      title: "Overcome Writer's Block",
      description: "Never stare at a blank page again. Get instant inspiration and ready-to-use copy for any marketing need."
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-[#FF2EE6]" />,
      title: "A/B Testing Ready",
      description: "Generate multiple versions of your copy to test and optimize for the highest conversion rates."
    },
    {
      icon: <Check className="h-10 w-10 text-[#00FFCC]" />,
      title: "Brand Voice Consistency",
      description: "Maintain your unique brand voice across all marketing channels with our AI that learns your style."
    }
  ];

  return (
    <section className="py-16 md:py-24 px-4 bg-[#140426]">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="neon-text">AI Copywriting</span> Made Effortless
          </h2>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            Our platform removes the guesswork from creating high-converting copy for any marketing channel.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="glassmorphism p-8 rounded-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:neon-text transition-all duration-300">{feature.title}</h3>
              <p className="text-purple-200">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
