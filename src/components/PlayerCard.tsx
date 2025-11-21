'use client';

import { User } from '@/lib/db/repositories/userRepository';
import { PhysicalTest } from '@/lib/db/repositories/physicalTestRepository';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface PlayerCardProps {
  player: User;
  physicalTest?: PhysicalTest | null;
}

/**
 * Get card color based on DNA stage
 */
function getCardColor(dnaStage?: string): string {
  switch (dnaStage?.toLowerCase()) {
    case 'bronze':
      return 'from-orange-800 to-orange-600';
    case 'silver':
      return 'from-gray-400 to-gray-300';
    case 'gold':
      return 'from-yellow-500 to-yellow-400';
    case 'platinum':
      return 'from-purple-600 to-purple-400';
    case 'diamond':
      return 'from-blue-400 to-cyan-300';
    default:
      return 'from-gray-700 to-gray-600';
  }
}

/**
 * Map ratings to player card stats
 */
function mapToCardStats(test?: PhysicalTest | null) {
  if (!test) {
    return {
      PAC: 50, // Pace
      DRI: 50, // Dribbling (Motor Control)
      PHY: 50, // Physical
      STR: 50, // Strength (Upper Body)
      AGI: 50, // Agility
      END: 50, // Endurance
    };
  }

  return {
    PAC: test.speedRating || 50,
    DRI: test.motorControlRating || 50,
    PHY: test.physicalStrengthRating || 50,
    STR: test.upperBodyStrengthRating || 50,
    AGI: test.agilityRating || 50,
    END: test.enduranceRating || 50,
  };
}

export function PlayerCard({ player, physicalTest }: PlayerCardProps) {
  const cardColor = getCardColor(player.dnaStage);
  const stats = mapToCardStats(physicalTest);
  const overall = physicalTest?.overallRating || 50;

  return (
    <Card className={`relative w-full max-w-sm overflow-hidden bg-gradient-to-br ${cardColor} p-1`}>
      <div className="bg-black/10 backdrop-blur-sm p-4 rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-bold bg-white/90 text-black">
              {overall}
            </Badge>
            <span className="text-xs font-semibold text-white uppercase">
              {player.position || 'Player'}
            </span>
          </div>
          {player.country && (
            <span className="text-2xl">{getFlagEmoji(player.country)}</span>
          )}
        </div>

        {/* Player Photo */}
        <div className="relative w-full aspect-square mb-3 rounded-lg overflow-hidden bg-black/20">
          {player.profilePicture ? (
            <Image
              src={player.profilePicture}
              alt={player.fullName || player.username}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-24 h-24 text-white/50"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Player Name */}
        <div className="text-center mb-3">
          <h3 className="text-2xl font-bold text-white drop-shadow-lg">
            {player.fullName || player.username}
          </h3>
          {player.nationalId && (
            <p className="text-xs text-white/80">ID: {player.nationalId}</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {Object.entries(stats).map(([key, value]) => (
            <div
              key={key}
              className="bg-white/20 backdrop-blur-sm rounded p-2 text-center"
            >
              <div className="text-xs font-semibold text-white/80">{key}</div>
              <div className="text-xl font-bold text-white">{value}</div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-white/80">
          <div className="flex items-center gap-2">
            {player.preferredFoot && (
              <span>👟 {player.preferredFoot.toUpperCase()}</span>
            )}
            {player.height && <span>📏 {player.height}cm</span>}
            {player.weight && <span>⚖️ {player.weight}kg</span>}
          </div>
          <div className="flex items-center gap-1">
            {/* Cactus Ball Logo placeholder */}
            <span className="text-lg">🌵⚽</span>
            <span className="font-bold">DNA</span>
          </div>
        </div>

        {/* DNA Stage Badge */}
        {player.dnaStage && (
          <div className="mt-2 text-center">
            <Badge className="bg-white/90 text-black font-bold">
              {player.dnaStage.toUpperCase()}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Get flag emoji from country code or name
 */
function getFlagEmoji(country: string): string {
  // Simple mapping - expand as needed
  const flags: Record<string, string> = {
    'Saudi Arabia': '🇸🇦',
    'SA': '🇸🇦',
    'United States': '🇺🇸',
    'US': '🇺🇸',
    'UK': '🇬🇧',
    'United Kingdom': '🇬🇧',
    'Egypt': '🇪🇬',
    'EG': '🇪🇬',
    'UAE': '🇦🇪',
    'Brazil': '🇧🇷',
    'Argentina': '🇦🇷',
    'Spain': '🇪🇸',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Italy': '🇮🇹',
  };

  return flags[country] || '🌍';
}
