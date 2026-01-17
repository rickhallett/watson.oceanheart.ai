import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppFooter } from '@/components/layout/AppFooter';
import { MainPanel } from '@/components/layout/MainPanel';
import { SkewedBackground } from '@/components/SkewedBackground';
import { Toast } from '@/components/Toast';
import { Breadcrumb } from '@/components/Breadcrumb';
import { CommandPalette, useCommandPalette, defaultCommands } from '@/components/CommandPalette';
import { MonochromeButton } from '@/components/MonochromeButton';
import { Home, BarChart3, Settings, User, FileText, Search } from 'lucide-react';

type ViewType = 'dashboard' | 'reviews' | 'analytics' | 'profile' | 'settings';

export function AppLayout() {
  const { view } = useParams<{ view?: string }>();
  const navigate = useNavigate();

  // Parse view from URL, default to dashboard
  const activeView: ViewType = (['dashboard', 'reviews', 'analytics', 'profile', 'settings'].includes(view || '')
    ? view as ViewType
    : 'dashboard');

  const setActiveView = (newView: ViewType) => {
    navigate(`/app/${newView}`);
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({
    show: false, message: '', type: 'info'
  });
  const commandPalette = useCommandPalette();

  const navigationTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'reviews', label: 'Reviews', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const breadcrumbItems = [
    { label: 'Watson', href: '/', path: '/' },
    { label: activeView.charAt(0).toUpperCase() + activeView.slice(1), path: `/${activeView}` }
  ];

  const appCommands = [
    ...defaultCommands,
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      description: 'Navigate to main dashboard',
      icon: Home,
      shortcut: '⌘D',
      action: () => setActiveView('dashboard')
    },
    {
      id: 'search',
      title: 'Search Reviews',
      description: 'Search through clinical reviews',
      icon: Search,
      shortcut: '⌘S',
      action: () => {
        setToast({
          show: true,
          message: 'Search functionality coming soon',
          type: 'info'
        });
      }
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex relative">
      {/* Background effect */}
      <SkewedBackground opacity={0.02} />
      
      <div className="relative z-10 flex w-full">
        {/* Animated Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 80 : 256 }}
          className="bg-zinc-900/50 backdrop-blur border-r border-zinc-800 flex flex-col"
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <motion.h1 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg font-bold text-zinc-50"
                >
                  Watson
                </motion.h1>
              )}
              <MonochromeButton
                variant="icon"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? '→' : '←'}
              </MonochromeButton>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navigationTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    data-testid={`nav-${tab.id}`}
                    onClick={() => setActiveView(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                      activeView === tab.id
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{tab.label}</span>
                        {tab.count && (
                          <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full">
                            {tab.count}
                          </span>
                        )}
                      </>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-zinc-800">
            <MonochromeButton
              variant="ghost"
              size="sm"
              fullWidth={!sidebarCollapsed}
              onClick={() => commandPalette.open()}
            >
              {sidebarCollapsed ? '⌘' : 'Quick Actions ⌘K'}
            </MonochromeButton>
          </div>
        </motion.aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Enhanced Header */}
          <header className="bg-zinc-900/30 backdrop-blur border-b border-zinc-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Breadcrumb items={breadcrumbItems} />
                <h2 className="text-xl font-semibold text-zinc-50 mt-2">
                  {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <MonochromeButton
                  variant="ghost"
                  size="sm"
                  onClick={() => commandPalette.open()}
                >
                  Search ⌘K
                </MonochromeButton>
                <MonochromeButton variant="icon" size="sm">
                  <User className="w-4 h-4" />
                </MonochromeButton>
              </div>
            </div>
          </header>

          {/* Content with page transitions */}
          <main className="flex-1 p-6" data-testid="main-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <MainPanel activeView={activeView} />
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Enhanced Footer */}
          <AppFooter />
        </div>
      </div>

      {/* Global Toast Notifications */}
      {toast.show && (
        <div className="fixed bottom-8 right-8 z-50">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        commands={appCommands}
      />
    </div>
  );
}