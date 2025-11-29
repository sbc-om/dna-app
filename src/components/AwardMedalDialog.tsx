'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Medal } from '@/lib/db/repositories/medalRepository';
import { getActiveMedalsAction, awardMedalAction } from '@/lib/actions/medalActions';
import { Award } from 'lucide-react';

interface AwardMedalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  courseId: string;
  attendanceId: string;
  onSuccess?: () => void;
  dictionary: any;
}

export function AwardMedalDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  courseId,
  attendanceId,
  onSuccess,
  dictionary,
}: AwardMedalDialogProps) {
  const [medals, setMedals] = useState<Medal[]>([]);
  const [selectedMedal, setSelectedMedal] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadMedals();
    }
  }, [open]);

  const loadMedals = async () => {
    const result = await getActiveMedalsAction();
    if (result.success && result.medals) {
      setMedals(result.medals);
    }
  };

  const handleAward = async () => {
    if (!selectedMedal) return;

    setLoading(true);
    try {
      const result = await awardMedalAction({
        studentId,
        medalId: selectedMedal,
        courseId,
        attendanceId,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        onSuccess?.();
        onOpenChange(false);
        setSelectedMedal('');
        setNotes('');
      }
    } catch (error) {
      console.error('Award medal error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-[#262626]">
        <DialogHeader>
          <DialogTitle className="text-[#262626] dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FF5F02]" />
            {dictionary.settings.awardMedal}
          </DialogTitle>
          <DialogDescription className="text-[#262626] dark:text-[#DDDDDD]">
            {dictionary.settings.awardMedalTo} {studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Medal Selection */}
          <div className="space-y-2">
            <Label className="text-[#262626] dark:text-white">
              {dictionary.settings.selectMedal}
            </Label>
            {medals.length === 0 ? (
              <p className="text-sm text-[#262626] dark:text-[#DDDDDD] py-4 text-center">
                {dictionary.settings.noMedals}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
                {medals.map((medal) => (
                  <button
                    key={medal.id}
                    onClick={() => setSelectedMedal(medal.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedMedal === medal.id
                        ? 'border-[#FF5F02] bg-[#FF5F02] bg-opacity-10'
                        : 'border-[#DDDDDD] dark:border-[#262626] hover:border-[#FF5F02]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{medal.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#262626] dark:text-white">
                          {medal.name}
                        </h4>
                        <p className="text-sm text-[#262626] dark:text-[#DDDDDD] mt-1">
                          {medal.description}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-[#FF5F02]">
                          <span className="text-xs font-semibold text-white">
                            +{medal.points} {dictionary.courses.points}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[#262626] dark:text-white">
              {dictionary.settings.awardNotes}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={dictionary.settings.awardNotes}
              className="min-h-[80px] bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#DDDDDD] dark:border-[#262626]"
          >
            {dictionary.common.cancel}
          </Button>
          <Button
            onClick={handleAward}
            disabled={!selectedMedal || loading}
            className="bg-[#FF5F02] hover:bg-[#262626] text-white"
          >
            {loading ? dictionary.common.loading : dictionary.settings.awardMedal}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
