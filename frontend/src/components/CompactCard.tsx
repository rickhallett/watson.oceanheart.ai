import React, { type ReactNode } from 'react';

interface CompactCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
  status?: 'default' | 'success' | 'warning' | 'error';
  metric?: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

/**
 * CompactCard Component
 * A small, information-dense card for the monochrome design system
 * Used in dashboards and grids for displaying metrics and status
 */
export function CompactCard({
  title,
  description,
  icon,
  className = '',
  onClick,
  status = 'default',
  metric,
  trend,
}: CompactCardProps) {
  // Status color classes (minimal usage)
  const statusClasses = {
    default: '',
    success: 'border-l-2 border-l-green-500',
    warning: 'border-l-2 border-l-yellow-500',
    error: 'border-l-2 border-l-red-500',
  };

  // Trend indicator
  const TrendIndicator = () => {
    if (!trend) return null;
    
    const trendIcons = {
      up: '↑',
      down: '↓',
      neutral: '→',
    };
    
    const trendColors = {
      up: 'text-green-500',
      down: 'text-red-500',
      neutral: 'text-zinc-500',
    };
    
    return (
      <span className={`text-xs ml-1 ${trendColors[trend]}`}>
        {trendIcons[trend]}
      </span>
    );
  };

  return (
    <div
      className={`
        glass-card glass-card-hover p-3
        ${statusClasses[status]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="flex items-start gap-2">
        {/* Icon */}
        {icon && (
          <span className="text-zinc-400 flex-shrink-0">
            {icon}
          </span>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-zinc-100 truncate">
              {title}
            </h3>
            {metric !== undefined && (
              <span className="text-sm font-semibold text-zinc-50 flex-shrink-0">
                {metric}
                <TrendIndicator />
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * CompactCardGrid Component
 * A wrapper for organizing CompactCards in a responsive grid
 */
interface CompactCardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4 | 'auto';
  className?: string;
}

export function CompactCardGrid({
  children,
  columns = 'auto',
  className = '',
}: CompactCardGridProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`compact-grid ${columnClasses[columns]} ${className}`}>
      {children}
    </div>
  );
}