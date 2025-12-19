'use client';

import { useState } from 'react';
import type { User } from '@/lib/db/repositories/userRepository';
import type { PhysicalTest } from '@/lib/db/repositories/physicalTestRepository';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPhysicalTestAction, updatePhysicalTestAction } from '@/lib/actions/physicalTestActions';

interface PhysicalTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dictionary: Dictionary;
  locale: Locale;
  player: User;
  examinerId: string;
  existingTest?: PhysicalTest | null;
  onTestSaved?: (test: PhysicalTest) => void;
}

export function PhysicalTestDialog({
  open,
  onOpenChange,
  dictionary,
  locale,
  player,
  examinerId,
  existingTest,
  onTestSaved,
}: PhysicalTestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    verticalJump: existingTest?.verticalJump?.toString() || '',
    broadJump: existingTest?.broadJump?.toString() || '',
    sprint10m: existingTest?.sprint10m?.toString() || '',
    sprint20m: existingTest?.sprint20m?.toString() || '',
    sprint30m: existingTest?.sprint30m?.toString() || '',
    illinoisAgilityTest: existingTest?.illinoisAgilityTest?.toString() || '',
    tTest: existingTest?.tTest?.toString() || '',
    agility505Test: existingTest?.agility505Test?.toString() || '',
    singleLegBalance: existingTest?.singleLegBalance?.toString() || '',
    plankHold: existingTest?.plankHold?.toString() || '',
    enduranceTest: existingTest?.enduranceTest?.toString() || '',
    pullUpTest: existingTest?.pullUpTest?.toString() || '',
    testDate: existingTest?.testDate || new Date().toISOString().split('T')[0],
    notes: existingTest?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      userId: player.id,
      verticalJump: formData.verticalJump ? parseFloat(formData.verticalJump) : undefined,
      broadJump: formData.broadJump ? parseFloat(formData.broadJump) : undefined,
      sprint10m: formData.sprint10m ? parseFloat(formData.sprint10m) : undefined,
      sprint20m: formData.sprint20m ? parseFloat(formData.sprint20m) : undefined,
      sprint30m: formData.sprint30m ? parseFloat(formData.sprint30m) : undefined,
      illinoisAgilityTest: formData.illinoisAgilityTest ? parseFloat(formData.illinoisAgilityTest) : undefined,
      tTest: formData.tTest ? parseFloat(formData.tTest) : undefined,
      agility505Test: formData.agility505Test ? parseFloat(formData.agility505Test) : undefined,
      singleLegBalance: formData.singleLegBalance ? parseFloat(formData.singleLegBalance) : undefined,
      plankHold: formData.plankHold ? parseFloat(formData.plankHold) : undefined,
      enduranceTest: formData.enduranceTest ? parseFloat(formData.enduranceTest) : undefined,
      pullUpTest: formData.pullUpTest ? parseFloat(formData.pullUpTest) : undefined,
      testDate: formData.testDate,
      examinerId,
      notes: formData.notes,
      locale,
    };

    let result;
    if (existingTest) {
      result = await updatePhysicalTestAction(existingTest.id, payload);
    } else {
      result = await createPhysicalTestAction(payload);
    }

    setIsSubmitting(false);

    if (result.success && result.test) {
      onTestSaved?.(result.test);
      onOpenChange(false);
    } else {
      alert(result.error || 'Failed to save test');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {existingTest ? 'Edit Physical Test' : 'New Physical Test'}
            </DialogTitle>
            <DialogDescription>
              Record physical test results for {player.fullName || player.username}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Test Date */}
            <div className="grid gap-2">
              <Label htmlFor="testDate">Test Date</Label>
              <Input
                id="testDate"
                type="date"
                value={formData.testDate}
                onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                required
              />
            </div>

            {/* Jump Tests */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="verticalJump">Vertical Jump (cm)</Label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                    {formData.verticalJump || '0'}
                  </div>
                </div>
                <input
                  id="verticalJump"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.verticalJump || '0'}
                  onChange={(e) => setFormData({ ...formData, verticalJump: e.target.value })}
                  className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="Vertical Jump in centimeters"
                  title="Vertical Jump in centimeters"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(formData.verticalJump || '0')) / 100) * 100}%, rgb(229, 231, 235) ${((parseFloat(formData.verticalJump || '0')) / 100) * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="broadJump">Broad Jump (cm)</Label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                    {formData.broadJump || '0'}
                  </div>
                </div>
                <input
                  id="broadJump"
                  type="range"
                  min="0"
                  max="300"
                  step="5"
                  value={formData.broadJump || '0'}
                  onChange={(e) => setFormData({ ...formData, broadJump: e.target.value })}
                  className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="Broad Jump in centimeters"
                  title="Broad Jump in centimeters"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(formData.broadJump || '0')) / 300) * 100}%, rgb(229, 231, 235) ${((parseFloat(formData.broadJump || '0')) / 300) * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0</span>
                  <span>150</span>
                  <span>300</span>
                </div>
              </div>
            </div>

            {/* Sprint Tests */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="sprint10m">Sprint 10m (s)</Label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                    {formData.sprint10m || '0.0'}
                  </div>
                </div>
                <input
                  id="sprint10m"
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.sprint10m || '0'}
                  onChange={(e) => setFormData({ ...formData, sprint10m: e.target.value })}
                  className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="Sprint 10m in seconds"
                  title="Sprint 10m in seconds"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(formData.sprint10m || '0')) / 10) * 100}%, rgb(229, 231, 235) ${((parseFloat(formData.sprint10m || '0')) / 10) * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="sprint20m">Sprint 20m (s)</Label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                    {formData.sprint20m || '0.0'}
                  </div>
                </div>
                <input
                  id="sprint20m"
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.sprint20m || '0'}
                  onChange={(e) => setFormData({ ...formData, sprint20m: e.target.value })}
                  className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="Sprint 20m in seconds"
                  title="Sprint 20m in seconds"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(formData.sprint20m || '0')) / 10) * 100}%, rgb(229, 231, 235) ${((parseFloat(formData.sprint20m || '0')) / 10) * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="sprint30m">Sprint 30m (s)</Label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                    {formData.sprint30m || '0.0'}
                  </div>
                </div>
                <input
                  id="sprint30m"
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.sprint30m || '0'}
                  onChange={(e) => setFormData({ ...formData, sprint30m: e.target.value })}
                  className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="Sprint 30m in seconds"
                  title="Sprint 30m in seconds"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(formData.sprint30m || '0')) / 10) * 100}%, rgb(229, 231, 235) ${((parseFloat(formData.sprint30m || '0')) / 10) * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
              </div>
            </div>

            {/* Agility Tests */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="illinoisAgilityTest">Illinois Test (s)</Label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                    {formData.illinoisAgilityTest || '0.0'}
                  </div>
                </div>
                <input
                  id="illinoisAgilityTest"
                  type="range"
                  min="0"
                  max="30"
                  step="0.1"
                  value={formData.illinoisAgilityTest || '0'}
                  onChange={(e) => setFormData({ ...formData, illinoisAgilityTest: e.target.value })}
                  className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="Illinois Agility Test in seconds"
                  title="Illinois Agility Test in seconds"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(formData.illinoisAgilityTest || '0')) / 30) * 100}%, rgb(229, 231, 235) ${((parseFloat(formData.illinoisAgilityTest || '0')) / 30) * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="tTest">T-Test (s)</Label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                    {formData.tTest || '0.0'}
                  </div>
                </div>
                <input
                  id="tTest"
                  type="range"
                  min="0"
                  max="30"
                  step="0.1"
                  value={formData.tTest || '0'}
                  onChange={(e) => setFormData({ ...formData, tTest: e.target.value })}
                  className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="T-Test in seconds"
                  title="T-Test in seconds"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(formData.tTest || '0')) / 30) * 100}%, rgb(229, 231, 235) ${((parseFloat(formData.tTest || '0')) / 30) * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="agility505Test">5-0-5 Test (s)</Label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                    {formData.agility505Test || '0.0'}
                  </div>
                </div>
                <input
                  id="agility505Test"
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.agility505Test || '0'}
                  onChange={(e) => setFormData({ ...formData, agility505Test: e.target.value })}
                  className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="5-0-5 Agility Test in seconds"
                  title="5-0-5 Agility Test in seconds"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(formData.agility505Test || '0')) / 10) * 100}%, rgb(229, 231, 235) ${((parseFloat(formData.agility505Test || '0')) / 10) * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
              </div>
            </div>

            {/* Balance and Strength Tests */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="singleLegBalance">Single-Leg Balance (s)</Label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                    {formData.singleLegBalance || '0'}
                  </div>
                </div>
                <input
                  id="singleLegBalance"
                  type="range"
                  min="0"
                  max="120"
                  step="1"
                  value={formData.singleLegBalance || '0'}
                  onChange={(e) => setFormData({ ...formData, singleLegBalance: e.target.value })}
                  className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="Single-Leg Balance in seconds"
                  title="Single-Leg Balance in seconds"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(formData.singleLegBalance || '0')) / 120) * 100}%, rgb(229, 231, 235) ${((parseFloat(formData.singleLegBalance || '0')) / 120) * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="plankHold">Plank Hold (s)</Label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                    {formData.plankHold || '0'}
                  </div>
                </div>
                <input
                  id="plankHold"
                  type="range"
                  min="0"
                  max="300"
                  step="5"
                  value={formData.plankHold || '0'}
                  onChange={(e) => setFormData({ ...formData, plankHold: e.target.value })}
                  className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="Plank Hold in seconds"
                  title="Plank Hold in seconds"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(formData.plankHold || '0')) / 300) * 100}%, rgb(229, 231, 235) ${((parseFloat(formData.plankHold || '0')) / 300) * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
              </div>
            </div>

            {/* Endurance and Pull-ups */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="enduranceTest">Endurance Test (m)</Label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                    {formData.enduranceTest || '0'}
                  </div>
                </div>
                <input
                  id="enduranceTest"
                  type="range"
                  min="0"
                  max="5000"
                  step="50"
                  value={formData.enduranceTest || '0'}
                  onChange={(e) => setFormData({ ...formData, enduranceTest: e.target.value })}
                  className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="Endurance Test in meters"
                  title="Endurance Test in meters"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(formData.enduranceTest || '0')) / 5000) * 100}%, rgb(229, 231, 235) ${((parseFloat(formData.enduranceTest || '0')) / 5000) * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="pullUpTest">Pull-Up Test (count)</Label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                    {formData.pullUpTest || '0'}
                  </div>
                </div>
                <input
                  id="pullUpTest"
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={formData.pullUpTest || '0'}
                  onChange={(e) => setFormData({ ...formData, pullUpTest: e.target.value })}
                  className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="Pull-Up Test count"
                  title="Pull-Up Test count"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(formData.pullUpTest || '0')) / 50) * 100}%, rgb(229, 231, 235) ${((parseFloat(formData.pullUpTest || '0')) / 50) * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : existingTest ? 'Update' : 'Submit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
