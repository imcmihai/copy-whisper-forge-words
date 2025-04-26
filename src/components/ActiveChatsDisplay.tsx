import React from 'react';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/lib/hooks/useUser'; // Assuming path is correct
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess'; // Assuming path is correct
import { Link } from 'react-router-dom'; // Or your router's Link component

const ActiveChatsDisplay = () => {
  const { usage } = useUser();
  const { getMaxChats, tier } = useFeatureAccess();

  // Only display this for the free tier
  if (tier !== 'free' || !usage) {
    return null;
  }

  const activeChats = usage.activeChatCount;
  const maxChats = getMaxChats(); // Should return 3 for free tier
  
  // Prevent division by zero or negative numbers if data is unexpected
  const maxChatsDisplay = Math.max(1, maxChats);
  const activeChatsClamped = Math.max(0, Math.min(activeChats, maxChatsDisplay));
  
  const percentage = maxChatsDisplay > 0 ? Math.round((activeChatsClamped / maxChatsDisplay) * 100) : 0;
  const isLimitReached = activeChats >= maxChats;

  return (
    <div className="bg-white/10 p-4 rounded-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-lg text-white">Active Chats</h3>
        <span className={`text-lg font-bold ${isLimitReached ? 'text-red-400' : 'text-white'}`}>
          {activeChatsClamped} / {maxChatsDisplay}
        </span>
      </div>
      <Progress value={percentage} className="h-2 bg-purple-900/50 [&>div]:bg-gradient-to-r [&>div]:from-[#FF2EE6] [&>div]:to-[#00FFCC]" />
      {isLimitReached && (
        <p className="text-sm text-amber-400 mt-2">
          You've reached the maximum number of active chats for the free plan. 
          <Link to="/pricing" className="underline font-medium hover:text-white">Upgrade</Link> to create more.
        </p>
      )}
    </div>
  );
};

export default ActiveChatsDisplay; 