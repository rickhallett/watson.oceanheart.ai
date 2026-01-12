import React from 'react';

export function AppFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-black/50 backdrop-blur">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-neutral-400 text-sm">
              © 2024 Watson AI. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <a 
              href="/privacy" 
              className="text-neutral-400 hover:text-white transition text-sm"
            >
              Privacy
            </a>
            <a 
              href="/terms" 
              className="text-neutral-400 hover:text-white transition text-sm"
            >
              Terms
            </a>
            <a 
              href="/contact" 
              className="text-neutral-400 hover:text-white transition text-sm"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}