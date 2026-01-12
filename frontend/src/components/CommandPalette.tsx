import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, File, Settings, User, Command } from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ElementType;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export function CommandPalette({
  isOpen,
  onClose,
  commands,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card p-4 w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-4 h-4 text-zinc-500" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commands, files, or actions..."
              className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 focus:outline-none"
            />
            <kbd className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
              ESC
            </kbd>
          </div>

          <div className="space-y-1 max-h-96 overflow-auto">
            <AnimatePresence>
              {filteredCommands.map((command, idx) => {
                const Icon = command.icon || Command;
                return (
                  <motion.button
                    key={command.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      command.action();
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800/50 text-left transition-colors ${
                      selectedIndex === idx ? 'bg-zinc-800/50' : ''
                    }`}
                  >
                    <Icon className="w-4 h-4 text-zinc-500" />
                    <div className="flex-1">
                      <p className="text-sm text-zinc-100">{command.title}</p>
                      {command.description && (
                        <p className="text-xs text-zinc-500">
                          {command.description}
                        </p>
                      )}
                    </div>
                    {command.shortcut && (
                      <kbd className="text-xs text-zinc-600">
                        {command.shortcut}
                      </kbd>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Default command items for demonstration
export const defaultCommands: CommandItem[] = [
  {
    id: 'new-file',
    title: 'New File',
    description: 'Create a new file',
    icon: File,
    shortcut: '⌘N',
    action: () => console.log('New file'),
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Open settings',
    icon: Settings,
    shortcut: '⌘,',
    action: () => console.log('Open settings'),
  },
  {
    id: 'profile',
    title: 'Profile',
    description: 'View your profile',
    icon: User,
    shortcut: '⌘P',
    action: () => console.log('View profile'),
  },
];

// Hook to manage command palette state
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}