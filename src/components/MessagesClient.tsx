'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Users as UsersIcon, Send, Plus, Search, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { AuthUser } from '@/lib/auth/auth';
import { User } from '@/lib/db/repositories/userRepository';
import {
  sendMessageAction,
  getConversationAction,
  getUserConversationsAction,
  getGroupMessagesAction,
  getUserGroupsAction,
  getAllGroupsAction,
  createGroupAction,
  updateGroupAction,
  markMessageAsReadAction,
} from '@/lib/actions/messageActions';
import { Message, MessageGroup } from '@/lib/db/repositories/messageRepository';
import { useConfirm } from '@/components/ConfirmDialog';

interface MessagesClientProps {
  dictionary: Dictionary;
  locale: Locale;
  currentUser: AuthUser;
  allUsers: User[];
}

export function MessagesClient({ dictionary, locale, currentUser, allUsers }: MessagesClientProps) {
  const [conversations, setConversations] = useState<any[]>([]);
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  const isAdmin = currentUser.role === 'admin';

  // Load conversations and groups
  useEffect(() => {
    loadData();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-refresh messages every 5 seconds
  useEffect(() => {
    if (selectedConversation) {
      const interval = setInterval(() => {
        loadMessages(selectedConversation);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const loadData = async () => {
    try {
      // Load conversations
      const convResult = await getUserConversationsAction();
      if (convResult.success) {
        setConversations(convResult.conversations || []);
      }

      // Load groups
      const groupsResult = isAdmin ? await getAllGroupsAction() : await getUserGroupsAction();
      if (groupsResult.success) {
        setGroups(groupsResult.groups || []);
      }
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const loadMessages = async (conversation: { type: 'user' | 'group'; id: string; name: string }) => {
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
      });

      if (result.success) {
        setMessageText('');
        loadMessages(selectedConversation);
        loadData(); // Refresh conversation list
      } else {
        await confirm({
          title: dictionary.common.error,
          description: result.error || 'Failed to send message',
          confirmText: 'OK',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setLoading(false);
    }
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
      handleSelectConversation({ type: 'user', id: user.id, name: user.fullName || user.email });
    }
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
    <>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1E3A8A]">
                {dictionary.messages?.title || 'Messages'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isAdmin ? 'Send messages to users and manage groups' : 'Your conversations'}
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button onClick={() => setShowUserSelectDialog(true)} className="bg-[#30B2D2] hover:bg-[#1E3A8A]">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {dictionary.messages?.newMessage || 'New Message'}
                </Button>
                <Button onClick={() => setShowNewGroupDialog(true)} variant="outline">
                  <UsersIcon className="mr-2 h-4 w-4" />
                  {dictionary.messages?.newGroup || 'New Group'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Conversations List */}
          <div className="w-80 border-r bg-gray-50 overflow-y-auto">
            <Tabs defaultValue="conversations" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="conversations">{dictionary.messages?.conversations || 'Conversations'}</TabsTrigger>
                <TabsTrigger value="groups">{dictionary.messages?.groups || 'Groups'}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="conversations" className="space-y-1 p-2">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {dictionary.messages?.noConversations || 'No conversations yet'}
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.userId}
                      onClick={() => handleSelectConversation({ type: 'user', id: conv.userId, name: conv.user?.fullName || conv.user?.email || '' })}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedConversation?.id === conv.userId && selectedConversation?.type === 'user'
                          ? 'bg-[#30B2D2] text-white'
                          : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold">
                          {conv.user?.fullName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{conv.user?.fullName || conv.user?.email}</p>
                          <p className="text-sm opacity-75 truncate">{conv.lastMessage?.content}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </TabsContent>

              <TabsContent value="groups" className="space-y-1 p-2">
                {groups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No groups yet
                  </div>
                ) : (
                  groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => handleSelectConversation({ type: 'group', id: group.id, name: group.name })}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedConversation?.id === group.id && selectedConversation?.type === 'group'
                          ? 'bg-[#30B2D2] text-white'
                          : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-white">
                          <UsersIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{group.name}</p>
                          <p className="text-sm opacity-75">{group.members.length} members</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold">
                    {selectedConversation.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.type === 'group' ? 'Group Chat' : 'Direct Message'}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.senderId === currentUser.id;
                    return (
                      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isOwn ? 'bg-[#30B2D2] text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                            {new Date(message.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder={dictionary.messages?.typeMessage || 'Type your message...'}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={loading || !messageText.trim()} className="bg-[#30B2D2] hover:bg-[#1E3A8A]">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>{dictionary.messages?.selectUser || 'Select a conversation to start chatting'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Group Dialog */}
      <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{dictionary.messages?.createGroup || 'Create Group'}</DialogTitle>
            <DialogDescription>
              Create a group to send messages to multiple users at once
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-y-auto">
            <div>
              <Label>{dictionary.messages?.groupName || 'Group Name'}</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>

            <div>
              <Label>{dictionary.messages?.selectMembers || 'Select Members'}</Label>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {allUsers.filter(u => u.id !== currentUser.id).map((user) => (
                  <div key={user.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedMembers.includes(user.id)}
                      onCheckedChange={() => toggleMemberSelection(user.id)}
                    />
                    <span className="flex-1">{user.fullName || user.email}</span>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGroupDialog(false)}>
              {dictionary.common.cancel}
            </Button>
            <Button onClick={handleCreateGroup} disabled={loading} className="bg-[#30B2D2] hover:bg-[#1E3A8A]">
              {loading ? dictionary.common.loading : dictionary.messages?.createGroup}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Select Dialog */}
      <Dialog open={showUserSelectDialog} onOpenChange={setShowUserSelectDialog}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{dictionary.messages?.selectRecipient || 'Select Recipient'}</DialogTitle>
            <DialogDescription>
              Choose a user to start a conversation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-y-auto">
            <div>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={dictionary.messages?.searchUsers || 'Search users...'}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className="w-full p-3 hover:bg-gray-50 rounded-lg text-left transition-colors flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold">
                    {user.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{user.fullName || user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
    </>
  );
}
