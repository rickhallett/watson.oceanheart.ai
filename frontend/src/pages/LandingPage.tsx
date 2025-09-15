import React from 'react';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { Spotlight } from '@/components/ui/spotlight';
import { SparklesCore } from '@/components/ui/sparkles';
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards';
import { Button } from '@/components/ui/moving-border';
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
    <div className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      <BackgroundBeams />

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="h-[40rem] w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
          <h1 className="md:text-7xl text-5xl lg:text-9xl font-bold text-center text-white relative z-20">
            Watson <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI</span>{" "}
            <span className="text-cyan-400 font-normal text-4xl">v1.0</span>
          </h1>
          <div className="w-[40rem] h-40 relative">
            {/* Gradients */}
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent h-[2px] w-3/4 blur-sm" />
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent h-px w-3/4" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent h-[5px] w-1/4 blur-sm" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent h-px w-1/4" />

            {/* Core component */}
            <SparklesCore
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={1200}
              className="w-full h-full"
              particleColor="#FFFFFF"
            />

            {/* Radial Gradient to prevent sharp edges */}
            <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]">

            </div>
          </div>
        </div>



        {/* Testimonials Section */}
        <div className="py-20 relative bg-black">
          <div className="absolute inset-0 bg-grid-white/[0.02]" />
          <div className="relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl md:text-5xl font-bold text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                What Our Users Say
              </h2>
              <p className="text-neutral-400 text-center max-w-2xl mx-auto mb-16">
                Join hundreds of clinicians who have transformed their documentation workflow
              </p>
            </div>

            <div className="rounded-md flex flex-col antialiased bg-black items-center justify-center relative overflow-hidden">
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
            <Button
              borderRadius="1.75rem"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-none px-12 py-4 text-lg transition-all"
              onClick={() => {
                // Set localStorage flag and redirect to app
                localStorage.setItem('isAuthenticated', 'true');
                window.location.href = '/app';
              }}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In to Watson
            </Button>
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

