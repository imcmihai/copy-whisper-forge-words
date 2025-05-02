import React from 'react';
import { Progress } from '@/components/ui/progress';
import { UserSubscription } from '@/lib/api'; // Import the type

// Define props for the component
interface CreditDisplayProps {
  subscription: UserSubscription | null;
}

const CreditDisplay = ({ subscription }: CreditDisplayProps) => { // Destructure subscription from props
  
  // Handle case where subscription data is null or loading (passed as null)
  if (!subscription) {
    return (
        <div className="p-4 border rounded-lg bg-card text-card-foreground shadow min-h-[76px]">
            <p className="text-sm text-muted-foreground animate-pulse">Loading credits...</p>
        </div>
    );
  }

  // Conditionally render based on subscription tier
  if (subscription.tier === 'free') {
    return null; // Don't render anything for free users
  }

  // Handle potential null values for credits defensively
  const creditsRemaining = typeof subscription.creditsRemaining === 'number' ? Math.max(0, subscription.creditsRemaining) : 0;
  const creditsTotal = typeof subscription.creditsTotal === 'number' ? Math.max(1, subscription.creditsTotal) : 0; // Avoid division by zero
  
  // Calculate percentage only if total credits is meaningful (greater than 0)
  const percentage = creditsTotal > 0 ? Math.round((creditsRemaining / creditsTotal) * 100) : 0;
  const hasCreditLimit = creditsTotal > 0; // Check if there's an actual limit

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow min-h-[76px]"> {/* Added min-height */} 
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-base">Credits Remaining</h3>
        {hasCreditLimit ? (
            <span className="text-sm font-medium">{creditsRemaining} / {creditsTotal}</span>
        ) : (
             <span className="text-sm font-medium">N/A</span> // Or display 'Unlimited'
        )}
      </div>
      {hasCreditLimit ? (
          <Progress value={percentage} className="h-2 [&>div]:bg-primary" aria-label={`${percentage}% credits remaining`} />
      ) : (
           <div className="h-2 bg-muted rounded" /> // Placeholder bar if no limit
      )}
      {/* Show warning only if there is a limit and percentage is low */}
      {hasCreditLimit && percentage < 20 && (
        <p className="text-xs text-destructive mt-2 animate-pulse">
          You're running low on credits!
          {subscription.tier !== 'pro' && ' Consider upgrading.'} {/* Suggest upgrade only if not on top tier */} 
        </p>
      )}
      {/* Show message when credits are exhausted */}
       {hasCreditLimit && creditsRemaining === 0 && (
        <p className="text-xs text-destructive mt-2">
          You have used all your credits for this period.
        </p>
      )}
      {/* Message for plans without a specific credit limit (if applicable) */} 
      {/* {!hasCreditLimit && ( <p className="text-xs text-muted-foreground mt-2">Credit limits do not apply to your current plan.</p> )} */}
    </div>
  );
};

export default CreditDisplay; 