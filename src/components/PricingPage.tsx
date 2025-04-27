import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/lib/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckIcon, Loader2 } from 'lucide-react';
import { createCheckoutSession } from '@/lib/api';

// --- Placeholder Data and Functions (Replace with actual implementations) ---

// Placeholder types until hooks/API are implemented


// --- Pricing Page Component --- 

const PricingPage = () => {
  const { user, subscription } = useUser();
  const navigate = useNavigate();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoadingPriceId(priceId);

    try {
      const { url } = await createCheckoutSession({
        priceId,
        userId: user.id,
        returnUrl: window.location.origin + '/dashboard',
      });
      
      window.location.href = url;

    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start the subscription process. Please try again.');
      setLoadingPriceId(null);
    }
  };

  // Define plan details - you could fetch this from an API or define centrally
  const plans = [
    {
      tier: 'free',
      title: 'Free',
      description: 'For occasional use',
      price: '$0',
      features: [
        '3 active chats maximum',
        '3 messages per chat',
        '2 regenerations per copy',
        'Plain text export only',
        "1 image generation",
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outline' as const,
      stripePriceId: null, // No Stripe ID needed for free
    },
    {
      tier: 'basic',
      title: 'Basic',
      description: 'For regular content creators',
      price: '$9.99',
      priceSuffix: '/month',
      features: [
        '2,000 credits per month',
        'Unlimited chats',
        'ChatGPT-4o access',
        'Basic image generation',
        'Unlimited regenerations',
        'Plain text & Markdown export',
      ],
      buttonText: 'Subscribe',
      buttonVariant: 'default' as const,
      stripePriceId: 'price_1RI4DfIAnDuqLPpjtaQHxEhc', // Actual Stripe Price ID
      highlight: true, // Optional: flag to highlight this plan
    },
    {
      tier: 'pro',
      title: 'Pro',
      description: 'For power users',
      price: '$24.99',
      priceSuffix: '/month',
      features: [
        '6,000 credits per month',
        'Everything in Basic',
        'Access to ChatGPT-4.1',
        'High-quality image generation',
        'All export formats',
      ],
      buttonText: 'Subscribe',
      buttonVariant: 'default' as const,
      stripePriceId: 'price_1RI4GoIAnDuqLPpjRJVGnWWU', // Actual Stripe Price ID
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#10031F] to-[#1F063A] text-gray-200 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
       <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-[#FF2EE6]/15 via-transparent to-transparent rounded-full -translate-x-1/3 -translate-y-1/3 blur-3xl opacity-50 pointer-events-none"></div>
       <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-radial from-[#00FFCC]/10 via-transparent to-transparent rounded-full translate-x-1/3 translate-y-1/3 blur-3xl opacity-60 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-4 tracking-tight sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Choose Your Plan
        </h1>
        <p className="text-center text-purple-200/80 mb-12 text-lg sm:text-xl">
          Simple, transparent pricing designed to scale with you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.tier === plan.tier;
            const isLoading = loadingPriceId === plan.stripePriceId;
            
            // --- Adjusted Logic for Free Plan --- 
            let buttonAction: (() => void) | undefined;
            let buttonDisabled = isLoading || isCurrentPlan;
            let buttonText = plan.buttonText;
            let buttonVariant = plan.buttonVariant;

            if (plan.tier === 'free') {
              if (user) {
                // Logged in: Button disabled if already on free plan
                buttonDisabled = true; // Always disable free plan button for logged-in users
                buttonText = isCurrentPlan ? 'Current Plan' : 'Get Started'; // Show 'Current Plan' if applicable
              } else {
                // Not logged in: Button navigates to auth
                buttonAction = () => navigate('/auth');
                buttonDisabled = false; // Enable for non-logged-in users
              }
            } else if (plan.stripePriceId) {
              // Paid plans: Original logic
              buttonAction = () => handleSubscribe(plan.stripePriceId as string);
            }

            // Set variant for current plan display
            if (isCurrentPlan) {
                 buttonVariant = 'outline';
            }
            // --- End Adjusted Logic ---

            return (
              <Card
                key={plan.tier}
                className={`flex flex-col bg-[#1a052e]/60 border border-purple-500/30 rounded-xl shadow-lg transition-all duration-300 hover:shadow-purple-500/20 hover:border-purple-500/50 
                           ${plan.highlight ? 'border-purple-500 border-2 shadow-purple-500/30 scale-105 z-10' : 'hover:scale-[1.02]'}`}
              >
                <CardHeader className="pb-4 border-b border-purple-500/20">
                  <CardTitle className="text-2xl font-semibold text-purple-300">{plan.title}</CardTitle>
                  <CardDescription className="text-purple-200/70 h-10">{plan.description}</CardDescription> 
                  <div className="mt-4 pt-2">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      {plan.priceSuffix && <span className="text-sm font-normal text-purple-200/80 ml-1">{plan.priceSuffix}</span>}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow pt-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="h-5 w-5 mr-2 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-purple-200/90">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6 border-t border-purple-500/20">
                  <Button 
                    variant={buttonVariant} // Use adjusted variant
                    className={`w-full transition-all duration-300 
                               ${isCurrentPlan ? 'bg-transparent border-purple-400 text-purple-300 cursor-default' : 
                               buttonVariant === 'outline' ? 'border-purple-400 text-purple-300 hover:bg-purple-500/10 hover:text-white' : 
                               'bg-purple-600 hover:bg-purple-700 text-white'} 
                               ${buttonDisabled && !isCurrentPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={buttonAction}
                    disabled={buttonDisabled}
                    data-price-id={plan.stripePriceId}
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      buttonText // Use adjusted button text
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div> 
    </div>
  );
};

export default PricingPage; 