import React from 'react';
import { getAuthConfig } from '@/config/auth';
import { Button } from '@/components/ui/moving-border';
import { LogIn } from 'lucide-react';

interface LoginButtonProps {
  className?: string;
  variant?: 'default' | 'border';
}

export function LoginButton({ className = '', variant = 'default' }: LoginButtonProps) {
  const handleLogin = () => {
    const { authUrl, returnTo } = getAuthConfig();
    window.location.href = `${authUrl}?returnTo=${encodeURIComponent(returnTo)}`;
  };

  if (variant === 'border') {
    return (
      <Button
        onClick={handleLogin}
        borderRadius="1.75rem"
        className={`bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none px-8 py-3 ${className}`}
      >
        <LogIn className="w-4 h-4 mr-2" />
        Sign In with Oceanheart
      </Button>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className={`bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg transition flex items-center ${className}`}
    >
      <LogIn className="w-4 h-4 mr-2" />
      Sign In
    </button>
  );
}