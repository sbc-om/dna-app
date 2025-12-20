'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Filter,
  BellRing,
  Calendar,
  MessageSquare,
  UserPlus,
  Settings,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  BellOff,
  Clock,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';
import { cn } from '@/lib/utils';
import { 
  getNotificationsAction, 
  markAsReadAction, 
  markAllAsReadAction, 
  deleteNotificationAction 
} from '@/lib/actions/notificationActions';
import type { Notification } from '@/lib/db/repositories/notificationRepository';

interface NotificationsClientProps {
  dictionary: Dictionary;
  locale: Locale;
}

type NotificationType = 'info' | 'success' | 'warning' | 'error';
type NotificationCategory = 'all' | 'system' | 'appointments' | 'users' | 'messages';

export function NotificationsClient({ dictionary, locale }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(true);

  const rtf = useMemo(() => {
    // `Intl.RelativeTimeFormat` is supported in modern browsers.
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  }, [locale]);

  const t = dictionary.notificationsPage;

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const result = await getNotificationsAction();
      if (result.success && result.notifications) {
        // Convert timestamp strings to Date objects if needed
        const parsedNotifications = result.notifications.map(n => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(parsedNotifications as any);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: NotificationType, category: NotificationCategory) => {
    if (category === 'appointments') return Calendar;
    if (category === 'users') return UserPlus;
    if (category === 'messages') return MessageSquare;
    if (category === 'system') return Settings;
    
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'error': return XCircle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'warning': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'error': return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800';
      default: return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    }
  };

  const getNotificationBorderColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'border-l-emerald-500';
      case 'warning': return 'border-l-amber-500';
      case 'error': return 'border-l-rose-500';
      default: return 'border-l-orange-500';
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const diffMs = date.getTime() - Date.now();

    const diffMinutes = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
    return rtf.format(diffDays, 'day');
  };

  const categoryLabel = (category: NotificationCategory) => {
    switch (category) {
      case 'appointments':
        return t.category.appointments;
      case 'users':
        return t.category.users;
      case 'messages':
        return t.category.messages;
      case 'system':
        return t.category.system;
      default:
        return t.category.all;
    }
  };

  const typeLabel = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return t.type.success;
      case 'warning':
        return t.type.warning;
      case 'error':
        return t.type.error;
      default:
        return t.type.info;
    }
  };

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    
    await markAsReadAction(id);
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    
    await markAllAsReadAction();
  };

  const deleteNotification = async (id: string) => {
    // Optimistic update
    setNotifications(notifications.filter(n => n.id !== id));
    
    await deleteNotificationAction(id);
  };

  const clearReadNotifications = async () => {
    const readIds = notifications.filter(n => n.read).map(n => n.id);
    if (readIds.length === 0) return;

    // Optimistic update
    setNotifications(prev => prev.filter(n => !n.read));

    // Best-effort delete. If any fail, refresh list.
    const results = await Promise.allSettled(readIds.map(id => deleteNotificationAction(id)));
    const anyRejected = results.some(r => r.status === 'rejected');
    if (anyRejected) {
      await loadNotifications();
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const categoryMatch = activeTab === 'all' || n.category === activeTab;
    const readMatch = filter === 'all' || (filter === 'unread' ? !n.read : n.read);
    return categoryMatch && readMatch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.length - unreadCount;
  const todayCount = notifications.filter(n => {
    const diff = Date.now() - new Date(n.timestamp).getTime();
    return diff < 86400000;
  }).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="h-full min-h-0 flex flex-col gap-6 pb-6"
    >
      {/* Game-like background layer */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-950 via-indigo-950 to-purple-950 p-6 sm:p-8 shadow-2xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <motion.div
            className="absolute left-1/2 top-6 h-2 w-2 rounded-full bg-white/40"
            animate={{ y: [0, 10, 0], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute left-12 bottom-10 h-1.5 w-1.5 rounded-full bg-white/30"
            animate={{ y: [0, -12, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="relative">
                <motion.div
                  className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-lg ring-1 ring-white/15"
                  animate={unreadCount > 0 ? { rotate: [0, -8, 8, -6, 0] } : { rotate: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {unreadCount > 0 ? (
                    <BellRing className="h-8 w-8 text-orange-300" />
                  ) : (
                    <Bell className="h-8 w-8 text-orange-300" />
                  )}
                </motion.div>
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-rose-500 flex items-center justify-center text-white text-sm font-bold shadow-lg ring-4 ring-orange-400/30"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {unreadCount}
                      </motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
                  {t.title}
                  {unreadCount === 0 && <CheckCircle className="h-6 w-6 text-emerald-300" />}
                </h1>
                <p className="text-white/80 text-sm sm:text-base font-medium">
                  {unreadCount > 0
                    ? t.subtitleUnread.replace('{count}', String(unreadCount))
                    : t.subtitleAllRead}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 font-semibold shadow-md backdrop-blur-xl"
                    >
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {filter === 'all' ? t.filters.all : filter === 'unread' ? t.filters.unread : t.filters.read}
                      </span>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-orange-500" />
                    {t.filters.statusLabel}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilter('all')} className="gap-2">
                    <BellRing className="h-4 w-4" />
                    {t.filters.allNotifications}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('unread')} className="gap-2">
                    <Eye className="h-4 w-4" />
                    {t.filters.unreadOnly}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('read')} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {t.filters.readOnly}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {unreadCount > 0 && (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="sm"
                    onClick={markAllAsRead}
                    className="gap-2 bg-white text-slate-900 hover:bg-white/90 border border-white/20 font-semibold shadow-md"
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.actions.markAllRead}</span>
                  </Button>
                </motion.div>
              )}

              {readCount > 0 && (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="sm"
                    onClick={clearReadNotifications}
                    className="gap-2 bg-rose-500/15 hover:bg-rose-500/20 text-rose-200 border border-rose-500/20 font-semibold shadow-md"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.actions.clearRead}</span>
                  </Button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <motion.div variants={itemVariants} initial="hidden" animate="show">
              <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-orange-500/15 flex items-center justify-center border border-orange-500/20">
                    <Bell className="h-6 w-6 text-orange-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-white">{notifications.length}</p>
                    <p className="text-xs text-white/70 font-semibold">{t.stats.total}</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} initial="hidden" animate="show">
              <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-rose-500/15 flex items-center justify-center border border-rose-500/20">
                    <BellRing className="h-6 w-6 text-rose-200" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-white">{unreadCount}</p>
                    <p className="text-xs text-white/70 font-semibold">{t.stats.unread}</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} initial="hidden" animate="show">
              <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle className="h-6 w-6 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-white">{readCount}</p>
                    <p className="text-xs text-white/70 font-semibold">{t.stats.read}</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} initial="hidden" animate="show">
              <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/15 flex items-center justify-center border border-blue-500/20">
                    <Clock className="h-6 w-6 text-blue-200" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-white">{todayCount}</p>
                    <p className="text-xs text-white/70 font-semibold">{t.stats.today}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NotificationCategory)} className="flex-1 min-h-0 flex flex-col gap-6">
          <TabsList className="w-full sm:w-auto bg-white/60 dark:bg-white/5 border border-white/10 p-1.5 h-auto gap-2 backdrop-blur-xl">
            <TabsTrigger 
              value="all" 
              className="gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-lg rounded-xl px-4 py-2.5 transition-all text-gray-800 dark:text-gray-100 font-semibold"
            >
              <BellRing className="h-4 w-4" />
              <span>{t.tabs.all}</span>
              <Badge className="ml-1 bg-slate-900 text-white border-0 h-5 min-w-5 px-1.5">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="appointments" 
              className="gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-lg rounded-xl px-4 py-2.5 transition-all text-gray-800 dark:text-gray-100 font-semibold"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t.tabs.appointments}</span>
              <Badge className="ml-1 bg-white/70 text-slate-900 dark:bg-white/10 dark:text-white border-0 h-5 min-w-5 px-1.5">
                {notifications.filter(n => n.category === 'appointments').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-lg rounded-xl px-4 py-2.5 transition-all text-gray-800 dark:text-gray-100 font-semibold"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">{t.tabs.users}</span>
              <Badge className="ml-1 bg-white/70 text-slate-900 dark:bg-white/10 dark:text-white border-0 h-5 min-w-5 px-1.5">
                {notifications.filter(n => n.category === 'users').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-lg rounded-xl px-4 py-2.5 transition-all text-gray-800 dark:text-gray-100 font-semibold"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t.tabs.messages}</span>
              <Badge className="ml-1 bg-white/70 text-slate-900 dark:bg-white/10 dark:text-white border-0 h-5 min-w-5 px-1.5">
                {notifications.filter(n => n.category === 'messages').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="system" 
              className="gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-lg rounded-xl px-4 py-2.5 transition-all text-gray-800 dark:text-gray-100 font-semibold"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t.tabs.system}</span>
              <Badge className="ml-1 bg-white/70 text-slate-900 dark:bg-white/10 dark:text-white border-0 h-5 min-w-5 px-1.5">
                {notifications.filter(n => n.category === 'system').length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <OverlayScrollbarsComponent
            element="section"
            className="flex-1 min-h-0"
            options={{
              scrollbars: {
                theme: 'os-theme-dark',
                visibility: 'auto',
                autoHide: 'leave',
                autoHideDelay: 800,
              },
              overflow: {
                x: 'hidden',
                y: 'scroll',
              },
            }}
            defer
          >
            <TabsContent value={activeTab} className="mt-0">
              <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-10 text-center shadow-lg">
                    <div className="flex flex-col items-center gap-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg"
                      >
                        <Clock className="h-6 w-6" />
                      </motion.div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {dictionary.common.loading}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ) : filteredNotifications.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <Card className="border border-dashed border-slate-300/60 dark:border-white/15 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-16 text-center shadow-lg">
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <motion.div
                          className="h-24 w-24 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <BellOff className="h-12 w-12 text-orange-500" />
                        </motion.div>
                        <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-950">
                          <CheckCircle className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                          {filter === 'unread' ? t.empty.titleUnread : t.empty.titleNone}
                        </h3>
                        <p className="text-base text-slate-700 dark:text-white/75 max-w-md font-medium">
                          {filter === 'unread'
                            ? t.empty.descUnread
                            : activeTab === 'all'
                              ? t.empty.descNone
                              : t.empty.descCategory.replace('{category}', categoryLabel(activeTab))}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type, notification.category);
                  const isUnread = !notification.read;
                  
                  return (
                    <motion.div
                      key={notification.id}
                      variants={itemVariants}
                      whileHover={{ y: -4, scale: 1.01 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    >
                      <Card
                        className={cn(
                          "group relative overflow-hidden border",
                          isUnread
                            ? `border-l-[6px] ${getNotificationBorderColor(notification.type)} bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-lg border-orange-500/20`
                            : "bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-lg border-white/10 hover:border-orange-500/20"
                        )}
                      >
                        <div className="flex items-start gap-4 p-5 relative">
                        {/* Icon with enhanced styling */}
                          <motion.div
                            className={cn(
                              "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border transition-transform",
                              getNotificationColor(notification.type)
                            )}
                            whileHover={{ rotate: 6, scale: 1.06 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                          >
                            <Icon className="h-7 w-7" />
                          </motion.div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Title with unread indicator */}
                              <div className="flex items-center gap-2 mb-1">
                                {isUnread && (
                                  <div className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse shadow-lg shadow-orange-500/50"></div>
                                )}
                                <h3 className={cn(
                                  "font-bold text-gray-900 dark:text-white text-lg",
                                  isUnread && "text-orange-900 dark:text-orange-100"
                                )}>
                                  {notification.title}
                                </h3>
                              </div>
                              
                              {/* Message */}
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2 mb-3">
                                {notification.message}
                              </p>
                              
                              {/* Meta information */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                                  <Clock className="h-3 w-3" />
                                  {formatTimestamp(notification.timestamp)}
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs font-semibold border-2 px-2.5",
                                    notification.category === 'appointments' && "border-blue-300 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
                                    notification.category === 'users' && "border-purple-300 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
                                    notification.category === 'messages' && "border-green-300 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
                                    notification.category === 'system' && "border-gray-300 text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20"
                                  )}
                                >
                                  {categoryLabel(notification.category)}
                                </Badge>
                                {notification.type !== 'info' && (
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs font-semibold border-2 px-2.5",
                                      notification.type === 'success' && "border-emerald-300 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
                                      notification.type === 'warning' && "border-amber-300 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
                                      notification.type === 'error' && "border-rose-300 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20"
                                    )}
                                  >
                                    {typeLabel(notification.type)}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              {isUnread && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                                  title={t.actions.markAsRead}
                                >
                                  <CheckCheck className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-all text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                title={t.actions.delete}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Action button */}
                          {notification.actionUrl && (
                            <Link href={notification.actionUrl} className="inline-block">
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => {
                                  if (!notification.read) {
                                    markAsRead(notification.id);
                                  }
                                }}
                                className="mt-3 p-0 h-auto text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-semibold group/btn flex items-center gap-1.5"
                              >
                                <span>{t.actions.viewDetails}</span>
                                <ExternalLink className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Bottom accent line for unread */}
                      {isUnread && (
                        <div className="h-1 bg-linear-to-r from-transparent via-orange-500 to-transparent"></div>
                      )}
                      </Card>
                    </motion.div>
                  );
                })}
                </motion.div>
              )}
              </AnimatePresence>
            </TabsContent>
          </OverlayScrollbarsComponent>
        </Tabs>
    </motion.div>
  );
}
