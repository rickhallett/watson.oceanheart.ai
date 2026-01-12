import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DragDropZoneProps {
  onFileDrop: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function DragDropZone({
  onFileDrop,
  accept,
  multiple = false,
  className,
  children,
}: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onFileDrop(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onFileDrop(files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8",
        "transition-all duration-200 cursor-pointer",
        isDragging
          ? "border-zinc-500 bg-zinc-800/30 scale-[1.02]"
          : "border-zinc-700 hover:border-zinc-600",
        className
      )}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        {children || (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-8 h-8 text-zinc-500" />
            <p className="text-sm text-zinc-400">
              Drop files here or click to browse
            </p>
            {accept && (
              <p className="text-xs text-zinc-600">Accepts: {accept}</p>
            )}
          </div>
        )}
      </label>
    </div>
  );
}