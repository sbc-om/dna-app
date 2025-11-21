'use client';

import { useRef } from 'react';
import { PlayerCard } from './PlayerCard';
import { User } from '@/lib/db/repositories/userRepository';
import { PhysicalTest } from '@/lib/db/repositories/physicalTestRepository';
import { Button } from './ui/button';
import { Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface PlayerCardWithActionsProps {
  player: User;
  physicalTest?: PhysicalTest | null;
}

export function PlayerCardWithActions({ player, physicalTest }: PlayerCardWithActionsProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `${player.fullName || player.username}-player-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading card:', error);
      alert('Failed to download card');
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `${player.fullName || player.username}-card.png`, {
          type: 'image/png',
        });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${player.fullName || player.username} Player Card`,
            text: `Check out this DNA player card!`,
            files: [file],
          });
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          alert('Card image copied to clipboard!');
        }
      });
    } catch (error) {
      console.error('Error sharing card:', error);
      alert('Failed to share card');
    }
  };

  return (
    <div className="space-y-4">
      <div ref={cardRef}>
        <PlayerCard player={player} physicalTest={physicalTest} />
      </div>

      <div className="flex gap-2 justify-center">
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download Card
        </Button>
        <Button onClick={handleShare} variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share Card
        </Button>
      </div>
    </div>
  );
}
