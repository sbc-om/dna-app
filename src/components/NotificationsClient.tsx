'use client';

import { useState, useEffect } from 'react';
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
  XCircle
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
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { cn } from '@/lib/utils';
import { 
  getNotificationsAction, 
  markAsReadAction, 
  markAllAsReadAction, 
  deleteNotificationAction 
} from '@/lib/actions/notificationActions';
import { Notification } from '@/lib/db/repositories/notificationRepository';

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
      case 'success': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'warning': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86301600);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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

  const filteredNotifications = notifications.filter(n => {
    const categoryMatch = activeTab === 'all' || n.category === activeTab;
    const readMatch = filter === 'all' || (filter === 'unread' ? !n.read : n.read);
    return categoryMatch && readMatch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Bell className="h-7 w-7 text-white" />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                  {unreadCount}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Notifications
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filter === 'all' ? 'All' : filter === 'unread' ? 'Unread' : 'Read'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  All Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('unread')}>
                  Unread Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('read')}>
                  Read Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </Button>
            )}

            {notifications.filter(n => n.read).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {}} // Not implemented yet
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Clear Read
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NotificationCategory)}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all" className="gap-2">
              <BellRing className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="appointments" className="gap-2">
              <Calendar className="h-4 w-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredNotifications.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      No notifications
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      You're all caught up! Check back later for new updates.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type, notification.category);
                  return (
                    <Card
                      key={notification.id}
                      className={cn(
                        "group relative overflow-hidden transition-all duration-200 hover:shadow-lg",
                        !notification.read && "border-l-4 border-l-purple-500 bg-purple-50/30 dark:bg-purple-900/10"
                      )}
                    >
                      <div className="flex items-start gap-4 p-4">
                        <div className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                          getNotificationColor(notification.type)
                        )}>
                          <Icon className="h-6 w-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {notification.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {notification.category}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Mark as read"
                                >
                                  <CheckCheck className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {notification.actionUrl && (
                            <Button
                              variant="link"
                              size="sm"
                              className="mt-2 p-0 h-auto text-purple-600 hover:text-purple-700"
                            >
                              View Details →
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
