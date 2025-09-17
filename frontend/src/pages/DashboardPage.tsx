import React from 'react';
import { CompactCard, CompactCardGrid } from '../components/CompactCard';
import { MonochromeButton } from '../components/MonochromeButton';
import { SkewedBackground } from '../components/SkewedBackground';

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
              <nav className="hidden md:flex items-center gap-6">
                <a href="#" className="text-sm text-zinc-100 hover:text-zinc-300 transition-colors">
                  Dashboard
                </a>
                <a href="#" className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors">
                  Reviews
                </a>
                <a href="#" className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors">
                  Analytics
                </a>
                <a href="#" className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors">
                  Settings
                </a>
              </nav>
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
        {/* Page title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-50 mb-2">
            Clinical Review Dashboard
          </h2>
          <p className="text-sm text-zinc-400">
            Monitor and manage LLM output reviews
          </p>
        </div>

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
            onClick={() => console.log('View pending')}
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
                onClick={() => console.log(`View assessment ${i}`)}
              />
            ))}
          </CompactCardGrid>
        </div>
      </main>
    </div>
  );
}