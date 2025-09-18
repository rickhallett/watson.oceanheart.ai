import React from 'react';
import { User, Mail, Calendar, LogOut, Shield, Award, Activity, Edit, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { CompactCard, CompactCardGrid } from '@/components/CompactCard';
import { MonochromeButton } from '@/components/MonochromeButton';
import { SkewedBackground } from '@/components/SkewedBackground';

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
      className="relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background effect */}
      <SkewedBackground opacity={0.02} />
      
      <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <motion.h2 
          className="text-3xl font-bold text-zinc-50 mb-8"
          variants={itemVariants}
        >
          Profile
        </motion.h2>
        
        {/* Profile Card */}
        <motion.div 
          className="glass-card p-6 mb-6"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center mb-6">
            <motion.div 
              className="w-20 h-20 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-100 text-2xl font-bold"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              JD
            </motion.div>
            <div className="ml-6">
              <h3 className="text-xl font-semibold text-zinc-50">Dr. John Doe</h3>
              <p className="text-zinc-400">Senior Clinician</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700">
                  Verified
                </span>
                <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700">
                  Pro User
                </span>
              </div>
            </div>
            <div className="ml-auto">
              <MonochromeButton variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />}>
                Edit Profile
              </MonochromeButton>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center text-zinc-300">
              <Mail className="w-5 h-5 mr-3 text-zinc-400" />
              <span>john.doe@example.com</span>
            </div>
            <div className="flex items-center text-zinc-300">
              <User className="w-5 h-5 mr-3 text-zinc-400" />
              <span>User ID: usr_123456789</span>
            </div>
            <div className="flex items-center text-zinc-300">
              <Calendar className="w-5 h-5 mr-3 text-zinc-400" />
              <span>Member since: January 2024</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid using CompactCard */}
        <motion.div 
          className="mb-6"
          variants={itemVariants}
        >
          <CompactCardGrid columns={3}>
            <CompactCard
              title="Documents Reviewed"
              metric="892"
              description="All time total"
              icon={<Activity className="w-5 h-5" />}
              status="success"
              trend="up"
            />
            <CompactCard
              title="Accuracy Score"
              metric="98.4%"
              description="Quality rating"
              icon={<Award className="w-5 h-5" />}
              status="success"
              trend="up"
            />
            <CompactCard
              title="Security Level"
              metric="Level 5"
              description="Clearance status"
              icon={<Shield className="w-5 h-5" />}
              status="success"
            />
          </CompactCardGrid>
        </motion.div>

        {/* Account Settings */}
        <motion.div 
          className="glass-card p-6 mb-6"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-50">
              Account Settings
            </h3>
            <Settings className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-zinc-400 mb-4">
            Manage your account settings and preferences in the Settings tab.
          </p>
          <MonochromeButton variant="primary" size="md">
            Go to Settings
          </MonochromeButton>
        </motion.div>

        {/* Security Section */}
        <motion.div 
          className="glass-card p-6 border-l-2 border-l-red-500"
          variants={itemVariants}
        >
          <h3 className="text-lg font-semibold text-zinc-50 mb-4">Security</h3>
          <p className="text-zinc-400 mb-6">
            Your session is managed through secure authentication. Sign out to end your current session.
          </p>
          <MonochromeButton
            onClick={handleSignOut}
            variant="ghost"
            size="md"
            icon={<LogOut className="w-4 h-4" />}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
          >
            Sign Out
          </MonochromeButton>
        </motion.div>
      </div>
    </motion.div>
  );
}