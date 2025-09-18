import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompactCard, CompactCardGrid } from '../components/CompactCard';
import { MonochromeButton } from '../components/MonochromeButton';
import { SkewedBackground } from '../components/SkewedBackground';
import { TabNav } from '../components/TabNav';
import { Toast } from '../components/Toast';
import { Breadcrumb } from '../components/Breadcrumb';
import { DragDropZone } from '../components/DragDropZone';
import { CommandPalette, useCommandPalette, defaultCommands } from '../components/CommandPalette';
import { Plus, BarChart3, FileText, Settings as SettingsIcon, Upload } from 'lucide-react';

// Sample icons
const AssessmentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface DashboardPageProps {
  userName?: string;
}

/**
 * DashboardPage Component
 * Main dashboard with bento grid layout using monochrome design
 */
export function DashboardPage({ userName = 'Dr. Smith' }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({ 
    show: false, message: '', type: 'info' 
  });
  const commandPalette = useCommandPalette();

  const tabs = [
    { id: 'overview', label: 'Overview', count: 24 },
    { id: 'analytics', label: 'Analytics', count: 8 },
    { id: 'reports', label: 'Reports', count: 3 },
    { id: 'settings', label: 'Settings' }
  ];

  const breadcrumbItems = [
    { label: 'Watson', href: '/', path: '/' },
    { label: 'Dashboard', path: '/dashboard' }
  ];

  const handleFileDrop = (files: File[]) => {
    setToast({
      show: true,
      message: `${files.length} file(s) uploaded successfully`,
      type: 'success'
    });
  };

  const dashboardCommands = [
    ...defaultCommands,
    {
      id: 'new-review',
      title: 'Start New Review',
      description: 'Begin reviewing a clinical document',
      icon: FileText,
      shortcut: '⌘N',
      action: () => {
        setToast({
          show: true,
          message: 'Starting new review...',
          type: 'info'
        });
      }
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Open analytics dashboard',
      icon: BarChart3,
      shortcut: '⌘A',
      action: () => setActiveTab('analytics')
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Open dashboard settings',
      icon: SettingsIcon,
      shortcut: '⌘,',
      action: () => setActiveTab('settings')
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Background effect */}
      <SkewedBackground opacity={0.02} />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-zinc-50">Watson</h1>
              <MonochromeButton 
                variant="ghost" 
                size="sm"
                onClick={() => commandPalette.open()}
              >
                Quick Actions ⌘K
              </MonochromeButton>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400">Welcome, {userName}</span>
              <MonochromeButton variant="icon" size="sm">
                <UserIcon />
              </MonochromeButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb and page title */}
        <div className="mb-8">
          <Breadcrumb items={breadcrumbItems} />
          <h2 className="text-2xl font-bold text-zinc-50 mb-2 mt-4">
            Clinical Review Dashboard
          </h2>
          <p className="text-sm text-zinc-400">
            Monitor and manage LLM output reviews
          </p>
        </div>

        {/* Tab navigation */}
        <div className="mb-8">
          <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Tab content with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {activeTab === 'overview' && <OverviewTab toast={toast} setToast={setToast} />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'reports' && <ReportsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </motion.div>
        </AnimatePresence>

        {/* Floating action button with drag drop */}
        <div className="fixed bottom-8 right-8 z-40">
          <DragDropZone
            onFileDrop={handleFileDrop}
            accept=".pdf,.doc,.docx,.txt"
            multiple
            className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-dashed border-zinc-600 hover:border-zinc-500 transition-all duration-200 flex items-center justify-center"
          >
            <Upload className="w-6 h-6 text-zinc-400" />
          </DragDropZone>
        </div>
      </main>
      
      {/* Toast Notifications */}
      {toast.show && (
        <div className="fixed bottom-8 left-8 z-50">
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
        commands={dashboardCommands}
      />
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ toast, setToast }: { 
  toast: { show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' };
  setToast: (toast: any) => void;
}) {
  return (
    <div>
      {/* Bento grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 auto-rows-auto">
          {/* Large feature card - 2x2 */}
          <div className="col-span-full md:col-span-2 md:row-span-2 glass-card p-6">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-zinc-800/30 rounded-md">
                <CheckIcon />
                <div className="flex-1">
                  <p className="text-sm text-zinc-100">Review completed</p>
                  <p className="text-xs text-zinc-500">Patient #1234 - 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-zinc-800/30 rounded-md">
                <DocumentIcon />
                <div className="flex-1">
                  <p className="text-sm text-zinc-100">New assessment submitted</p>
                  <p className="text-xs text-zinc-500">Patient #5678 - 4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-zinc-800/30 rounded-md">
                <CheckIcon />
                <div className="flex-1">
                  <p className="text-sm text-zinc-100">Review completed</p>
                  <p className="text-xs text-zinc-500">Patient #9012 - 6 hours ago</p>
                </div>
              </div>
            </div>
            <MonochromeButton variant="ghost" size="sm" className="mt-4">
              View all activity
            </MonochromeButton>
          </div>

          {/* Compact stat cards - 1x1 each */}
          <CompactCard
            title="Pending Reviews"
            description="Awaiting clinical review"
            icon={<DocumentIcon />}
            metric={12}
            status="warning"
            onClick={() => {
              setToast({
                show: true,
                message: 'Loading pending reviews...',
                type: 'info'
              });
            }}
          />

          <CompactCard
            title="Completed Today"
            description="Reviews finished"
            icon={<CheckIcon />}
            metric={8}
            trend="up"
            status="success"
            onClick={() => console.log('View completed')}
          />

          <CompactCard
            title="Active Sessions"
            description="Currently reviewing"
            icon={<UserIcon />}
            metric={3}
            onClick={() => console.log('View sessions')}
          />

          <CompactCard
            title="Accuracy Rate"
            description="30-day average"
            icon={<AssessmentIcon />}
            metric="94.2%"
            trend="up"
            onClick={() => console.log('View analytics')}
          />

          {/* Wide activity card - 3x1 */}
          <div className="col-span-full md:col-span-3 glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-100">
                Review Queue
              </h3>
              <MonochromeButton variant="ghost" size="sm">
                View all
              </MonochromeButton>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm text-zinc-100">Patient Assessment #{1000 + i}</p>
                    <p className="text-xs text-zinc-500">Submitted 30 mins ago</p>
                  </div>
                  <MonochromeButton variant="primary" size="sm">
                    Review
                  </MonochromeButton>
                </div>
              ))}
            </div>
          </div>

          {/* Side stats card - 1x1 */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <MonochromeButton variant="ghost" size="sm" fullWidth>
                Start Review
              </MonochromeButton>
              <MonochromeButton variant="ghost" size="sm" fullWidth>
                Export Data
              </MonochromeButton>
              <MonochromeButton variant="ghost" size="sm" fullWidth>
                View Reports
              </MonochromeButton>
            </div>
          </div>

          {/* Full width chart placeholder - 4x1 */}
          <div className="col-span-full glass-card p-6">
            <h3 className="text-base font-semibold text-zinc-100 mb-4">
              Review Performance (Last 7 Days)
            </h3>
            <div className="h-48 bg-zinc-800/30 rounded-md flex items-center justify-center">
              <p className="text-sm text-zinc-500">Chart visualization placeholder</p>
            </div>
          </div>
      </div>

      {/* Additional sections */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">
          Recent Assessments
        </h3>
        <CompactCardGrid columns={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CompactCard
              key={i}
              title={`Assessment #${2000 + i}`}
              description="Clinical notes review required"
              icon={<DocumentIcon />}
              onClick={() => {
                setToast({
                  show: true,
                  message: `Opening assessment #${2000 + i}...`,
                  type: 'info'
                });
              }}
            />
          ))}
        </CompactCardGrid>
      </div>
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-100">Analytics Dashboard</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CompactCard
          title="Total Reviews"
          description="This month"
          icon={<BarChart3 className="w-4 h-4" />}
          metric={156}
          trend="up"
          status="success"
        />
        <CompactCard
          title="Avg. Time"
          description="Per review"
          icon={<BarChart3 className="w-4 h-4" />}
          metric="12.5m"
          trend="down"
          status="success"
        />
        <CompactCard
          title="Accuracy Rate"
          description="30-day average"
          icon={<BarChart3 className="w-4 h-4" />}
          metric="94.2%"
          trend="up"
          status="success"
        />
        <CompactCard
          title="Quality Score"
          description="Review quality"
          icon={<BarChart3 className="w-4 h-4" />}
          metric={8.7}
          trend="up"
          status="success"
        />
      </div>
      <div className="glass-card p-6">
        <h4 className="text-base font-semibold text-zinc-100 mb-4">Performance Trends</h4>
        <div className="h-64 bg-zinc-800/30 rounded-md flex items-center justify-center">
          <p className="text-sm text-zinc-500">Advanced analytics chart placeholder</p>
        </div>
      </div>
    </div>
  );
}

// Reports Tab Component
function ReportsTab() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-100">Reports & Exports</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h4 className="text-base font-semibold text-zinc-100 mb-4">Quick Reports</h4>
          <div className="space-y-3">
            <MonochromeButton variant="ghost" fullWidth>
              Daily Summary Report
            </MonochromeButton>
            <MonochromeButton variant="ghost" fullWidth>
              Weekly Performance Report
            </MonochromeButton>
            <MonochromeButton variant="ghost" fullWidth>
              Monthly Analytics Report
            </MonochromeButton>
          </div>
        </div>
        <div className="glass-card p-6">
          <h4 className="text-base font-semibold text-zinc-100 mb-4">Export Data</h4>
          <div className="space-y-3">
            <MonochromeButton variant="ghost" fullWidth>
              Export as CSV
            </MonochromeButton>
            <MonochromeButton variant="ghost" fullWidth>
              Export as JSON
            </MonochromeButton>
            <MonochromeButton variant="ghost" fullWidth>
              Export as PDF
            </MonochromeButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-100">Dashboard Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h4 className="text-base font-semibold text-zinc-100 mb-4">Display Preferences</h4>
          <div className="space-y-4">
            <label className="flex items-center">
              <input type="checkbox" className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded" defaultChecked />
              <span className="ml-2 text-sm text-zinc-300">Show activity notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded" defaultChecked />
              <span className="ml-2 text-sm text-zinc-300">Auto-refresh dashboard</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded" />
              <span className="ml-2 text-sm text-zinc-300">Compact view mode</span>
            </label>
          </div>
        </div>
        <div className="glass-card p-6">
          <h4 className="text-base font-semibold text-zinc-100 mb-4">Notification Settings</h4>
          <div className="space-y-4">
            <label className="flex items-center">
              <input type="checkbox" className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded" defaultChecked />
              <span className="ml-2 text-sm text-zinc-300">Email notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded" defaultChecked />
              <span className="ml-2 text-sm text-zinc-300">Desktop notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded" />
              <span className="ml-2 text-sm text-zinc-300">Mobile push notifications</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}