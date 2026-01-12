import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function TabNav({ tabs, activeTab, onChange, className }: TabNavProps) {
  const [indicatorStyle, setIndicatorStyle] = useState<{
    width: number;
    left: number;
  }>({ width: 0, left: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = tabs.findIndex((t) => t.id === activeTab);
    const activeEl = tabRefs.current[activeIndex];
    if (activeEl) {
      setIndicatorStyle({
        width: activeEl.offsetWidth,
        left: activeEl.offsetLeft,
      });
    }
  }, [activeTab, tabs]);

  return (
    <div className={cn("relative", className)}>
      <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-lg">
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[idx] = el)}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-4 py-2 text-sm rounded-md transition-colors",
              activeTab === tab.id
                ? "text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 text-xs text-zinc-600">({tab.count})</span>
            )}
          </button>
        ))}
        <motion.div
          className="absolute bottom-1 h-[2px] bg-zinc-400 rounded-full"
          animate={indicatorStyle}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>
    </div>
  );
}