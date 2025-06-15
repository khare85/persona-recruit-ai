
"use client"; // Required for usePathname

// import type { Metadata } from 'next'; // Metadata currently handled in head
import './globals.css';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar'; // Public Navbar
import { Footer } from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { DashboardLayout } from '@/components/layout/DashboardLayout'; // Authenticated App Layout
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider
import { Container } from '@/components/shared/Container'; // Import Container

// Metadata can still be defined, but if used in client component, might need dynamic handling or be static.
// For simplicity, we'll keep it static here. Next.js handles this well.
// export const metadata: Metadata = { 
// title: 'Persona Recruit AI',
// description: 'Accelerating recruitment with the power of AI.',
// };


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const isAuthPage = pathname === '/auth';
  const isHomePage = pathname === '/';
  // Add any other strictly public, non-dashboard pages here
  const isPublicPage = isAuthPage || isHomePage;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Moved GFonts link here for better organization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <title>Persona Recruit AI</title> 
        <meta name="description" content="Accelerating recruitment with the power of AI." />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-background">
        <AuthProvider> {/* Wrap entire application with AuthProvider */}
          {isPublicPage ? (
            <>
              <Navbar /> {/* Public navbar for home, auth */}
              <main className="flex-grow">
                 {/* Public pages use Container directly if needed */}
                {children}
              </main>
            </>
          ) : (
            <DashboardLayout> {/* DashboardLayout wraps all authenticated app content */}
              {/* Pages inside DashboardLayout will use Container for their content padding */}
              {children} 
            </DashboardLayout>
          )}
          <Footer />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
