import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Moon, Globe, Shield, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { componentTheme } from '@/config/theme';

export function SettingsPanel() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('en');
  const [twoFactor, setTwoFactor] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveSettings = () => {
    // Save settings logic would go here
    console.log('Settings saved:', { notifications, darkMode, language, twoFactor });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
        Settings
      </motion.h2>
      
      {/* Preferences */}
      <motion.div 
        className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 backdrop-blur rounded-lg p-6 mb-6 border border-blue-500/20"
        variants={itemVariants}
        whileHover={{ scale: 1.01 }}
      >
        <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6">
          Preferences
        </h3>
        
        <div className="space-y-6">
          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="w-5 h-5 mr-3 text-blue-400" />
              <div>
                <p className="text-white">Email Notifications</p>
                <p className="text-sm text-neutral-400">Receive email updates about your activity</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-neutral-600'
              }`}
            >
              <span className="sr-only">Enable notifications</span>
              <motion.span
                layout
                className="inline-block h-4 w-4 rounded-full bg-white shadow-lg"
                animate={{ x: notifications ? 24 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Moon className="w-5 h-5 mr-3 text-cyan-400" />
              <div>
                <p className="text-white">Dark Mode</p>
                <p className="text-sm text-neutral-400">Use dark theme across the application</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-neutral-600'
              }`}
            >
              <span className="sr-only">Enable dark mode</span>
              <motion.span
                layout
                className="inline-block h-4 w-4 rounded-full bg-white shadow-lg"
                animate={{ x: darkMode ? 24 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="w-5 h-5 mr-3 text-green-400" />
              <div>
                <p className="text-white">Language</p>
                <p className="text-sm text-neutral-400">Choose your preferred language</p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-neutral-900/50 text-white border border-blue-500/30 rounded px-3 py-1 focus:outline-none focus:border-blue-400 transition-colors"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Security */}
      <motion.div 
        className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 backdrop-blur rounded-lg p-6 mb-6 border border-cyan-500/20"
        variants={itemVariants}
        whileHover={{ scale: 1.01 }}
      >
        <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">
          Security
        </h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-5 h-5 mr-3 text-cyan-400" />
              <div>
                <p className="text-white">Two-Factor Authentication</p>
                <p className="text-sm text-neutral-400">Add an extra layer of security to your account</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setTwoFactor(!twoFactor)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                twoFactor ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-neutral-600'
              }`}
            >
              <span className="sr-only">Enable two-factor authentication</span>
              <motion.span
                layout
                className="inline-block h-4 w-4 rounded-full bg-white shadow-lg"
                animate={{ x: twoFactor ? 24 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Data & Privacy */}
      <motion.div 
        className="bg-gradient-to-br from-green-900/20 to-green-800/20 backdrop-blur rounded-lg p-6 mb-8 border border-green-500/20"
        variants={itemVariants}
        whileHover={{ scale: 1.01 }}
      >
        <h3 className="text-lg font-semibold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          Data & Privacy
        </h3>
        <p className="text-neutral-400 mb-4">
          Your data is encrypted and stored securely. We never share your personal information with third parties.
        </p>
        <div className="flex gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0">
              Download My Data
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-700 hover:to-red-800 text-white border-0">
              Delete Account
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div 
        className="flex justify-end"
        variants={itemVariants}
      >
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg"
            >
              <Check className="w-5 h-5" />
              <span>Settings Saved!</span>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveSettings}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}