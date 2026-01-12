import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
  className?: string;
}

export function RadioGroup({
  options,
  value,
  onChange,
  name,
  className
}: RadioGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex items-center gap-3 p-3 rounded-md cursor-pointer",
            "border transition-all duration-200",
            value === option.value
              ? "border-zinc-600 bg-zinc-800/50"
              : "border-zinc-800 hover:border-zinc-700"
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <div className="relative w-4 h-4 rounded-full border border-zinc-600">
            <AnimatePresence>
              {value === option.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute inset-1 bg-zinc-400 rounded-full"
                />
              )}
            </AnimatePresence>
          </div>
          <div className="flex-1">
            <p className="text-sm text-zinc-100">{option.label}</p>
            {option.description && (
              <p className="text-xs text-zinc-500 mt-0.5">{option.description}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}