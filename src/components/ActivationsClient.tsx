'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, ExternalLink, RefreshCcw, Users2, Link2, Search, Wand2 } from 'lucide-react';
import type { Locale } from '@/config/i18n';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { PlayerActivation } from '@/lib/db/repositories/playerActivationRepository';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPlayerActivationLinkAction, listAcademyActivationsAction } from '@/lib/actions/playerActivationActions';

type PlayerSummary = {
  id: string;
  displayName: string;
  fullName: string | null;
  username: string | null;
  email: string | null;
  dnaActivationStatus: string | null;
  ageCategory: string | null;
};

type Props = {
  locale: Locale;
  dictionary: Dictionary;
  initialActivations: PlayerActivation[];
  initialPlayers: PlayerSummary[];
};

function statusBadge(status: PlayerActivation['status']) {
  switch (status) {
    case 'pending':
      return <Badge className="rounded-full bg-orange-600 text-white">Pending</Badge>;
    case 'confirmed':
      return <Badge className="rounded-full bg-blue-600 text-white">Confirmed</Badge>;
    case 'paid':
      return <Badge className="rounded-full bg-purple-600 text-white">Paid</Badge>;
    case 'activated':
      return <Badge className="rounded-full bg-emerald-600 text-white">Activated</Badge>;
    case 'declined':
      return <Badge className="rounded-full bg-gray-600 text-white">Declined</Badge>;
    case 'expired':
      return <Badge className="rounded-full bg-red-700 text-white">Expired</Badge>;
  }
}

export function ActivationsClient({ locale, dictionary, initialActivations, initialPlayers }: Props) {
  const [activations, setActivations] = useState<PlayerActivation[]>(initialActivations);
  const [players] = useState<PlayerSummary[]>(initialPlayers);
  const [busy, setBusy] = useState(false);
  const [playerQuery, setPlayerQuery] = useState('');

  const counts = useMemo(() => {
    const by: Record<string, number> = {};
    for (const a of activations) by[a.status] = (by[a.status] ?? 0) + 1;
    return by;
  }, [activations]);

  const activationByPlayerId = useMemo(() => {
    const map = new Map<string, PlayerActivation>();
    for (const a of activations) map.set(a.playerId, a);
    return map;
  }, [activations]);

  const filteredPlayers = useMemo(() => {
    const q = playerQuery.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => {
      const hay = `${p.displayName} ${p.fullName ?? ''} ${p.username ?? ''} ${p.email ?? ''} ${p.ageCategory ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [players, playerQuery]);

  const refresh = async () => {
    setBusy(true);
    try {
      const res = await listAcademyActivationsAction({ locale });
      if (res.success) setActivations(res.activations);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  const rotateLink = async (playerId: string) => {
    setBusy(true);
    try {
      const res = await createPlayerActivationLinkAction({ locale, playerId });
      if (!res.success) {
        alert(res.error || dictionary.common?.error || 'Failed');
        return;
      }
      await copy(`${window.location.origin}${res.url}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative overflow-hidden rounded-3xl border-2 border-white/15 bg-white/70 dark:bg-white/5 dark:border-white/10 backdrop-blur-xl p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.12),transparent_60%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#262626] dark:text-white">
              {dictionary.nav?.activations ?? 'Activations'}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Generate academy-specific links. Parents confirm details, pay, then the player becomes Active – Awaiting Assessment.
            </p>
          </div>
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.6 }}
            className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"
          >
            <Users2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </motion.div>
        </div>

        <div className="relative mt-4 flex flex-wrap gap-2">
          {Object.entries(counts).map(([k, v]) => (
            <Badge key={k} variant="secondary" className="rounded-full">
              {k}: {v}
            </Badge>
          ))}
        </div>

        <div className="relative mt-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
            <Button onClick={refresh} disabled={busy} className="rounded-2xl" variant="outline">
              <RefreshCcw className="h-4 w-4 mr-2" />
              {dictionary.common?.refresh ?? 'Refresh'}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <Card className="rounded-3xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-white/5 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Create links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={playerQuery}
              onChange={(e) => setPlayerQuery(e.target.value)}
              placeholder={dictionary.common?.search ?? 'Search'}
              className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">No players found.</div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filteredPlayers.slice(0, 40).map((p) => {
                  const a = activationByPlayerId.get(p.id);
                  const url = a ? `/${locale}/activate/${a.token}` : null;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-black text-[#262626] dark:text-white truncate">{p.displayName}</div>
                            {a ? statusBadge(a.status) : (
                              <Badge className="rounded-full" variant="secondary">No link</Badge>
                            )}
                            {p.ageCategory ? (
                              <Badge className="rounded-full" variant="outline">{p.ageCategory}</Badge>
                            ) : null}
                          </div>

                          {url ? (
                            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 break-all">{url}</div>
                          ) : (
                            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              Generate a link for this player.
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 shrink-0 flex-wrap">
                          {url ? (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl"
                                onClick={async () => copy(`${window.location.origin}${url}`)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </Button>
                            </motion.div>
                          ) : null}

                          {url ? (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button asChild className="rounded-2xl">
                                <Link href={url} target="_blank">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open
                                </Link>
                              </Button>
                            </motion.div>
                          ) : null}

                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              type="button"
                              variant={a ? 'outline' : 'default'}
                              className="rounded-2xl"
                              disabled={busy}
                              onClick={() => rotateLink(p.id)}
                            >
                              <RefreshCcw className="h-4 w-4 mr-2" />
                              {a ? 'Rotate' : 'Create'}
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {filteredPlayers.length > 40 ? (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Showing first 40 players. Refine your search to find the rest.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-white/5 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activations.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">No activations yet.</div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {activations.map((a) => {
                  const url = `/${locale}/activate/${a.token}`;
                  return (
                    <motion.div
                      key={`${a.academyId}:${a.playerId}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-black text-[#262626] dark:text-white truncate">
                              {a.playerDisplayName || a.playerId}
                            </div>
                            {statusBadge(a.status)}
                          </div>
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 break-all">{url}</div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-2xl"
                              onClick={async () => copy(`${window.location.origin}${url}`)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                          </motion.div>

                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button asChild className="rounded-2xl">
                              <Link href={url} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open
                              </Link>
                            </Button>
                          </motion.div>

                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-2xl"
                              disabled={busy}
                              onClick={() => rotateLink(a.playerId)}
                            >
                              <RefreshCcw className="h-4 w-4 mr-2" />
                              Rotate
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
