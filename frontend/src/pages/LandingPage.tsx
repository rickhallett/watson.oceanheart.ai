import React from 'react';
import { SkewedBackground } from '@/components/SkewedBackground';
import { Spotlight } from '@/components/ui/spotlight-new';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards';
import { MonochromeButton } from '@/components/MonochromeButton';
import { CompactCard } from '@/components/CompactCard';
import { CommandPalette, useCommandPalette, defaultCommands } from '@/components/CommandPalette';
import { LogIn, Brain, Shield, Users, Star, ArrowRight } from 'lucide-react';
import { componentTheme } from '@/config/theme';

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
                <span className="text-zinc-500 font-normal text-3xl block mt-2">Clinical Documentation Platform</span>
              </h1>
              <p className="text-zinc-400 text-xl mb-8 max-w-2xl mx-auto text-center">
                Transform your clinical documentation workflow with AI-powered review and curation tools designed for healthcare professionals.
              </p>
              <div className="flex gap-4 justify-center">
                <MonochromeButton
                  variant="primary"
                  size="lg"
                  icon={<LogIn className="w-5 h-5" />}
                  onClick={() => {
                    localStorage.setItem('isAuthenticated', 'true');
                    window.location.href = '/app';
                  }}
                >
                  Get Started
                </MonochromeButton>
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



        {/* Testimonials Section */}
        <div className="py-20 relative">
          <div className="relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl md:text-5xl font-bold text-center text-zinc-50 mb-4">
                What Our Users Say
              </h2>
              <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-16">
                Join hundreds of clinicians who have transformed their documentation workflow
              </p>
            </div>

            <div className="rounded-md flex flex-col antialiased items-center justify-center relative overflow-hidden">
              <InfiniteMovingCards
                items={testimonials}
                direction="right"
                speed="slow"
              />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-50 text-center mb-4">
              Powerful Features
            </h2>
            <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-16">
              Advanced clinical documentation tools designed for healthcare professionals
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CompactCard
                title="AI-Powered Review"
                description="Intelligent analysis of clinical documentation with advanced LLM capabilities"
                icon={<Brain className="w-5 h-5" />}
                status="success"
              />
              <CompactCard
                title="Secure Workflows"
                description="HIPAA-compliant document processing with enterprise-grade security"
                icon={<Shield className="w-5 h-5" />}
                status="success"
              />
              <CompactCard
                title="Team Collaboration"
                description="Real-time collaborative review and approval workflows"
                icon={<Users className="w-5 h-5" />}
                status="success"
              />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="glass-card p-12">
              <h2 className="text-3xl md:text-5xl font-bold text-zinc-50 mb-8">
                Ready to Get Started?
              </h2>
              <p className="text-zinc-400 text-lg mb-12">
                Experience the power of AI-assisted clinical documentation
              </p>
              <div className="flex gap-4 justify-center">
                <MonochromeButton
                  variant="primary"
                  size="lg"
                  icon={<LogIn className="w-5 h-5" />}
                  onClick={() => {
                    // Set localStorage flag and redirect to app
                    localStorage.setItem('isAuthenticated', 'true');
                    window.location.href = '/app';
                  }}
                >
                  Sign In to Watson
                </MonochromeButton>
                <MonochromeButton
                  variant="ghost"
                  size="lg"
                  icon={<ArrowRight className="w-5 h-5" />}
                  onClick={() => window.location.href = '/demo'}
                >
                  View Demo
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
            action: () => {
              localStorage.setItem('isAuthenticated', 'true');
              window.location.href = '/app';
            }
          },
          {
            id: 'demo',
            title: 'View Demo',
            description: 'Explore monochrome components',
            icon: Star,
            shortcut: '⌘D',
            action: () => window.location.href = '/demo'
          }
        ]}
      />
    </div>
  );
}

