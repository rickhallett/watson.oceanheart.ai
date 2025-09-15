import React, { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { MainPanel } from '@/components/layout/MainPanel';
import { BackgroundBeams } from '@/components/ui/background-beams';

export function AppLayout() {
  const [activeView, setActiveView] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');
  
  return (
    <div className="min-h-screen bg-black/[0.96] flex flex-col relative">
      <BackgroundBeams />
      <div className="relative z-10 flex flex-col min-h-screen">
        <AppHeader onNavigate={setActiveView} activeView={activeView} />
        <MainPanel activeView={activeView} />
        <AppFooter />
      </div>
    </div>
  );
}