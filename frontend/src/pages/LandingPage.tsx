import React from 'react';
import { SkewedBackground } from '@/components/SkewedBackground';
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards';
import { MonochromeButton } from '@/components/MonochromeButton';
import { CompactCard } from '@/components/CompactCard';
import { LogIn } from 'lucide-react';
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
  return (
    <div className="min-h-screen bg-zinc-950 antialiased relative overflow-hidden">
      <SkewedBackground opacity={0.03} />

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="h-[40rem] w-full flex flex-col items-center justify-center overflow-hidden rounded-md">
          <h1 className="md:text-7xl text-5xl lg:text-9xl font-bold text-center text-zinc-50 relative z-20">
            Watson <span className="text-zinc-400">AI</span>{" "}
            <span className="text-zinc-500 font-normal text-4xl">v1.0</span>
          </h1>
          <div className="w-[40rem] h-40 relative">
            {/* Subtle monochrome gradients */}
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-zinc-600 to-transparent h-[2px] w-3/4 blur-sm opacity-30" />
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-zinc-500 to-transparent h-px w-3/4" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-zinc-400 to-transparent h-[5px] w-1/4 blur-sm opacity-20" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-zinc-400 to-transparent h-px w-1/4" />

            {/* Simple gradient overlay */}
            <div className="absolute inset-0 w-full h-full bg-zinc-950 [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]" />
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

        {/* CTA Section */}
        <div className="py-20 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-8">
              Ready to Get Started?
            </h2>
            <p className="text-neutral-400 text-lg mb-12">
              Experience the power of AI-assisted clinical documentation
            </p>
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
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-neutral-800 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-neutral-400">
                  © 2024 Watson AI. All rights reserved.
                </p>
              </div>
              <div className="flex space-x-6">
                <a href="#" className="text-neutral-400 hover:text-white transition">
                  Privacy
                </a>
                <a href="#" className="text-neutral-400 hover:text-white transition">
                  Terms
                </a>
                <a href="#" className="text-neutral-400 hover:text-white transition">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

