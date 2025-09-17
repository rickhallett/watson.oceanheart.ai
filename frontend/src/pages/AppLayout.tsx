import React, { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { MainPanel } from '@/components/layout/MainPanel';
import { SkewedBackground } from '@/components/SkewedBackground';

export function AppLayout() {
  const [activeView, setActiveView] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');
  
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative">
      {/* Replace BackgroundBeams with SkewedBackground for monochrome design */}
      <SkewedBackground opacity={0.02} />
      <div className="relative z-10 flex flex-col min-h-screen">
        <AppHeader onNavigate={setActiveView} activeView={activeView} />
        <MainPanel activeView={activeView} />
        <AppFooter />
      </div>
    </div>
  );
}