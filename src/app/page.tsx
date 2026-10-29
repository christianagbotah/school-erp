'use client';

import { AppProvider } from '@/components/app-provider';
import { Portal } from '@/components/portal';

export default function Home() {
  return (
    <AppProvider>
      <Portal />
    </AppProvider>
  );
}
