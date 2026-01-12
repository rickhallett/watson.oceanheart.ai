import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  path: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (path: string) => void;
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  const handleClick = (e: React.MouseEvent, item: BreadcrumbItem) => {
    if (item.href && onNavigate) {
      e.preventDefault();
      onNavigate(item.href);
    }
  };

  return (
    <nav className="flex items-center gap-2 text-sm">
      {items.map((item, idx) => (
        <motion.div
          key={item.path}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="flex items-center gap-2"
        >
          {idx > 0 && <ChevronRight className="w-3 h-3 text-zinc-600" />}
          {item.href ? (
            <a
              href={item.href}
              onClick={(e) => handleClick(e, item)}
              className="text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-zinc-100">{item.label}</span>
          )}
        </motion.div>
      ))}
    </nav>
  );
}