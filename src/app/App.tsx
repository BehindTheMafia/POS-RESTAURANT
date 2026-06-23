import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeProvider';
import { ConfigError } from './components/ConfigError';
import { isSupabaseConfigured } from '../lib/supabase';
import { Toaster } from 'sonner';

export default function App() {
  if (!isSupabaseConfigured) {
    return <ConfigError />;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
        <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontFamily: 'inherit',
          },
        }}
        />
      </ThemeProvider>
    </AuthProvider>
  );
}
