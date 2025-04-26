import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '@/lib/hooks/useUser'; // Your centralized user hook
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  // You could add props here if needed, e.g., required roles/permissions
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
  const { user, isLoading, error } = useUser();
  const location = useLocation(); // Get current location to redirect back after login

  // 1. Handle Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A052E] to-[#2D0A4E]">
        <p className="text-white animate-pulse">Authenticating...</p>
      </div>
    );
  }

  // 2. Handle Error State (Optional but recommended)
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1A052E] to-[#2D0A4E] text-white p-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
        <p className="text-red-300">{error.message || "Could not verify your session."}</p>
        {/* Optionally add a button to retry or go to login */}
      </div>
    );
  }

  // 3. Handle Not Authenticated State
  if (!user) {
    console.log('ProtectedRoute: User not authenticated, redirecting to auth.');
    // Redirect them to the /auth page, saving the current location they were trying to go to
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 4. User is Authenticated: Render the child route component
  return <Outlet />; // Renders the nested route defined in your App router
};

export default ProtectedRoute; 