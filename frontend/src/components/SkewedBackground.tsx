import React, { useEffect, useState } from 'react';

interface SkewedBackgroundProps {
  className?: string;
  parallaxSpeed?: number;
  opacity?: number;
}

/**
 * SkewedBackground Component
 * Creates a dynamic parallax background with skewed gradient effect
 * for the monochrome design system
 */
export function SkewedBackground({ 
  className = '',
  parallaxSpeed = 0.3,
  opacity = 0.05
}: SkewedBackgroundProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Use requestAnimationFrame for smooth animation
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };

    // Add passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Set initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Calculate parallax offset
  const parallaxOffset = scrollY * parallaxSpeed;

  return (
    <div 
      className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Gradient background with parallax */}
      <div 
        className="absolute -inset-[100%]"
        style={{ opacity }}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900"
          style={{
            transform: `translateY(${parallaxOffset}px) skewY(12deg) rotate(12deg)`,
            willChange: 'transform'
          }}
        />
      </div>

      {/* Additional subtle gradient layer */}
      <div 
        className="absolute inset-0"
        style={{ opacity: opacity * 0.5 }}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-tl from-zinc-800 via-transparent to-zinc-900"
          style={{
            transform: `translateY(${-parallaxOffset * 0.5}px) skewY(-6deg)`,
            willChange: 'transform'
          }}
        />
      </div>

      {/* Noise texture overlay for depth - very subtle */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
}

// Reduced motion variant for accessibility
export function StaticSkewedBackground({ 
  className = '',
  opacity = 0.05 
}: Omit<SkewedBackgroundProps, 'parallaxSpeed'>) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return (
      <div 
        className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
        aria-hidden="true"
      >
        <div 
          className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950"
          style={{ opacity }}
        />
      </div>
    );
  }

  return <SkewedBackground className={className} opacity={opacity} />;
}