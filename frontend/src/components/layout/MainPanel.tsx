import React from 'react';
import { ProfilePanel } from '@/components/panels/ProfilePanel';
import { SettingsPanel } from '@/components/panels/SettingsPanel';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Activity, Brain, TrendingUp, Users, Clock } from 'lucide-react';
import { CompactCard, CompactCardGrid } from '@/components/CompactCard';
import { MonochromeButton } from '@/components/MonochromeButton';
import { SkewedBackground } from '@/components/SkewedBackground';

interface MainPanelProps {
  activeView: 'dashboard' | 'profile' | 'settings';
}

export function MainPanel({ activeView }: MainPanelProps) {
  const pageVariants = {
    initial: { opacity: 0, x: -20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: 20 }
  };

  const pageTransition = {
    type: "tween" as const,
    ease: "anticipate" as const,
    duration: 0.4
  };

  const renderContent = () => {
    switch (activeView) {
      case 'profile':
        return (
          <motion.div
            key="profile"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <ProfilePanel />
          </motion.div>
        );
      case 'settings':
        return (
          <motion.div
            key="settings"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <SettingsPanel />
          </motion.div>
        );
      case 'dashboard':
      default:
        return (
          <motion.div
            key="dashboard"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="relative"
          >
            {/* Background effect */}
            <SkewedBackground opacity={0.02} />
            
            <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-zinc-50 mb-2">
                  Watson Clinical Dashboard
                </h1>
                <p className="text-zinc-400">AI-Powered Clinical Documentation Review</p>
              </div>
              
              {/* Stats Grid using CompactCard */}
              <div className="mb-8">
                <CompactCardGrid columns={3}>
                  <CompactCard
                    title="Documents Reviewed"
                    metric="127"
                    description="+23 this week"
                    icon={<FileText className="w-5 h-5" />}
                    status="success"
                    trend="up"
                  />
                  <CompactCard
                    title="Accuracy Rate"
                    metric="94.2%"
                    description="+2.1% improvement"
                    icon={<Activity className="w-5 h-5" />}
                    status="success"
                    trend="up"
                  />
                  <CompactCard
                    title="AI Insights"
                    metric="48"
                    description="New patterns detected"
                    icon={<Brain className="w-5 h-5" />}
                    status="success"
                    trend="neutral"
                  />
                </CompactCardGrid>
              </div>

              {/* Additional Metrics Row */}
              <div className="mb-8">
                <CompactCardGrid columns={4}>
                  <CompactCard
                    title="Active Users"
                    metric="12"
                    description="Currently online"
                    icon={<Users className="w-4 h-4" />}
                    status="default"
                  />
                  <CompactCard
                    title="Avg. Review Time"
                    metric="4.2m"
                    description="Per document"
                    icon={<Clock className="w-4 h-4" />}
                    status="default"
                  />
                  <CompactCard
                    title="Weekly Trend"
                    metric="+18%"
                    description="Documents processed"
                    icon={<TrendingUp className="w-4 h-4" />}
                    status="success"
                    trend="up"
                  />
                  <CompactCard
                    title="System Status"
                    metric="Online"
                    description="All systems operational"
                    icon={<Activity className="w-4 h-4" />}
                    status="success"
                  />
                </CompactCardGrid>
              </div>

              {/* Welcome Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6 mb-8"
              >
                <h2 className="text-2xl font-semibold text-zinc-50 mb-4">
                  Welcome to Watson AI
                </h2>
                <p className="text-zinc-400 mb-6">
                  Clinical LLM Output Review & Curation Tool - Transform your clinical documentation workflow with AI-powered insights.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="px-3 py-1.5 bg-zinc-800 rounded-md border border-zinc-700">
                    <span className="text-zinc-300 text-sm">Real-time Analysis</span>
                  </div>
                  <div className="px-3 py-1.5 bg-zinc-800 rounded-md border border-zinc-700">
                    <span className="text-zinc-300 text-sm">HIPAA Compliant</span>
                  </div>
                  <div className="px-3 py-1.5 bg-zinc-800 rounded-md border border-zinc-700">
                    <span className="text-zinc-300 text-sm">Evidence-Based</span>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <MonochromeButton variant="primary" size="md">
                    Start New Review
                  </MonochromeButton>
                  <MonochromeButton variant="ghost" size="md">
                    View Reports
                  </MonochromeButton>
                </div>
              </motion.div>
              
              {/* Editor Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-zinc-50">
                    Clinical Note Editor
                  </h3>
                  <MonochromeButton variant="ghost" size="sm">
                    New Document
                  </MonochromeButton>
                </div>
                <div className="w-full max-w-full overflow-hidden">
                  <div className="[&_.tiptap]:max-w-full [&_.tiptap]:mx-auto [&_.tiptap]:bg-zinc-900 [&_.tiptap]:border [&_.tiptap]:border-zinc-800 [&_.tiptap]:rounded-md">
                    <SimpleEditor />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-zinc-950">
      <div className="min-h-full">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </main>
  );
}