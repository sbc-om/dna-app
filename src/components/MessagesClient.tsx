'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Users as UsersIcon, Send, Plus, Search, X, Smile, Paperclip, MoreVertical, ArrowLeft, Phone, Video, CheckCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';
import type { AuthUser } from '@/lib/auth/auth';
import type { User } from '@/lib/db/repositories/userRepository';
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';
import {
  sendMessageAction,
  getConversationAction,
  getUserConversationsAction,
  getGroupMessagesAction,
  getUserGroupsAction,
  getAllGroupsAction,
  createGroupAction,
  markMessageAsReadAction,
} from '@/lib/actions/messageActions';
import type { Message, MessageGroup } from '@/lib/db/repositories/messageRepository';
import { useConfirm } from '@/components/ConfirmDialog';
import type { RolePermission } from '@/lib/db/repositories/rolePermissionRepository';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

interface MessagesClientProps {
  dictionary: Dictionary;
  locale: Locale;
  currentUser: AuthUser;
  allUsers: User[];
  permissions: RolePermission['permissions'];
}

type ConversationListItem = {
  userId: string;
  lastMessage: Message;
  user?: User | null;
};

export function MessagesClient({ dictionary, locale, currentUser, allUsers, permissions }: MessagesClientProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [groups, setGroups] = useState<MessageGroup[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<{ type: 'user' | 'group'; id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [showUserSelectDialog, setShowUserSelectDialog] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  const isAdmin = currentUser.role === 'admin';
  const canSelectRecipients = currentUser.role === 'admin' || currentUser.role === 'manager';

  const loadData = useCallback(async () => {
    try {
      // Load conversations
      const convResult = await getUserConversationsAction();
      if (convResult.success) {
        setConversations((convResult.conversations || []) as ConversationListItem[]);
      }

      // Load groups
      const groupsResult = isAdmin ? await getAllGroupsAction() : await getUserGroupsAction();
      if (groupsResult.success) {
        setGroups(groupsResult.groups || []);
      }
    } catch (error) {
      console.error('Load data error:', error);
    }
  }, [isAdmin]);

  const loadMessages = useCallback(async (conversation: { type: 'user' | 'group'; id: string; name: string }) => {
    try {
      if (conversation.type === 'user') {
        const result = await getConversationAction(conversation.id);
        if (result.success) {
          setMessages(result.messages || []);
          // Mark as read
          result.messages?.forEach((msg: Message) => {
            if (msg.recipientId === currentUser.id && !msg.readBy.includes(currentUser.id)) {
              markMessageAsReadAction(msg.id);
            }
          });
        }
      } else {
        const result = await getGroupMessagesAction(conversation.id);
        if (result.success) {
          setMessages(result.messages || []);
        }
      }
    } catch (error) {
      console.error('Load messages error:', error);
    }
  }, [currentUser.id]);

  // Load conversations and groups
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-scroll to bottom when messages change (but not on first mount)
  useEffect(() => {
    if (messages.length > 0) {
      // Use instant scroll to prevent layout shift
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages]);

  // Auto-refresh messages every 5 seconds
  useEffect(() => {
    if (selectedConversation) {
      const interval = setInterval(() => {
        loadMessages(selectedConversation);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation, loadMessages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show notification helper
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSelectConversation = (conversation: { type: 'user' | 'group'; id: string; name: string }) => {
    setSelectedConversation(conversation);
    loadMessages(conversation);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    setLoading(true);
    try {
      const result = await sendMessageAction({
        recipientId: selectedConversation.type === 'user' ? selectedConversation.id : undefined,
        groupId: selectedConversation.type === 'group' ? selectedConversation.id : undefined,
        content: messageText,
        locale,
      });

      if (result.success) {
        setMessageText('');
        setShowEmojiPicker(false);
        loadMessages(selectedConversation);
        loadData(); // Refresh conversation list
        showNotification(dictionary.messages?.messageSent || 'Message sent successfully', 'success');
      } else {
        showNotification(result.error || 'Failed to send message', 'error');
      }
    } catch (error) {
      console.error('Send message error:', error);
      showNotification('Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText((prev) => prev + emojiData.emoji);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      await confirm({
        title: dictionary.common.error,
        description: 'Group name and members are required',
        confirmText: 'OK',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createGroupAction({
        name: groupName,
        createdBy: currentUser.id,
        members: [...selectedMembers, currentUser.id],
      });

      if (result.success) {
        await confirm({
          title: dictionary.common.success,
          description: dictionary.messages?.groupCreated || 'Group created successfully',
          confirmText: 'OK',
        });
        setShowNewGroupDialog(false);
        setGroupName('');
        setSelectedMembers([]);
        loadData();
      } else {
        await confirm({
          title: dictionary.common.error,
          description: result.error || 'Failed to create group',
          confirmText: 'OK',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Create group error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setShowUserSelectDialog(false);
      setShowMobileSidebar(false);
      handleSelectConversation({ type: 'user', id: user.id, name: user.fullName || user.email });
    }
  };

  const handleSelectConversationMobile = (conversation: { type: 'user' | 'group'; id: string; name: string }) => {
    setShowMobileSidebar(false);
    handleSelectConversation(conversation);
    // Prevent scroll jump on mobile
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 0);
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = allUsers.filter(user => 
    user.id !== currentUser.id &&
    (user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="h-full"
    >
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in slide-in-from-top-5 ${
          notification.type === 'success' 
            ? 'bg-green-500' 
            : 'bg-red-500'
        } text-white rounded-xl shadow-2xl p-4 flex items-center gap-3`}>
          {notification.type === 'success' ? (
            <CheckCheck className="h-5 w-5 shrink-0" />
          ) : (
            <X className="h-5 w-5 shrink-0" />
          )}
          <p className="flex-1 font-medium">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="shrink-0 hover:bg-white/20 rounded-lg p-1 transition-colors" aria-label="Close notification">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="h-full min-h-0 flex flex-col bg-gray-50 dark:bg-[#1a1a1a] overflow-hidden">
        {/* Header - Hidden on mobile when chat is open */}
        <div className={`${!showMobileSidebar && selectedConversation ? 'hidden lg:block' : 'block'} p-4 sm:p-6 border-b bg-white dark:bg-[#262626] shadow-sm`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#262626] dark:text-white truncate">
                {dictionary.messages?.title || 'Messages'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                {isAdmin
                  ? (dictionary.messages?.subtitleAdmin || 'Send messages to users and manage groups')
                  : (dictionary.messages?.subtitleUser || 'Your conversations')}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {canSelectRecipients && (
                <Button 
                  onClick={() => setShowUserSelectDialog(true)} 
                  size="sm"
                  className="bg-[#FF5F02] hover:bg-[#e55502] shadow-md active:scale-95 transition-all"
                >
                  <MessageSquare className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{dictionary.messages?.newMessage || 'New Message'}</span>
                </Button>
              )}
              {isAdmin && permissions.canCreateGroup && (
                <Button 
                  onClick={() => setShowNewGroupDialog(true)} 
                  size="sm"
                  variant="outline"
                  className="border-2 active:scale-95 transition-all hidden sm:flex"
                >
                  <UsersIcon className="mr-2 h-4 w-4" />
                  {dictionary.messages?.newGroup || 'New Group'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Sidebar - Conversations List */}
          <div className={`${
            showMobileSidebar ? 'flex' : 'hidden lg:flex'
          } w-full lg:w-80 lg:max-w-[320px] border-r bg-white dark:bg-[#000000] overflow-hidden flex-col min-h-0`}>
            <Tabs defaultValue="conversations" className="w-full flex flex-col flex-1 overflow-hidden">
              <div className="px-3 pt-3 pb-2">
                <TabsList className="w-full grid grid-cols-2 bg-gray-100 dark:bg-[#262626] rounded-xl h-11 p-1">
                  <TabsTrigger value="conversations" className="data-[state=active]:bg-[#FF5F02] data-[state=active]:text-white rounded-lg text-sm font-medium">
                    {dictionary.messages?.conversations || 'Conversations'}
                  </TabsTrigger>
                  <TabsTrigger value="groups" className="data-[state=active]:bg-[#FF5F02] data-[state=active]:text-white rounded-lg text-sm font-medium">
                    {dictionary.messages?.groups || 'Groups'}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="conversations" className="flex-1 min-h-0 p-0 m-0">
                <OverlayScrollbarsComponent
                  element="div"
                  className="h-full px-3 pb-3"
                  options={{
                    scrollbars: {
                      autoHide: 'move',
                      autoHideDelay: 800,
                      theme: 'os-theme-dark',
                      visibility: 'auto',
                    },
                    overflow: { x: 'hidden', y: 'scroll' },
                  }}
                  defer
                >
                  <div className="space-y-2">
                    {conversations.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>{dictionary.messages?.noConversations || 'No conversations yet'}</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <button
                          key={conv.userId}
                          onClick={() => handleSelectConversationMobile({ type: 'user', id: conv.userId, name: conv.user?.fullName || conv.user?.email || '' })}
                          className={`w-full p-3 sm:p-4 rounded-xl text-left transition-all active:scale-95 overflow-hidden ${
                            selectedConversation?.id === conv.userId && selectedConversation?.type === 'user'
                              ? 'bg-linear-to-r from-[#FF5F02] to-[#ff7b33] text-white shadow-lg'
                              : 'hover:bg-gray-50 dark:hover:bg-[#262626] hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              {conv.user?.profilePicture ? (
                                <img
                                  src={conv.user.profilePicture}
                                  alt={conv.user.fullName || conv.user.email}
                                  className={`h-12 w-12 rounded-xl object-cover shadow-md ${
                                    selectedConversation?.id === conv.userId && selectedConversation?.type === 'user'
                                      ? 'border-2 border-white'
                                      : 'border-2 border-orange-500'
                                  }`}
                                />
                              ) : (
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md ${
                                  selectedConversation?.id === conv.userId && selectedConversation?.type === 'user'
                                    ? 'bg-white/20'
                                    : 'bg-orange-500'
                                }`}>
                                  {conv.user?.fullName?.[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                              {/* Online indicator */}
                              <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-white dark:border-[#000000] rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold truncate">{conv.user?.fullName || conv.user?.email}</p>
                                {conv.lastMessage && (
                                  <span className="text-xs opacity-75 shrink-0 ms-2">
                                    {new Date(conv.lastMessage.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm opacity-75 truncate">{conv.lastMessage?.content || (dictionary.messages?.startConversation || 'Start a conversation')}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </OverlayScrollbarsComponent>
              </TabsContent>

              <TabsContent value="groups" className="flex-1 min-h-0 p-0 m-0">
                <OverlayScrollbarsComponent
                  element="div"
                  className="h-full px-3 pb-3"
                  options={{
                    scrollbars: {
                      autoHide: 'move',
                      autoHideDelay: 800,
                      theme: 'os-theme-dark',
                      visibility: 'auto',
                    },
                    overflow: { x: 'hidden', y: 'scroll' },
                  }}
                  defer
                >
                  <div className="space-y-2">
                    {groups.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>{dictionary.messages?.noGroups || 'No groups yet'}</p>
                        {permissions.canCreateGroup && (
                          <Button
                            onClick={() => setShowNewGroupDialog(true)}
                            size="sm"
                            className="mt-4 bg-[#FF5F02] hover:bg-[#e55502]"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {dictionary.messages?.newGroup || 'New Group'}
                          </Button>
                        )}
                      </div>
                    ) : (
                      groups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => handleSelectConversationMobile({ type: 'group', id: group.id, name: group.name })}
                          className={`w-full p-3 sm:p-4 rounded-xl text-left transition-all active:scale-95 overflow-hidden ${
                            selectedConversation?.id === group.id && selectedConversation?.type === 'group'
                              ? 'bg-linear-to-r from-[#FF5F02] to-[#ff7b33] text-white shadow-lg'
                              : 'hover:bg-gray-50 dark:hover:bg-[#262626] hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-md ${
                              selectedConversation?.id === group.id && selectedConversation?.type === 'group'
                                ? 'bg-white/20 text-white'
                                : 'bg-linear-to-br from-blue-500 to-blue-600 text-white'
                            }`}>
                              <UsersIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{group.name}</p>
                              <p className="text-sm opacity-75">{group.members.length} {dictionary.messages?.members || 'members'}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </OverlayScrollbarsComponent>
              </TabsContent>
            </Tabs>
          </div>

          {/* Chat Area */}
          <div className={`${
            !showMobileSidebar && selectedConversation ? 'flex' : 'hidden lg:flex'
          } flex-1 flex-col bg-gray-50 dark:bg-[#1a1a1a]`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3 sm:p-4 border-b bg-white dark:bg-[#262626] flex items-center gap-3 shadow-sm">
                  {/* Back button for mobile */}
                  <button
                    onClick={() => setShowMobileSidebar(true)}
                    className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg active:scale-95 transition-all"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  
                  <div className="relative shrink-0">
                    {selectedConversation.type === 'group' ? (
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md">
                        <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    ) : (
                      <>
                        {(() => {
                          const chatUser = allUsers.find(u => u.id === selectedConversation.id);
                          return chatUser?.profilePicture ? (
                            <img
                              src={chatUser.profilePicture}
                              alt={selectedConversation.name}
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-cover border-2 border-orange-500 shadow-md"
                            />
                          ) : (
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                              {selectedConversation.name[0]?.toUpperCase()}
                            </div>
                          );
                        })()}
                        <div className="absolute bottom-0 right-0 h-3 w-3 sm:h-3.5 sm:w-3.5 bg-green-500 border-2 border-white dark:border-[#262626] rounded-full"></div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg truncate">{selectedConversation.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                      {selectedConversation.type === 'group' ? (
                        <><UsersIcon className="h-3 w-3" /> {dictionary.messages?.groupChat || 'Group chat'}</>
                      ) : (
                        <><span className="h-2 w-2 bg-green-500 rounded-full"></span> {dictionary.messages?.online || 'Online'}</>
                      )}
                    </p>
                  </div>

                  <div className="flex gap-1 sm:gap-2 shrink-0">
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hidden sm:flex">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hidden sm:flex">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <OverlayScrollbarsComponent
                  element="section"
                  className="flex-1 min-h-0"
                  options={{
                    scrollbars: {
                      autoHide: 'move',
                      autoHideDelay: 800,
                      theme: 'os-theme-dark',
                      visibility: 'auto',
                    },
                    overflow: { x: 'hidden', y: 'scroll' },
                  }}
                  defer
                >
                  <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-full">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                          <p className="text-sm">{dictionary.messages?.noMessages || 'No messages yet'}</p>
                          <p className="text-xs mt-2">{dictionary.messages?.startConversationNow || 'Start the conversation now'}</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const isOwn = message.senderId === currentUser.id;
                        const showDate = index === 0 ||
                          new Date(messages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();

                        return (
                          <div key={message.id}>
                            {/* Date separator */}
                            {showDate && (
                              <div className="flex items-center justify-center my-4">
                                <div className="bg-gray-200 dark:bg-[#262626] px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-400">
                                  {new Date(message.createdAt).toLocaleDateString(locale, {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>
                            )}

                            <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              {!isOwn && selectedConversation.type === 'user' && (
                                <>
                                  {(() => {
                                    const sender = allUsers.find(u => u.id === message.senderId);
                                    return sender?.profilePicture ? (
                                      <img
                                        src={sender.profilePicture}
                                        alt={sender.fullName || sender.username}
                                        className="h-8 w-8 rounded-lg object-cover border-2 border-gray-300 shrink-0"
                                      />
                                    ) : (
                                      <div className="h-8 w-8 rounded-lg bg-gray-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {selectedConversation.name[0]?.toUpperCase()}
                                      </div>
                                    );
                                  })()}
                                </>
                              )}
                              {!isOwn && selectedConversation.type === 'group' && (
                                <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {selectedConversation.name[0]?.toUpperCase()}
                                </div>
                              )}

                              <div
                                className={
                                  `relative group max-w-[85%] sm:max-w-[70%] rounded-2xl ${
                                    isOwn ? 'rounded-br-md' : 'rounded-bl-md'
                                  } p-3 sm:p-4 shadow-lg transition-all ` +
                                  (isOwn
                                    ? 'bg-linear-to-br from-[#FF5F02] via-[#ff6a1a] to-[#ff7b33] text-white shadow-orange-500/20 ring-1 ring-white/10'
                                    : 'bg-white/95 text-gray-900 border border-black/10 shadow-black/5 dark:bg-[#0f0f10]/95 dark:text-white dark:border-white/10 dark:shadow-black/30')
                                }
                              >
                                {/* Bubble tail */}
                                <span
                                  aria-hidden="true"
                                  className={
                                    `pointer-events-none absolute bottom-3 h-3 w-3 rotate-45 ` +
                                    (isOwn
                                      ? '-right-1.5 bg-[#ff7b33]'
                                      : '-left-1.5 bg-white/95 dark:bg-[#0f0f10]/95')
                                  }
                                />

                                <p className="wrap-break-word text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                                  {message.content}
                                </p>
                                <div className={`flex items-center gap-1.5 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                  <p className={`text-xs ${isOwn ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {new Date(message.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  {isOwn && (
                                    <CheckCheck className={`h-3.5 w-3.5 ${message.readBy.length > 1 ? 'text-blue-200' : 'text-white/60'}`} />
                                  )}
                                </div>
                              </div>

                              {isOwn && (
                                <>
                                  {currentUser.profilePicture ? (
                                    <img
                                      src={currentUser.profilePicture}
                                      alt={currentUser.fullName || currentUser.username}
                                      className="h-8 w-8 rounded-lg object-cover border-2 border-orange-500 shrink-0"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                      {currentUser.fullName?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </OverlayScrollbarsComponent>

                {/* Message Input */}
                <div className="p-3 sm:p-4 border-t bg-white dark:bg-[#262626] relative">
                  {/* Emoji Picker - Positioned above emoji button */}
                  {showEmojiPicker && (
                    <div 
                      ref={emojiPickerRef} 
                      className="fixed bottom-[140px] left-2 right-2 sm:absolute sm:bottom-full sm:left-3 sm:right-auto sm:mb-2 z-50 shadow-2xl rounded-xl overflow-hidden max-w-[320px] mx-auto sm:mx-0"
                    >
                      <EmojiPicker 
                        onEmojiClick={handleEmojiClick}
                        theme={Theme.LIGHT}
                        searchPlaceholder={dictionary.messages?.searchEmoji || 'Search emojis...'}
                        height={350}
                        width="100%"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-end gap-2">
                    {/* Emoji Button */}
                    <Button
                      ref={emojiButtonRef}
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="h-10 w-10 p-0 shrink-0 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] active:scale-95 transition-all"
                    >
                      <Smile className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </Button>

                    {/* Attachment Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-10 w-10 p-0 shrink-0 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] active:scale-95 transition-all hidden sm:flex"
                    >
                      <Paperclip className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </Button>
                    
                    {/* Message Input */}
                    <div className="flex-1 relative">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={dictionary.messages?.typeMessage || 'Type your message...'}
                        className="pr-4 h-10 sm:h-11 rounded-full border-2 focus:border-[#FF5F02] transition-colors bg-gray-50 dark:bg-[#1a1a1a]"
                      />
                    </div>
                    
                    {/* Send Button */}
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={loading || !messageText.trim()} 
                      size="sm"
                      className="h-10 w-10 sm:h-11 sm:w-11 p-0 rounded-full bg-linear-to-br from-[#FF5F02] to-[#ff7b33] hover:from-[#e55502] hover:to-[#ff5f02] shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Clock className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
                <div className="text-center max-w-md">
                  <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 dark:bg-[#262626] mb-6">
                    <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 opacity-50" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900 dark:text-white">
                    {dictionary.messages?.startConversation || 'Start a conversation'}
                  </h3>
                  <p className="text-sm sm:text-base mb-6">
                    {dictionary.messages?.selectUser || 'Select a conversation to start chatting'}
                  </p>
                  {canSelectRecipients && (
                    <Button
                      onClick={() => setShowUserSelectDialog(true)}
                      className="bg-[#FF5F02] hover:bg-[#e55502] shadow-md"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {dictionary.messages?.newMessage || 'New Message'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Group Dialog */}
      <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col gap-0 p-0">
          <DialogHeader className="p-4 sm:p-6 border-b">
            <DialogTitle className="text-xl sm:text-2xl">{dictionary.messages?.createGroup || 'Create Group'}</DialogTitle>
            <DialogDescription className="text-sm">
              {dictionary.messages?.groupDialogHint || 'Create a group to send messages to multiple users at once'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-y-auto p-4 sm:p-6">
            <div>
              <Label className="text-sm font-semibold">{dictionary.messages?.groupName || 'Group Name'}</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={dictionary.messages?.enterGroupName || 'Enter group name'}
                className="mt-2 h-11 border-2 focus:border-[#FF5F02]"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">{dictionary.messages?.selectMembers || 'Select Members'}</Label>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto rounded-lg border p-2">
                {allUsers.filter(u => u.id !== currentUser.id).map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#262626] rounded-lg transition-colors active:scale-95">
                    <Checkbox
                      checked={selectedMembers.includes(user.id)}
                      onCheckedChange={() => toggleMemberSelection(user.id)}
                      className="data-[state=checked]:bg-[#FF5F02] data-[state=checked]:border-[#FF5F02]"
                    />
                    <div className="h-10 w-10 rounded-full bg-linear-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {user.fullName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.fullName || user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.role}</p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedMembers.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {(dictionary.messages?.membersSelected || '{count} members selected').replace('{count}', String(selectedMembers.length))}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-6 border-t gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowNewGroupDialog(false)}
              className="flex-1 sm:flex-none border-2 active:scale-95 transition-all"
            >
              {dictionary.common.cancel}
            </Button>
            <Button 
              onClick={handleCreateGroup} 
              disabled={loading || !groupName.trim() || selectedMembers.length === 0} 
              className="flex-1 sm:flex-none bg-[#FF5F02] hover:bg-[#e55502] active:scale-95 transition-all"
            >
              {loading ? (
                <><Clock className="mr-2 h-4 w-4 animate-spin" /> {dictionary.common.loading}</>
              ) : (
                <><UsersIcon className="mr-2 h-4 w-4" /> {dictionary.messages?.createGroup}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Select Dialog */}
      <Dialog open={showUserSelectDialog} onOpenChange={setShowUserSelectDialog}>
        <DialogContent className="max-w-md max-h-[90vh] sm:max-h-[80vh] flex flex-col gap-0 p-0">
          <DialogHeader className="p-4 sm:p-6 border-b">
            <DialogTitle className="text-xl sm:text-2xl">{dictionary.messages?.selectRecipient || 'Select Recipient'}</DialogTitle>
            <DialogDescription className="text-sm">
              {dictionary.messages?.selectUser || 'Select a user to start chatting'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="sticky top-0 bg-white dark:bg-[#262626] pb-3 z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={dictionary.messages?.searchUsers || 'Search users...'}
                  className="pl-10 h-11 border-2 focus:border-[#FF5F02]"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{dictionary.messages?.noUsersFound || 'No users found'}</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    className="w-full p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-xl text-left transition-all flex items-center gap-3 active:scale-95 border border-transparent hover:border-[#FF5F02]/20"
                  >
                    <div className="h-12 w-12 rounded-full bg-linear-to-br from-[#FF5F02] to-[#ff7b33] flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                      {user.fullName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{user.fullName || user.email}</p>
                      <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                    </div>
                    <MessageSquare className="h-5 w-5 text-[#FF5F02] shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
    </motion.div>
  );
}
