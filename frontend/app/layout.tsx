import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'PymeN',
  description: 'Enterprise full stack boilerplate',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
