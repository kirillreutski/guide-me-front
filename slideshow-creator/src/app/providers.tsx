'use client';

import type React from 'react';
import { SlideshowProvider } from '@/context/slideshow-context';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SlideshowProvider>
      {children}
      <Toaster />
    </SlideshowProvider>
  );
}
