'use client';

import { Sidebar } from '@/components/sidebar';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, user, business, logout } = useAuth({ requireAuth: true });

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="relative min-h-screen bg-dark">
      <div className="print:hidden">
        <Sidebar user={user} business={business} logout={logout} />
        <Navbar />
      </div>
      {children}
    </div>
  );
}
