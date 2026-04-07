import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { WhatsAppFloat } from '../ui/WhatsAppFloat';
import { ComparisonBar } from '../comparison/ComparisonBar';
import { Toaster } from '../ui/Toaster';

export function Layout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      <WhatsAppFloat />
      <ComparisonBar />
      <Toaster />
    </div>
  );
}
