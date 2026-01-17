import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SkewedBackground } from '@/components/SkewedBackground';
import { Spotlight } from '@/components/ui/spotlight-new';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards';
import { MonochromeButton } from '@/components/MonochromeButton';
import { CompactCard } from '@/components/CompactCard';
import { CommandPalette, useCommandPalette, defaultCommands } from '@/components/CommandPalette';
import { LogIn, Brain, Shield, Users, Star, ArrowRight, Play } from 'lucide-react';
import { componentTheme } from '@/config/theme';
import { redirectToLogin } from '@/config/auth';
import { isClerkConfigured } from '@/config/clerk';
import { useAuthContext } from '@/contexts/AuthContext';
import { generateDemoToken, isDemoMode } from '@/utils/demo-auth';
import { storeToken } from '@/utils/auth';

const testimonials = [
  {
    quote:
      "This platform has completely transformed how we approach product development. The tools are intuitive and powerful.",
    name: "Sarah Chen",
    title: "CTO at TechStart",
  },
  {
    quote:
      "I've never seen such a perfect blend of functionality and aesthetics. It's a game-changer for our team.",
    name: "Michael Rodriguez",
    title: "Product Manager at InnovateCo",
  },
  {
    quote:
      "The attention to detail and the quality of the components is outstanding. Highly recommend!",
    name: "Emily Watson",
    title: "Lead Designer at CreativeHub",
  },
  {
    quote:
      "From concept to deployment, everything just works seamlessly. This is the future of web development.",
    name: "David Kim",
    title: "Founder of NextGen Solutions",
  },
  {
    quote:
      "The performance improvements we've seen are incredible. Our users love the new experience.",
    name: "Lisa Thompson",
    title: "Engineering Director at ScaleUp",
  },
];

export function LandingPage() {
  const commandPalette = useCommandPalette();
  const navigate = useNavigate();
  const { authState } = useAuthContext();

  // If already authenticated, redirect to app
  React.useEffect(() => {
    if (authState.isAuthenticated) {
      navigate('/app');
    }
  }, [authState.isAuthenticated, navigate]);

  const handleLogin = () => {
    // Use Clerk sign-in if configured, otherwise use Passport
    if (isClerkConfigured()) {
      navigate('/sign-in');
    } else {
      redirectToLogin();
    }
  };

  const handleDemoLogin = async () => {
    try {
      const token = await generateDemoToken();
      storeToken(token);
      // Force a page reload to pick up the new auth state
      window.location.href = '/app';
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 antialiased relative overflow-hidden">
      <SkewedBackground opacity={0.03} />

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="h-[40rem] w-full rounded-md flex md:items-center md:justify-center bg-zinc-950/95 antialiased bg-grid-white/[0.02] relative overflow-hidden">
          <Spotlight />
          <div className="p-4 max-w-4xl mx-auto relative z-10 w-full">
            <BackgroundGradient className="rounded-[22px] p-12 bg-zinc-900">
              <h1 className="md:text-7xl text-5xl lg:text-8xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-zinc-50 to-zinc-400 bg-opacity-50 mb-6">
                <span className="text-blue-400">Watson</span> <span className="text-zinc-400">AI</span>{" "}
                <span className="text-zinc-500 font-normal text-3xl block mt-2">Clinical LLM Response Research Tool</span>
              </h1>
              <p className="text-zinc-400 text-xl mb-8 max-w-2xl mx-auto text-center">
                Collect and analyze differences between LLM responses and clinical evaluations to build research datasets for improving AI in healthcare.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <MonochromeButton
                  variant="primary"
                  size="lg"
                  icon={<LogIn className="w-5 h-5" />}
                  onClick={handleLogin}
                >
                  Get Started
                </MonochromeButton>
                {isDemoMode() && (
                  <MonochromeButton
                    variant="secondary"
                    size="lg"
                    icon={<Play className="w-5 h-5" />}
                    onClick={handleDemoLogin}
                  >
                    Demo Login
                  </MonochromeButton>
                )}
                <MonochromeButton
                  variant="ghost"
                  size="lg"
                  onClick={() => commandPalette.open()}
                >
                  Explore Features ⌘K
                </MonochromeButton>
              </div>
            </BackgroundGradient>
          </div>
        </div>




        {/* Features Section */}
        <div className="py-20 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-50 text-center mb-4">
              Research Features
            </h2>
            <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-16">
              Purpose-built tools for collecting clinician feedback on LLM responses
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CompactCard
                title="LLM Response Review"
                description="Review and evaluate AI-generated clinical responses with TipTap editor"
                icon={<Brain className="w-5 h-5" />}
                status="success"
              />
              <CompactCard
                title="Diff Analysis"
                description="Track changes between original LLM output and clinician edits"
                icon={<Shield className="w-5 h-5" />}
                status="success"
              />
              <CompactCard
                title="Dataset Export"
                description="Export analyzed data for AI pattern research (Coming Soon)"
                icon={<Users className="w-5 h-5" />}
                status="info"
              />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="glass-card p-12">
              <h2 className="text-3xl md:text-5xl font-bold text-zinc-50 mb-8">
                Ready to Contribute?
              </h2>
              <p className="text-zinc-400 text-lg mb-12">
                Join our research effort to improve AI clinical response quality
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <MonochromeButton
                  variant="primary"
                  size="lg"
                  icon={<LogIn className="w-5 h-5" />}
                  onClick={handleLogin}
                >
                  Start Research Session
                </MonochromeButton>
                {isDemoMode() && (
                  <MonochromeButton
                    variant="secondary"
                    size="lg"
                    icon={<Play className="w-5 h-5" />}
                    onClick={handleDemoLogin}
                  >
                    Try Demo
                  </MonochromeButton>
                )}
                <MonochromeButton
                  variant="ghost"
                  size="lg"
                  icon={<ArrowRight className="w-5 h-5" />}
                  onClick={() => navigate('/demo')}
                >
                  View Components
                </MonochromeButton>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-zinc-800 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-zinc-400">
                  © 2025 Watson AI. All rights reserved.
                </p>
              </div>
              <div className="flex space-x-6">
                <a href="#" className="text-zinc-400 hover:text-zinc-300 transition">
                  Privacy
                </a>
                <a href="#" className="text-zinc-400 hover:text-zinc-300 transition">
                  Terms
                </a>
                <a href="#" className="text-zinc-400 hover:text-zinc-300 transition">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        commands={[
          ...defaultCommands,
          {
            id: 'sign-in',
            title: 'Sign In',
            description: 'Access your Watson account',
            icon: LogIn,
            shortcut: '⌘L',
            action: handleLogin
          },
          {
            id: 'demo',
            title: 'View Demo',
            description: 'Explore monochrome components',
            icon: Star,
            shortcut: '⌘D',
            action: () => navigate('/demo')
          }
        ]}
      />
    </div>
  );
}

