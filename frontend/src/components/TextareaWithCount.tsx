import React from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface TextareaWithCountProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  maxLength?: number;
  className?: string;
}

export function TextareaWithCount({
  value,
  onChange,
  maxLength = 500,
  className,
  ...props
}: TextareaWithCountProps) {
  const remaining = maxLength - (value?.length || 0);

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        className={cn(
          "w-full p-3 bg-zinc-900/50 border border-zinc-800 rounded-md",
          "text-zinc-100 placeholder-zinc-600",
          "focus:outline-none focus:ring-1 focus:ring-zinc-600",
          "resize-none",
          className
        )}
        {...props}
      />
      <div className="absolute bottom-2 right-2">
        <span
          className={cn(
            "text-xs",
            remaining < 50 ? "text-amber-500" : "text-zinc-600"
          )}
        >
          {remaining} characters
        </span>
      </div>
    </div>
  );
}