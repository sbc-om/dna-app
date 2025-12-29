'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type DnaCircularGaugeProps = {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  valueSuffix?: string;
  accentColor?: string;
  trackColor?: string;
  className?: string;
  ariaLabel?: string;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function DnaCircularGauge({
  value,
  max = 100,
  size = 64,
  strokeWidth = 8,
  label,
  valueSuffix,
  accentColor,
  trackColor,
  className,
  ariaLabel,
}: DnaCircularGaugeProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? value : 0;
  const ratio = clamp01(safeValue / safeMax);

  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - ratio);

  const stroke = accentColor ?? 'var(--dna-accent)';
  const track = trackColor ?? 'rgba(148, 163, 184, 0.35)';

  const displayValue = `${Math.round(safeValue)}${valueSuffix ?? ''}`;

  return (
    <div className={cn('flex items-center gap-3', className)} aria-label={ariaLabel}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="transparent"
            stroke={track}
            strokeWidth={strokeWidth}
          />

          <motion.circle
            cx={cx}
            cy={cy}
            r={r}
            fill="transparent"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ type: 'spring', stiffness: 180, damping: 24 }}
            style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }}
          />
        </svg>

        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">{displayValue}</div>
            <div className="text-[10px] font-semibold text-slate-600 dark:text-white/60 leading-none">
              /{safeMax}
            </div>
          </div>
        </div>
      </div>

      {label ? (
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-700 dark:text-white/70 truncate">{label}</div>
        </div>
      ) : null}
    </div>
  );
}
