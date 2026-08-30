'use client';

import { Providers } from '@/components/providers';
import '@/styles/globals.css';
import { ReactNode } from 'react';

import { ToastContainer } from '@/components/ui';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0B0F1A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DuitTrack" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon-precomposed.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="description" content="Pembukuan pintar untuk UMKM Indonesia. Kelola keuangan, inventori, dan pelanggan dalam satu platform." />
        <title>DuitTrack  Pembukuan Pintar untuk UMKM</title>
      </head>
      <body className="relative bg-dark text-white antialiased">
        <Providers>{children}</Providers>
        <ToastContainer />
      </body>
    </html>
  );
}
