'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Search } from '@jyotish/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  EmptyState,
  ChatIcon,
} from '@jyotish/ui';
import type { Chat } from '@/types';
import ChatDetailModal from '@/components/chat/ChatDetailModal';
import { useAdminSocket } from '@/hooks';

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { on, off, isConnected } = useAdminSocket();

  useEffect(() => {
    loadChats();
  }, []);

  // Listen for real-time chat updates
  useEffect(() => {
    if (!isConnected) return;

    const handleNewChat = (newChat: Chat) => {
      console.log('💬 New chat created:', newChat);
      setChats((prev) => [newChat, ...prev]);
    };

    const handleChatUpdate = (updatedChat: Chat) => {
      console.log('💬 Chat updated:', updatedChat);
      setChats((prev) =>
        prev.map((chat) => (chat.id === updatedChat.id ? { ...chat, ...updatedChat } : chat))
      );
    };

    on('chat:new', handleNewChat);
    on('chat:update', handleChatUpdate);

    return () => {
      off('chat:new', handleNewChat);
      off('chat:update', handleChatUpdate);
    };
  }, [isConnected, on, off]);

  const loadChats = async () => {
    try {
      // Fetch all chats with a high limit
      const response: any = await adminApi.chats.list({ limit: 1000 });
      if (Array.isArray(response)) {
        setChats(response);
      } else if (response?.chats) {
        setChats(response.chats);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const isImageUrl = (text: string) => {
    if (!text) return false;
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
    return imageExtensions.test(text) || text.includes('/uploads/chat/images/');
  };

  const formatLastMessage = (text: string | null | undefined) => {
    if (!text) return 'No messages yet';
    if (isImageUrl(text)) return '📷 Image';
    if (text.startsWith('http') && text.includes('/uploads/')) return '📎 Attachment';
    return text;
  };

  const filteredChats = chats.filter((chat) => {
    const clientName = chat.clientParticipant?.name?.toLowerCase() || '';
    const astrologerName = chat.astrologerParticipant?.name?.toLowerCase() || '';
    const lastMessage = chat.lastMessageText?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    return (
      clientName.includes(search) || astrologerName.includes(search) || lastMessage.includes(search)
    );
  });

  const handleChatClick = (chat: Chat) => {
    setSelectedChat(chat);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Delay clearing selected chat to allow modal animation to complete
    setTimeout(() => setSelectedChat(null), 300);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white">Chat Monitor</h2>
          <p className="text-slate-400 mt-1">Monitor conversations between users and astrologers</p>
        </div>

        {/* Search Bar */}
        <Search
          placeholder="Search by user, astrologer, or message content..."
          value={searchTerm}
          onSearch={setSearchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          {loading ? (
            <TableSkeleton rows={8} columns={5} />
          ) : filteredChats.length === 0 ? (
            <EmptyState
              icon={<ChatIcon className="w-20 h-20 text-slate-600" />}
              title={searchTerm ? 'No chats found' : 'No active chats'}
              description={
                searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Chat conversations will appear here once users start communicating with astrologers'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Astrologer</TableHead>
                  <TableHead>Last Message</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChats.map((chat) => (
                  <TableRow
                    key={chat.id}
                    className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => handleChatClick(chat)}
                  >
                    <TableCell className="font-medium">
                      {chat.clientParticipant?.name || 'Unknown User'}
                    </TableCell>
                    <TableCell>
                      {chat.astrologerParticipant?.name || 'Unknown Astrologer'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {formatLastMessage(chat.lastMessageText)}
                    </TableCell>
                    <TableCell>
                      {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">
                        {chat.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Chat Detail Modal */}
      <ChatDetailModal chat={selectedChat} isOpen={isModalOpen} onClose={handleCloseModal} />
    </AdminLayout>
  );
}
