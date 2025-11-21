'use client';

import { useState } from 'react';
import { User } from '@/lib/db/repositories/userRepository';
import { PhysicalTest } from '@/lib/db/repositories/physicalTestRepository';
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
                <Label htmlFor="verticalJump">Vertical Jump (cm)</Label>
                <Input
                  id="verticalJump"
                  type="number"
                  step="0.1"
                  value={formData.verticalJump}
                  onChange={(e) => setFormData({ ...formData, verticalJump: e.target.value })}
                  placeholder="e.g., 45"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="broadJump">Broad Jump (cm)</Label>
                <Input
                  id="broadJump"
                  type="number"
                  step="0.1"
                  value={formData.broadJump}
                  onChange={(e) => setFormData({ ...formData, broadJump: e.target.value })}
                  placeholder="e.g., 180"
                />
              </div>
            </div>

            {/* Sprint Tests */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sprint10m">Sprint 10m (s)</Label>
                <Input
                  id="sprint10m"
                  type="number"
                  step="0.01"
                  value={formData.sprint10m}
                  onChange={(e) => setFormData({ ...formData, sprint10m: e.target.value })}
                  placeholder="e.g., 1.8"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sprint20m">Sprint 20m (s)</Label>
                <Input
                  id="sprint20m"
                  type="number"
                  step="0.01"
                  value={formData.sprint20m}
                  onChange={(e) => setFormData({ ...formData, sprint20m: e.target.value })}
                  placeholder="e.g., 3.2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sprint30m">Sprint 30m (s)</Label>
                <Input
                  id="sprint30m"
                  type="number"
                  step="0.01"
                  value={formData.sprint30m}
                  onChange={(e) => setFormData({ ...formData, sprint30m: e.target.value })}
                  placeholder="e.g., 4.8"
                />
              </div>
            </div>

            {/* Agility Tests */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="illinoisAgilityTest">Illinois Test (s)</Label>
                <Input
                  id="illinoisAgilityTest"
                  type="number"
                  step="0.01"
                  value={formData.illinoisAgilityTest}
                  onChange={(e) => setFormData({ ...formData, illinoisAgilityTest: e.target.value })}
                  placeholder="e.g., 15.5"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tTest">T-Test (s)</Label>
                <Input
                  id="tTest"
                  type="number"
                  step="0.01"
                  value={formData.tTest}
                  onChange={(e) => setFormData({ ...formData, tTest: e.target.value })}
                  placeholder="e.g., 10.2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="agility505Test">5-0-5 Test (s)</Label>
                <Input
                  id="agility505Test"
                  type="number"
                  step="0.01"
                  value={formData.agility505Test}
                  onChange={(e) => setFormData({ ...formData, agility505Test: e.target.value })}
                  placeholder="e.g., 2.8"
                />
              </div>
            </div>

            {/* Balance and Strength Tests */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="singleLegBalance">Single-Leg Balance (s)</Label>
                <Input
                  id="singleLegBalance"
                  type="number"
                  step="0.1"
                  value={formData.singleLegBalance}
                  onChange={(e) => setFormData({ ...formData, singleLegBalance: e.target.value })}
                  placeholder="e.g., 30"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plankHold">Plank Hold (s)</Label>
                <Input
                  id="plankHold"
                  type="number"
                  step="0.1"
                  value={formData.plankHold}
                  onChange={(e) => setFormData({ ...formData, plankHold: e.target.value })}
                  placeholder="e.g., 60"
                />
              </div>
            </div>

            {/* Endurance and Pull-ups */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="enduranceTest">Endurance Test (m)</Label>
                <Input
                  id="enduranceTest"
                  type="number"
                  step="1"
                  value={formData.enduranceTest}
                  onChange={(e) => setFormData({ ...formData, enduranceTest: e.target.value })}
                  placeholder="e.g., 2400"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pullUpTest">Pull-Up Test (count)</Label>
                <Input
                  id="pullUpTest"
                  type="number"
                  step="1"
                  value={formData.pullUpTest}
                  onChange={(e) => setFormData({ ...formData, pullUpTest: e.target.value })}
                  placeholder="e.g., 10"
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
