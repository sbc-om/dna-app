'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
  noPadding?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  '4xl': 'max-w-[1440px]',
  '6xl': 'max-w-[1600px]',
  full: 'max-w-full',
};

export function PageContainer({ 
  children, 
  className,
  maxWidth = 'xl',
  noPadding = false
}: PageContainerProps) {
  return (
    <div 
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        !noPadding && 'px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8',
        className
      )}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  backButton?: ReactNode;
}

export function PageHeader({ title, description, action, backButton }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      {backButton && (
        <div className="mb-3 sm:mb-4">
          {backButton}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
          {description && (
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="shrink-0 self-start sm:self-auto">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

interface PageCardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageCard({ children, className, noPadding = false }: PageCardProps) {
  return (
    <div 
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700',
        !noPadding && 'p-4 sm:p-6 lg:p-8',
        className
      )}
    >
      {children}
    </div>
  );
}

interface PageGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function PageGrid({ children, columns = 3, className }: PageGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div 
      className={cn(
        'grid gap-4 sm:gap-6',
        gridClasses[columns],
        className
      )}
    >
      {children}
    </div>
  );
}

interface PageSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function PageSection({ children, title, description, className }: PageSectionProps) {
  return (
    <section className={cn('space-y-4 sm:space-y-6', className)}>
      {(title || description) && (
        <div className="space-y-1 sm:space-y-2">
          {title && (
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
