// src/App.tsx (Example)
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AuthPage from './pages/Auth';
import CopywritingFormPage from './pages/CopywritingFormPage';
//import PricingPage from './pages/Pricing'; // Assuming you have a Pricing page component
import ProtectedRoute from './components/auth/ProtectedRoute';
import NotFoundPage from './pages/NotFound'; // Example 404 page
import PricingPage from './components/PricingPage';
import Index from './pages/Index';
import Profile from './pages/Profile';
import GeneratedCopy from './pages/GeneratedCopy';
import Dashboard from './pages/Dashboard';
import FrameworksPage from './pages/FrameworksPage'; // Import the new FrameworksPage
import { SidebarProvider } from '@/components/ui/sidebar'; // Import SidebarProvider
import { Toaster } from '@/components/ui/toaster';
import Auth from '@/pages/Auth';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
// Import other layouts/pages as needed

const router = createBrowserRouter([
  {
    path: '/auth', // Authentication route - Public
    element: <AuthPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordForm />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordForm />,
  },
  {
    path: '/', // Default protected route (e.g., redirect to dashboard)
    // You might want a specific layout here or just navigate
    element: <Index />, // Or navigate to /dashboard
  },

  {
    // Protected Routes - All routes nested under here require authentication
    element: <ProtectedRoute />, // Wrap protected routes
    children: [
      {
        path: '/profile', // Authentication route - Public
        element: <Profile />,
      },

      {
        path: '/dashboard',
        element: <Dashboard/>,
      },
      {
        path: '/generated-copy/:chatId?', // Handle optional chatId
        element: (
          <SidebarProvider> {/* Wrap GeneratedCopy with the provider */}
            <GeneratedCopy />
          </SidebarProvider>
        ),
      },
      { // Add the route for the frameworks page BEFORE the copywriting form
        path: '/frameworks',
        element: <FrameworksPage />,
      },
      {
        path: '/copywriting-form',
        element: <CopywritingFormPage />,
      },
      {
        path: '/pricing', // Assuming pricing is also protected? Or move outside if public.
        element: <PricingPage />, // Replace with your actual pricing page component
      },
      // Add other protected routes here (e.g., profile/settings)
    ],
  },
  {
    path: '*', // Catch-all 404 route
    element: <NotFoundPage />,
  },
]);

function App() {
  // QueryClientProvider should wrap the RouterProvider if using React Query
  // const queryClient = new QueryClient();
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default App;