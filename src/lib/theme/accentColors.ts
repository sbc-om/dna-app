import type { PlayerStageKey } from '@/lib/player/stageSystem';

export const DEFAULT_ACCENT_COLOR = '#FF5F02';

const DEFAULT_LEVEL_COLORS: string[] = [
  '#FF3B30', // red
  '#FF5F02', // orange (DNA)
  '#FFD60A', // yellow
  '#34C759', // green
  '#0A84FF', // blue
  '#5E5CE6', // indigo
  '#BF5AF2', // purple
];

export function normalizeHexColor(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;

  // Allow "RRGGBB", "#RRGGBB", "RGB", "#RGB".
  const hex = raw.startsWith('#') ? raw.slice(1) : raw;
  if (!/^[0-9a-fA-F]{3}$/.test(hex) && !/^[0-9a-fA-F]{6}$/.test(hex)) return null;

  const expanded =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;

  return `#${expanded.toUpperCase()}`;
}

export function getDefaultProgramLevelColor(order: number | undefined): string {
  const idx = Math.max(0, (typeof order === 'number' && Number.isFinite(order) ? order : 1) - 1);
  return DEFAULT_LEVEL_COLORS[idx % DEFAULT_LEVEL_COLORS.length] ?? DEFAULT_ACCENT_COLOR;
}

export function getStageAccentColor(stage: PlayerStageKey | string | undefined | null): string {
  switch (stage) {
    case 'explorer':
      return '#FF5F02';
    case 'foundation':
      return '#0A84FF';
    case 'active_player':
    case 'activePlayer':
      return '#34C759';
    case 'competitor':
      return '#BF5AF2';
    case 'champion':
      return '#FFD60A';
    default:
      return DEFAULT_ACCENT_COLOR;
  }
}
