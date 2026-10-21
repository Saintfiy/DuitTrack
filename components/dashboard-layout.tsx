'use client';

import { ReactNode } from 'react';
import { useUIStore } from '@/store';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  hideTitle?: boolean;
}

export function DashboardLayout({ children, title, hideTitle = false }: DashboardLayoutProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`pt-16 print:pt-0 transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[72px]'
      } print:m-0`}
    >
      <div className="p-4 md:p-6">
        {title && !hideTitle && (
          <div className="mb-6 md:mb-8 print:hidden">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold gradient-text">{title}</h1>
          </div>
        )}
        {children}
      </div>
    </motion.main>
  );
}
