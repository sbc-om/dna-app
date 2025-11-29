'use client';

import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { getStudentMedalsAction } from '@/lib/actions/medalActions';
import type { Medal } from '@/lib/db/repositories/medalRepository';

interface ChildMedalsPreviewProps {
  childId: string;
}

interface MedalCount {
  medal: Medal;
  count: number;
}

export function ChildMedalsPreview({ childId }: ChildMedalsPreviewProps) {
  const [medals, setMedals] = useState<MedalCount[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedals();
  }, [childId]);

  const loadMedals = async () => {
    try {
      const result = await getStudentMedalsAction(childId);
      if (result.success && result.studentMedals) {
        // Count medals by type
        const medalCounts = result.studentMedals.reduce((acc, sm) => {
          if (sm.medal) {
            const existing = acc.find(m => m.medal.id === sm.medal!.id);
            if (existing) {
              existing.count++;
            } else {
              acc.push({ medal: sm.medal, count: 1 });
            }
          }
          return acc;
        }, [] as MedalCount[]);

        // Sort by points descending and take top 3
        medalCounts.sort((a, b) => b.medal.points - a.medal.points);
        setMedals(medalCounts.slice(0, 3));

        // Calculate total points
        const total = result.studentMedals.reduce((sum, sm) => sum + (sm.medal?.points || 0), 0);
        setTotalPoints(total);
      }
    } catch (error) {
      console.error('Failed to load medals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-[#DDDDDD] animate-pulse" />
      </div>
    );
  }

  if (medals.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[#262626] dark:text-[#DDDDDD]">
        <Award className="w-5 h-5 text-[#DDDDDD]" />
        <span className="text-sm">No medals yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Top 3 Medals */}
      <div className="flex items-center -space-x-2">
        {medals.map(({ medal, count }) => (
          <div key={medal.id} className="relative group/medal">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-[#262626] border-2 border-[#FF5F02] flex items-center justify-center shadow-md hover:scale-110 transition-transform hover:z-10">
              <span className="text-xl">{medal.icon}</span>
            </div>
            {count > 1 && (
              <div className="absolute -bottom-1 -right-1 bg-[#FF5F02] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-white border-2 border-white dark:border-[#262626]">
                {count}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total Points */}
      <div className="flex items-center gap-1 bg-[#FF5F02] text-white px-3 py-1 rounded-full shadow-md">
        <Award className="w-4 h-4" />
        <span className="text-sm font-bold">{totalPoints}</span>
      </div>
    </div>
  );
}
