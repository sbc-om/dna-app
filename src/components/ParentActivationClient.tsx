'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, CreditCard, ShieldCheck, UserRound, AlertTriangle } from 'lucide-react';
import type { Locale } from '@/config/i18n';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { confirmActivationByTokenAction, completePaymentByTokenAction } from '@/lib/actions/playerActivationActions';

type Props = {
  locale: Locale;
  dictionary: Dictionary;
  token: string;
  academy: { id: string; name: string };
  player: { id: string; fullName: string; birthDate?: string };
  initialParent: { name: string; email: string; phone: string };
  initialStatus: string;
};

type StepKey = 'confirm' | 'payment' | 'done';

export function ParentActivationClient({
  locale,
  dictionary,
  token,
  academy,
  player,
  initialParent,
  initialStatus,
}: Props) {
  const [step, setStep] = useState<StepKey>(() => {
    if (initialStatus === 'activated') return 'done';
    if (initialStatus === 'paid') return 'done';
    if (initialStatus === 'confirmed') return 'payment';
    return 'confirm';
  });

  const [accepted, setAccepted] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [parent, setParent] = useState({
    name: initialParent.name,
    email: initialParent.email,
    phone: initialParent.phone,
  });

  const titles = useMemo(() => {
    return {
      confirm: dictionary.common?.confirmContinue ?? 'Confirm details',
      payment: dictionary.payments?.title ?? 'Payment',
      done: dictionary.common?.done ?? 'Done',
    };
  }, [dictionary]);

  const submitConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await confirmActivationByTokenAction({
        locale,
        token,
        parentName: parent.name.trim(),
        parentEmail: parent.email.trim(),
        parentPhone: parent.phone.trim() || undefined,
        accepted,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      if (!accepted) {
        setStep('done');
        return;
      }

      setStep('payment');
    } catch (e) {
      console.error(e);
      setError(dictionary.common?.error ?? 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const submitPayment = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await completePaymentByTokenAction({ locale, token });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setStep('done');
    } catch (e) {
      console.error(e);
      setError(dictionary.common?.error ?? 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-3xl border-2 border-white/15 bg-white/70 dark:bg-white/5 dark:border-white/10 backdrop-blur-xl p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.12),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#262626] dark:text-white">
                {dictionary.common?.welcome ?? 'Welcome'}
              </h1>
              <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {academy.name}
              </p>
            </div>
            <motion.div
              animate={{ rotate: [0, -4, 4, -4, 0] }}
              transition={{ duration: 0.6 }}
              className="h-12 w-12 rounded-2xl border border-blue-500/20 bg-blue-500/10 flex items-center justify-center"
            >
              <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </motion.div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">Player</div>
              <div className="mt-1 font-black text-[#262626] dark:text-white">{player.fullName}</div>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">Step</div>
              <div className="mt-1 font-black text-[#262626] dark:text-white">{titles[step]}</div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">2-3 screens total</div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="rounded-3xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="h-5 w-5" />
                  Confirm child details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300 flex gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Parent name</Label>
                    <Input value={parent.name} onChange={(e) => setParent((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Parent email</Label>
                    <Input value={parent.email} onChange={(e) => setParent((p) => ({ ...p, email: e.target.value }))} type="email" />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label>Parent phone (optional)</Label>
                    <Input value={parent.phone} onChange={(e) => setParent((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-semibold text-[#262626] dark:text-white">I accept joining Discover Natural Ability</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">If you decline, the player will remain inactive in Discover.</div>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={submitConfirm} disabled={busy || !parent.name.trim() || !parent.email.trim()} className="rounded-2xl">
                      Continue
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="rounded-3xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Complete subscription payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300 flex gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Payment is processed by Discover (not the academy). This screen is intentionally simple.
                  </p>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Note: This is currently implemented as an instant success placeholder until a payment gateway is connected.
                  </p>
                </div>

                <div className="flex justify-end">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={submitPayment} disabled={busy} className="rounded-2xl">
                      Confirm and activate
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/10">
              <CardContent className="p-8">
                <div className="flex items-start gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-6 w-6 text-emerald-700" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-black text-emerald-900">Activation complete</h2>
                    <p className="mt-1 text-sm text-emerald-900/80">
                      The player is now <b>Active – Awaiting Assessment</b>. Discover will schedule the assessment aligned with training days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
