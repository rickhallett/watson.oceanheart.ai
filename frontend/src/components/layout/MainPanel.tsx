import React from 'react';
import { ProfilePanel } from '@/components/panels/ProfilePanel';
import { SettingsPanel } from '@/components/panels/SettingsPanel';
import { ReviewsPanel } from '@/components/panels/ReviewsPanel';
import { AnalyticsPanel } from '@/components/panels/AnalyticsPanel';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Brain, Users } from 'lucide-react';
import { SkewedBackground } from '@/components/SkewedBackground';

interface MainPanelProps {
  activeView: 'dashboard' | 'reviews' | 'analytics' | 'profile' | 'settings';
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
      case 'reviews':
        return (
          <motion.div
            key="reviews"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <ReviewsPanel />
          </motion.div>
        );
      case 'analytics':
        return (
          <motion.div
            key="analytics"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <AnalyticsPanel />
          </motion.div>
        );
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
                  Watson Research Dashboard
                </h1>
                <p className="text-zinc-400">LLM Response Analysis & Clinical Evaluation Tool</p>
              </div>

              {/* Welcome Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6 mb-8"
              >
                <h2 className="text-2xl font-semibold text-zinc-50 mb-4">
                  Clinical LLM Review Platform
                </h2>
                <p className="text-zinc-400 mb-6">
                  Review AI-generated clinical summaries, identify errors and omissions, apply classification labels, and build research datasets for improving LLM accuracy in mental health documentation.
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="px-3 py-1.5 bg-zinc-800 rounded-md border border-zinc-700">
                    <span className="text-zinc-300 text-sm">Diff Analysis</span>
                  </div>
                  <div className="px-3 py-1.5 bg-zinc-800 rounded-md border border-zinc-700">
                    <span className="text-zinc-300 text-sm">Classification Labels</span>
                  </div>
                  <div className="px-3 py-1.5 bg-zinc-800 rounded-md border border-zinc-700">
                    <span className="text-zinc-300 text-sm">Research Export</span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <a href="/app/reviews" className="glass-card p-6 hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                  <FileText className="w-8 h-8 text-blue-400 mb-3" />
                  <h3 className="text-lg font-semibold text-zinc-50 mb-2 group-hover:text-blue-400 transition-colors">
                    Review LLM Outputs
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    View and edit AI-generated clinical summaries
                  </p>
                </a>
                <a href="/app/analytics" className="glass-card p-6 hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                  <Brain className="w-8 h-8 text-purple-400 mb-3" />
                  <h3 className="text-lg font-semibold text-zinc-50 mb-2 group-hover:text-purple-400 transition-colors">
                    View Analytics
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Analyze patterns and export research data
                  </p>
                </a>
                <a href="/app/profile" className="glass-card p-6 hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                  <Users className="w-8 h-8 text-green-400 mb-3" />
                  <h3 className="text-lg font-semibold text-zinc-50 mb-2 group-hover:text-green-400 transition-colors">
                    Your Profile
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Manage your account and settings
                  </p>
                </a>
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