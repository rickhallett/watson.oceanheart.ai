import React, { useState } from 'react';
import { Bell, Moon, Globe, Shield, Save, Check, Database, Trash2 } from 'lucide-react';
import { MonochromeButton } from '@/components/MonochromeButton';
import { SkewedBackground } from '@/components/SkewedBackground';

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

  return (
    <div className="relative">
      {/* Background effect */}
      <SkewedBackground opacity={0.02} />
      
      <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h2 className="text-3xl font-bold text-zinc-50 mb-8">
          Settings
        </h2>
        
        {/* Preferences */}
        <div className="glass-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-zinc-50 mb-6">
            Preferences
          </h3>
          
          <div className="space-y-6">
            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="w-5 h-5 mr-3 text-zinc-400" />
                <div>
                  <p className="text-zinc-100">Email Notifications</p>
                  <p className="text-sm text-zinc-400">Receive email updates about your activity</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? 'bg-zinc-700' : 'bg-zinc-800'
                }`}
              >
                <span className="sr-only">Enable notifications</span>
                <span
                  className={`inline-block h-4 w-4 rounded-full shadow-lg transition-all ${
                    notifications ? 'bg-zinc-300 translate-x-6' : 'bg-zinc-500 translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Moon className="w-5 h-5 mr-3 text-zinc-400" />
                <div>
                  <p className="text-zinc-100">Dark Mode</p>
                  <p className="text-sm text-zinc-400">Use dark theme across the application</p>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-zinc-700' : 'bg-zinc-800'
                }`}
              >
                <span className="sr-only">Enable dark mode</span>
                <span
                  className={`inline-block h-4 w-4 rounded-full shadow-lg transition-all ${
                    darkMode ? 'bg-zinc-300 translate-x-6' : 'bg-zinc-500 translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Globe className="w-5 h-5 mr-3 text-zinc-400" />
                <div>
                  <p className="text-zinc-100">Language</p>
                  <p className="text-sm text-zinc-400">Choose your preferred language</p>
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-3 py-1 focus:outline-none focus:border-zinc-600 transition-colors"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-zinc-50 mb-6">
            Security
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-3 text-zinc-400" />
                <div>
                  <p className="text-zinc-100">Two-Factor Authentication</p>
                  <p className="text-sm text-zinc-400">Add an extra layer of security to your account</p>
                </div>
              </div>
              <button
                onClick={() => setTwoFactor(!twoFactor)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  twoFactor ? 'bg-zinc-700' : 'bg-zinc-800'
                }`}
              >
                <span className="sr-only">Enable two-factor authentication</span>
                <span
                  className={`inline-block h-4 w-4 rounded-full shadow-lg transition-all ${
                    twoFactor ? 'bg-zinc-300 translate-x-6' : 'bg-zinc-500 translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="glass-card p-6 mb-8">
          <h3 className="text-lg font-semibold text-zinc-50 mb-4">
            Data & Privacy
          </h3>
          <p className="text-zinc-400 mb-6">
            Your data is encrypted and stored securely. We never share your personal information with third parties.
          </p>
          <div className="flex gap-3">
            <MonochromeButton 
              variant="primary" 
              size="md"
              icon={<Database className="w-4 h-4" />}
            >
              Download My Data
            </MonochromeButton>
            <MonochromeButton 
              variant="ghost" 
              size="md"
              icon={<Trash2 className="w-4 h-4" />}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
            >
              Delete Account
            </MonochromeButton>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          {saved ? (
            <div className="flex items-center gap-2 px-6 py-3 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md">
              <Check className="w-5 h-5" />
              <span>Settings Saved!</span>
            </div>
          ) : (
            <MonochromeButton
              onClick={handleSaveSettings}
              variant="primary"
              size="md"
              icon={<Save className="w-4 h-4" />}
            >
              Save Settings
            </MonochromeButton>
          )}
        </div>
      </div>
    </div>
  );
}