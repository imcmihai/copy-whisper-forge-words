
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ArrowRight, Check, Star, Rocket, LightBulb, TrendingUp, MessageSquare } from 'lucide-react';
import { User } from '@supabase/supabase-js';

const Index = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
      setIsLoading(false);
    };
    
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleCTAClick = () => {
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] text-white">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-gradient-to-r from-[#1A052E]/80 to-[#2D0A4E]/80 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold neon-text">CopyWhisper</h1>
          </div>

          <div className="flex gap-4 items-center">
            {!isLoading && (
              currentUser ? (
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  className="bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] hover:opacity-90"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/auth')}
                    className="text-purple-300 hover:text-white hover:bg-purple-500/20"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => navigate('/auth?mode=signup')}
                    className="bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] hover:opacity-90"
                  >
                    Sign Up Free
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
                onClick={handleCTAClick}
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

      {/* Features Section */}
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
            {[
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
                icon: <LightBulb className="h-10 w-10 text-[#00FFCC]" />,
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
            ].map((feature, index) => (
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

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by <span className="neon-text">Marketing Professionals</span>
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              See why thousands of marketers rely on CopyWhisper for their content creation needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "CopyWhisper has revolutionized our content strategy. We've seen a 43% increase in conversion rates since implementing the copy generated by this tool.",
                author: "Sarah Johnson",
                role: "Marketing Director"
              },
              {
                quote: "The SEO optimization is incredible. Our blog posts are ranking higher than ever, and the time saved is allowing us to focus on strategy rather than writing.",
                author: "Michael Chen",
                role: "SEO Specialist"
              },
              {
                quote: "As a small business owner, I don't have time to write perfect copy. CopyWhisper gives me professional-quality content in minutes instead of hours.",
                author: "Jessica Williams",
                role: "Ecommerce Owner"
              }
            ].map((testimonial, index) => (
              <div key={index} className="glassmorphism p-8 rounded-2xl border border-purple-500/20">
                <div className="mb-6 text-[#00FFCC]">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.33333 18.6667C9.33333 16.4667 11.1333 14.6667 13.3333 14.6667V10.6667C8.93333 10.6667 5.33333 14.2667 5.33333 18.6667V26.6667H13.3333V18.6667H9.33333ZM23.3333 14.6667V10.6667C18.9333 10.6667 15.3333 14.2667 15.3333 18.6667V26.6667H23.3333V18.6667H19.3333C19.3333 16.4667 21.1333 14.6667 23.3333 14.6667Z" fill="currentColor"/>
                  </svg>
                </div>
                <p className="text-purple-200 mb-6">{testimonial.quote}</p>
                <div>
                  <p className="font-bold">{testimonial.author}</p>
                  <p className="text-purple-300 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
              onClick={handleCTAClick}
              size="lg"
              className="bg-gradient-to-r from-[#FF2EE6] to-[#00FFCC] hover:opacity-90 text-white py-6 px-10 text-lg rounded-xl shadow-[0_0_15px_rgba(255,46,230,0.5)] relative z-10"
            >
              Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-purple-500/20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h2 className="text-2xl font-bold neon-text mb-4 md:mb-0">CopyWhisper</h2>
            
            <div className="flex gap-6">
              <a href="#" className="text-purple-300 hover:text-white transition-colors">Features</a>
              <a href="#" className="text-purple-300 hover:text-white transition-colors">Pricing</a>
              <a href="#" className="text-purple-300 hover:text-white transition-colors">FAQ</a>
              <a href="#" className="text-purple-300 hover:text-white transition-colors">Support</a>
            </div>
          </div>
          
          <div className="border-t border-purple-500/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-purple-300 mb-4 md:mb-0">© 2025 CopyWhisper. All rights reserved.</p>
            
            <div className="flex gap-6">
              <a href="#" className="text-purple-300 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-purple-300 hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
