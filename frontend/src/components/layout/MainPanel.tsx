import React from 'react';
import { ProfilePanel } from '@/components/panels/ProfilePanel';
import { SettingsPanel } from '@/components/panels/SettingsPanel';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Activity, Brain } from 'lucide-react';
import { componentTheme } from '@/config/theme';

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
    type: "tween",
    ease: "anticipate",
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
            className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"
          >
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Watson Clinical Dashboard
              </h1>
              <p className="text-neutral-400">AI-Powered Clinical Documentation Review</p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 backdrop-blur rounded-lg p-6 border border-blue-500/20"
              >
                <div className="flex items-center mb-3">
                  <FileText className="w-5 h-5 text-blue-400 mr-2" />
                  <h3 className="text-sm font-medium text-blue-400">Documents Reviewed</h3>
                </div>
                <p className="text-2xl font-bold text-white">127</p>
                <p className="text-xs text-neutral-400 mt-1">+23 this week</p>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 backdrop-blur rounded-lg p-6 border border-cyan-500/20"
              >
                <div className="flex items-center mb-3">
                  <Activity className="w-5 h-5 text-cyan-400 mr-2" />
                  <h3 className="text-sm font-medium text-cyan-400">Accuracy Rate</h3>
                </div>
                <p className="text-2xl font-bold text-white">94.2%</p>
                <p className="text-xs text-neutral-400 mt-1">+2.1% improvement</p>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-green-900/20 to-green-800/20 backdrop-blur rounded-lg p-6 border border-green-500/20"
              >
                <div className="flex items-center mb-3">
                  <Brain className="w-5 h-5 text-green-400 mr-2" />
                  <h3 className="text-sm font-medium text-green-400">AI Insights</h3>
                </div>
                <p className="text-2xl font-bold text-white">48</p>
                <p className="text-xs text-neutral-400 mt-1">New patterns detected</p>
              </motion.div>
            </div>

            {/* Welcome Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-neutral-900/50 to-neutral-800/50 backdrop-blur rounded-lg p-6 mb-8 border border-neutral-700/50"
            >
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent mb-4">
                Welcome to Watson AI
              </h2>
              <p className="text-neutral-400 mb-6">
                Clinical LLM Output Review & Curation Tool - Transform your clinical documentation workflow with AI-powered insights.
              </p>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <span className="text-blue-400 text-sm">Real-time Analysis</span>
                </div>
                <div className="px-4 py-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <span className="text-cyan-400 text-sm">HIPAA Compliant</span>
                </div>
                <div className="px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                  <span className="text-green-400 text-sm">Evidence-Based</span>
                </div>
              </div>
            </motion.div>
            
            {/* Editor Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-neutral-900/50 to-neutral-800/50 backdrop-blur rounded-lg p-6 border border-neutral-700/50"
            >
              <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                Clinical Note Editor
              </h3>
              <div className="w-full max-w-full overflow-hidden">
                <div className="[&_.tiptap]:max-w-full [&_.tiptap]:mx-auto">
                  <SimpleEditor />
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gradient-to-br from-black via-neutral-950 to-black">
      <div className="min-h-full">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </main>
  );
}