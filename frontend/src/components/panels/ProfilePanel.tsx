import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, Shield, Edit, Settings } from 'lucide-react';
import { MonochromeButton } from '@/components/MonochromeButton';
import { SkewedBackground } from '@/components/SkewedBackground';
import { useAuthContext } from '@/contexts/AuthContext';

export function ProfilePanel() {
  const navigate = useNavigate();
  const { authState, logout } = useAuthContext();
  const { user } = authState;

  const handleSignOut = () => {
    logout();
  };

  // Get user initials from name or email
  const getInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Format role for display
  const formatRole = (role?: string) => {
    if (!role) return 'User';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="relative">
      {/* Background effect */}
      <SkewedBackground opacity={0.02} />
      
      <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h2 className="text-3xl font-bold text-zinc-50 mb-8">
          Profile
        </h2>
        
        {/* Profile Card */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-100 text-2xl font-bold">
              {getInitials()}
            </div>
            <div className="ml-6">
              <h3 className="text-xl font-semibold text-zinc-50">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </h3>
              <p className="text-zinc-400">{formatRole(user?.role)}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700">
                  Verified
                </span>
                <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700">
                  {formatRole(user?.role)}
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
              <span>{user?.email || 'Not available'}</span>
            </div>
            <div className="flex items-center text-zinc-300">
              <User className="w-5 h-5 mr-3 text-zinc-400" />
              <span>User ID: {user?.id?.slice(0, 12) || 'N/A'}</span>
            </div>
            <div className="flex items-center text-zinc-300">
              <Shield className="w-5 h-5 mr-3 text-zinc-400" />
              <span>Role: {formatRole(user?.role)}</span>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-50">
              Account Settings
            </h3>
            <Settings className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-zinc-400 mb-4">
            Manage your account settings and preferences in the Settings tab.
          </p>
          <MonochromeButton
            variant="primary"
            size="md"
            onClick={() => navigate('/app/settings')}
          >
            Go to Settings
          </MonochromeButton>
        </div>

        {/* Security Section */}
        <div className="glass-card p-6 border-l-2 border-l-red-500">
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
        </div>
      </div>
    </div>
  );
}