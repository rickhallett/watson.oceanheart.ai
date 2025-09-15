import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Mail, Calendar, LogOut, Shield, Award, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { componentTheme } from '@/config/theme';

export function ProfilePanel() {
  const handleSignOut = () => {
    // Clear localStorage auth flag (temporary for testing)
    localStorage.removeItem('isAuthenticated');
    // Redirect to landing page
    window.location.href = '/';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2 
        className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-8"
        variants={itemVariants}
      >
        Profile
      </motion.h2>
      
      <motion.div 
        className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 backdrop-blur rounded-lg p-6 mb-6 border border-blue-500/20"
        variants={itemVariants}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center mb-6">
          <motion.div 
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/25"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            JD
          </motion.div>
          <div className="ml-6">
            <h3 className="text-xl font-semibold text-white">Dr. John Doe</h3>
            <p className="text-blue-400">Senior Clinician</p>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-300 border border-blue-500/30">
                Verified
              </span>
              <span className="px-2 py-1 bg-cyan-500/20 rounded text-xs text-cyan-300 border border-cyan-500/30">
                Pro User
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center text-neutral-300">
            <Mail className="w-5 h-5 mr-3 text-blue-400" />
            <span>john.doe@example.com</span>
          </div>
          <div className="flex items-center text-neutral-300">
            <User className="w-5 h-5 mr-3 text-cyan-400" />
            <span>User ID: usr_123456789</span>
          </div>
          <div className="flex items-center text-neutral-300">
            <Calendar className="w-5 h-5 mr-3 text-green-400" />
            <span>Member since: January 2024</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        variants={itemVariants}
      >
        <motion.div 
          className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 backdrop-blur rounded-lg p-4 border border-blue-500/20"
          whileHover={{ scale: 1.05 }}
        >
          <Activity className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">892</p>
          <p className="text-xs text-blue-400">Documents Reviewed</p>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 backdrop-blur rounded-lg p-4 border border-cyan-500/20"
          whileHover={{ scale: 1.05 }}
        >
          <Award className="w-5 h-5 text-cyan-400 mb-2" />
          <p className="text-2xl font-bold text-white">98.4%</p>
          <p className="text-xs text-cyan-400">Accuracy Score</p>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-green-900/20 to-green-800/20 backdrop-blur rounded-lg p-4 border border-green-500/20"
          whileHover={{ scale: 1.05 }}
        >
          <Shield className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-white">Level 5</p>
          <p className="text-xs text-green-400">Security Clearance</p>
        </motion.div>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-br from-neutral-900/50 to-neutral-800/50 backdrop-blur rounded-lg p-6 mb-6 border border-neutral-700/50"
        variants={itemVariants}
      >
        <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent mb-4">
          Account Settings
        </h3>
        <p className="text-neutral-400 mb-4">
          Manage your account settings and preferences in the Settings tab.
        </p>
        <Button
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0"
        >
          Go to Settings
        </Button>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-br from-red-900/10 to-red-800/10 backdrop-blur rounded-lg p-6 border border-red-500/20"
        variants={itemVariants}
      >
        <h3 className="text-lg font-semibold text-red-400 mb-4">Security</h3>
        <p className="text-neutral-400 mb-6">
          Your session is managed through secure authentication.
        </p>
        <Button
          onClick={handleSignOut}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </motion.div>
    </motion.div>
  );
}