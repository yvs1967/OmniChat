import React, { useState } from 'react';
import {
  MessageSquarePlus,
  MoreVertical,
  Search,
  Users,
  HardDrive,
  LogOut,
  RefreshCw,
  FolderSync,
  Trash2,
  Edit3,
  User,
  Radio,
  Plus,
  ChevronRight,
  ShieldCheck,
  Check,
  CheckCheck,
} from 'lucide-react';
import { ChatRoom, DriveFolderConfig, SyncEngineStatus, UserProfile } from '../types';
import { getChatDisplayInfo } from '../utils/chatUtils';

interface SidebarProps {
  chats: ChatRoom[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUser: UserProfile | null;
  syncStatus: SyncEngineStatus;
  folderConfig: DriveFolderConfig | null;
  contactAliases?: Record<string, string>;
  onOpenNewChat: () => void;
  onOpenProfile: () => void;
  onOpenFolderSettings: () => void;
  onForceSync: () => Promise<void>;
  onSignOut: () => void;
  onDeleteChat: (chatId: string) => void;
  onOpenRenameModal: (chat: ChatRoom) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  currentUser,
  syncStatus,
  folderConfig,
  contactAliases = {},
  onOpenNewChat,
  onOpenProfile,
  onOpenFolderSettings,
  onForceSync,
  onSignOut,
  onDeleteChat,
  onOpenRenameModal,
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'status'>('chats');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'groups'>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatMenuOpenId, setChatMenuOpenId] = useState<string | null>(null);

  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const myEmail = currentUser?.email?.toLowerCase();

  const filteredChats = chats
    .filter((chat) => {
      if (!myEmail) return true;
      const isParticipant = chat.participants?.some(
        (p) => p.email.toLowerCase() === myEmail
      );
      const isCreator = chat.createdBy?.toLowerCase() === myEmail;
      return isParticipant || isCreator || chat.id === 'chat_drive_general';
    })
    .filter((chat) => {
      if (filterType === 'unread') return (chat.unreadCount || 0) > 0;
      if (filterType === 'groups') return chat.isGroup;
      return true;
    })
    .filter((chat) => {
      if (!searchTerm) return true;
      const displayInfo = getChatDisplayInfo(chat, currentUser, contactAliases);
      const query = searchTerm.toLowerCase();
      const lastMsgText = chat.lastMessage?.text?.toLowerCase() || '';
      return (
        displayInfo.name.toLowerCase().includes(query) ||
        displayInfo.originalName.toLowerCase().includes(query) ||
        displayInfo.subtitle.toLowerCase().includes(query) ||
        chat.name.toLowerCase().includes(query) ||
        lastMsgText.includes(query)
      );
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const timeA = a.lastMessage?.timestamp || a.createdAt;
      const timeB = b.lastMessage?.timestamp || b.createdAt;
      return timeB - timeA;
    });

  const totalUnreadCount = chats.reduce(
    (acc, chat) => acc + (chat.unreadCount || 0),
    0
  );

  return (
    <div className="w-full md:w-[330px] lg:w-[390px] xl:w-[420px] h-full flex flex-col bg-[#111b21] border-r border-[#222d34] select-none shrink-0 relative overflow-hidden">
      {/* Top Header - Sticky on Mobile and Desktop */}
      <div className="h-16 px-3.5 sm:px-4 bg-[#202c33] flex items-center justify-between border-b border-[#222d34] shrink-0 z-30">
        {/* User Avatar + Profile Click */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            onClick={onOpenProfile}
            className="relative cursor-pointer group shrink-0"
            title="Click to view & edit your profile"
          >
            <img
              src={
                currentUser?.photoURL ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                  currentUser?.email || 'OmniChat'
                )}`
              }
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-[#00a884] group-hover:opacity-85 transition-opacity"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#202c33] ${
                syncStatus.connected ? 'bg-[#00a884]' : 'bg-amber-400'
              }`}
              title={syncStatus.connected ? 'Google Drive Synced' : 'Syncing'}
            />
          </div>

          <div
            onClick={onOpenProfile}
            className="flex flex-col cursor-pointer min-w-0 pr-1 group"
            title="Edit profile & status"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-sm font-semibold text-[#e9edef] group-hover:text-[#00a884] transition-colors truncate">
                {currentUser?.displayName || 'OmniChat User'}
              </span>
              <Edit3 className="w-3 h-3 text-[#8696a0] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-[11px] text-[#8696a0] truncate">
              {currentUser?.status || 'Available'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 sm:gap-1 text-[#aebac1] shrink-0">
          {/* Drive Folder Settings */}
          <button
            onClick={onOpenFolderSettings}
            className="p-2 rounded-full hover:bg-[#374248] transition-colors hover:text-[#00a884]"
            title="Drive Folder Hub"
          >
            <FolderSync className="w-5 h-5" />
          </button>

          {/* New Chat Icon */}
          <button
            onClick={onOpenNewChat}
            className="p-2 rounded-full hover:bg-[#374248] transition-colors hover:text-[#00a884]"
            title="Start New Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          {/* Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full hover:bg-[#374248] transition-colors hover:text-[#e9edef]"
              title="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-60 bg-[#233138] rounded-xl shadow-2xl py-2 border border-[#374248] text-sm text-[#d1d7db] animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#182229] transition-colors flex items-center gap-3 text-[#e9edef]"
                  >
                    <User className="w-4 h-4 text-[#00a884]" />
                    <span>My Profile & Status</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenNewChat();
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#182229] transition-colors flex items-center gap-3"
                  >
                    <MessageSquarePlus className="w-4 h-4 text-[#00a884]" />
                    <span>New Group or Contact</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenFolderSettings();
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#182229] transition-colors flex items-center gap-3"
                  >
                    <FolderSync className="w-4 h-4 text-[#00a884]" />
                    <span>Drive Folder & Sharing</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onForceSync();
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#182229] transition-colors flex items-center gap-3"
                  >
                    <RefreshCw className="w-4 h-4 text-[#00a884]" />
                    <span>Force Drive Sync</span>
                  </button>

                  <div className="my-1 border-t border-[#374248]" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#182229] text-red-400 transition-colors flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Tabs Bar: Chats vs Status */}
      <div className="flex items-center bg-[#202c33] border-b border-[#222d34] text-xs font-semibold uppercase tracking-wider shrink-0 z-20">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-2.5 text-center transition-colors relative flex items-center justify-center gap-1.5 ${
            activeTab === 'chats'
              ? 'text-[#00a884] border-b-2 border-[#00a884]'
              : 'text-[#8696a0] hover:text-[#e9edef]'
          }`}
        >
          <span>Chats</span>
          {totalUnreadCount > 0 && (
            <span className="bg-[#00a884] text-[#111b21] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {totalUnreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-2.5 text-center transition-colors relative flex items-center justify-center gap-1.5 ${
            activeTab === 'status'
              ? 'text-[#00a884] border-b-2 border-[#00a884]'
              : 'text-[#8696a0] hover:text-[#e9edef]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Status</span>
        </button>
      </div>

      {/* Scrollable Body Container (Allows Natural Mobile & Desktop Scrolling) */}
      <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col min-h-0 scrollbar-thin">
        {activeTab === 'chats' ? (
          <>
            {/* Drive Live Status Bar */}
            <div className="px-3.5 py-2 bg-[#182229] border-b border-[#222d34] flex items-center justify-between text-xs text-[#8696a0] shrink-0">
              <div className="flex items-center gap-2 truncate">
                <HardDrive className="w-3.5 h-3.5 text-[#00a884] shrink-0" />
                <span className="truncate text-[#d1d7db] font-mono text-[11px]">
                  {folderConfig?.name || 'OmniChat_Data'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={onForceSync}
                  disabled={syncStatus.isSyncing}
                  className="hover:text-[#00a884] transition-colors p-1"
                  title="Refresh from Drive"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      syncStatus.isSyncing ? 'animate-spin text-[#00a884]' : ''
                    }`}
                  />
                </button>
                <button
                  onClick={onOpenFolderSettings}
                  className="text-[11px] text-[#00a884] hover:underline"
                >
                  Manage
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-2.5 border-b border-[#222d34] flex items-center gap-2 shrink-0 bg-[#111b21]">
              <div className="flex-1 flex items-center bg-[#202c33] rounded-lg px-3 py-1.5 text-xs text-[#8696a0]">
                <Search className="w-4 h-4 mr-2.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Search name or recent content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent text-[#e9edef] placeholder-[#8696a0] outline-none w-full text-xs"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-[#8696a0] hover:text-[#e9edef] text-sm px-1"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#222d34] bg-[#111b21] text-xs shrink-0 overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'groups', label: 'Groups' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 ${
                    filterType === f.id
                      ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30'
                      : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Chat List Items */}
            <div className="flex-1 divide-y divide-[#222d34]/40 pb-20">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center text-[#8696a0] space-y-3">
                  <p className="text-sm">No conversations found</p>
                  <button
                    onClick={onOpenNewChat}
                    className="px-4 py-2 bg-[#00a884] text-[#111b21] rounded-lg font-semibold text-xs hover:bg-[#06cf9c] transition-colors inline-block"
                  >
                    + Start New Chat
                  </button>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isSelected = chat.id === selectedChatId;
                  const lastMsg = chat.lastMessage;
                  const displayInfo = getChatDisplayInfo(
                    chat,
                    currentUser,
                    contactAliases
                  );
                  const isLastMsgFromMe = Boolean(
                    (myEmail && lastMsg?.senderEmail && lastMsg.senderEmail.toLowerCase() === myEmail) ||
                    (currentUser?.uid && lastMsg?.senderId && lastMsg.senderId === currentUser.uid) ||
                    lastMsg?.senderName === 'You' ||
                    (currentUser?.displayName && lastMsg?.senderName === currentUser.displayName)
                  );

                  return (
                    <div
                      key={chat.id}
                      onClick={() => onSelectChat(chat.id)}
                      className={`flex items-center px-3.5 py-3.5 cursor-pointer group transition-colors relative ${
                        isSelected ? 'bg-[#2a3942]' : 'hover:bg-[#202c33] active:bg-[#182229]'
                      }`}
                    >
                      {/* Chat Avatar */}
                      <div className="relative mr-3.5 shrink-0">
                        <img
                          src={displayInfo.avatar}
                          alt={displayInfo.name}
                          className="w-12 h-12 rounded-full object-cover border border-[#222d34] bg-[#202c33]"
                        />
                        {displayInfo.isGroup && (
                          <span className="absolute bottom-0 right-0 bg-[#202c33] text-[#00a884] p-0.5 rounded-full border border-[#111b21]">
                            <Users className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-sm font-semibold text-[#e9edef] truncate">
                              {displayInfo.name}
                            </span>
                            {displayInfo.hasCustomAlias && (
                              <span
                                className="text-[10px] bg-[#00a884]/20 text-[#00a884] px-1 rounded font-normal shrink-0"
                                title={`Original: ${displayInfo.originalName}`}
                              >
                                Alias
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[11px] shrink-0 ml-1 ${
                              (chat.unreadCount || 0) > 0
                                ? 'text-[#00a884] font-medium'
                                : 'text-[#8696a0]'
                            }`}
                          >
                            {lastMsg?.timestamp
                              ? formatMessageTime(lastMsg.timestamp)
                              : ''}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[#8696a0] truncate pr-2 flex items-center gap-1">
                            {lastMsg ? (
                              <>
                                {isLastMsgFromMe && (
                                  <span className="inline-flex shrink-0 items-center mr-0.5" title={lastMsg.status === 'read' ? 'Read' : lastMsg.status === 'delivered' ? 'Delivered' : 'Sent'}>
                                    {lastMsg.status === 'read' ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                                    ) : lastMsg.status === 'delivered' ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-[#8696a0]" />
                                    )}
                                  </span>
                                )}
                                {chat.isGroup && lastMsg.senderName && !isLastMsgFromMe && (
                                  <span className="text-[#aebac1] font-medium shrink-0">
                                    {lastMsg.senderName}:{' '}
                                  </span>
                                )}
                                <span className="truncate">{lastMsg.text}</span>
                              </>
                            ) : (
                              <span className="italic text-[#8696a0]/80 truncate">
                                {displayInfo.status || 'No messages yet'}
                              </span>
                            )}
                          </p>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {(chat.unreadCount || 0) > 0 && (
                              <span className="bg-[#00a884] text-[#111b21] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                                {chat.unreadCount}
                              </span>
                            )}

                            {/* Options Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setChatMenuOpenId(
                                  chatMenuOpenId === chat.id ? null : chat.id
                                );
                              }}
                              className="p-1.5 text-[#8696a0] hover:text-[#e9edef] transition-colors rounded-full hover:bg-[#374248]"
                              title="Chat options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Chat item action menu */}
                      {chatMenuOpenId === chat.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={(e) => {
                              e.stopPropagation();
                              setChatMenuOpenId(null);
                            }}
                          />
                          <div
                            className="absolute right-4 top-10 z-50 bg-[#233138] border border-[#374248] rounded-xl shadow-2xl py-1 text-xs text-[#d1d7db] w-44 animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setChatMenuOpenId(null);
                                onOpenRenameModal(chat);
                              }}
                              className="w-full px-3.5 py-2.5 text-left hover:bg-[#182229] transition-colors flex items-center gap-2.5 text-[#e9edef]"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#00a884]" />
                              <span>
                                {displayInfo.hasCustomAlias
                                  ? 'Edit Nickname'
                                  : 'Set Custom Name'}
                              </span>
                            </button>

                            <div className="my-1 border-t border-[#374248]" />

                            <button
                              onClick={() => {
                                setChatMenuOpenId(null);
                                onDeleteChat(chat.id);
                              }}
                              className="w-full px-3.5 py-2.5 text-left hover:bg-[#182229] text-red-400 flex items-center gap-2.5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete chat</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* TAB 2: WHATSAPP STATUS TAB */
          <div className="p-4 space-y-5 pb-24">
            {/* User's own status banner */}
            <div
              onClick={onOpenProfile}
              className="flex items-center gap-3.5 p-3.5 bg-[#202c33] rounded-xl border border-[#2a3942] cursor-pointer hover:bg-[#2a3942] transition-colors"
            >
              <div className="relative">
                <img
                  src={
                    currentUser?.photoURL ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                      currentUser?.email || 'OmniChat'
                    )}`
                  }
                  alt="My Status"
                  className="w-13 h-13 rounded-full object-cover border-2 border-[#00a884]"
                />
                <span className="absolute bottom-0 right-0 p-1 bg-[#00a884] text-[#111b21] rounded-full shadow">
                  <Plus className="w-3 h-3 stroke-[3]" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#e9edef]">
                    My Status
                  </span>
                  <span className="text-[11px] text-[#00a884]">Tap to update</span>
                </div>
                <p className="text-xs text-[#8696a0] truncate mt-0.5">
                  {currentUser?.status || 'Hey there! I am using OmniChat'}
                </p>
              </div>
            </div>

            {/* Contact Status Updates List */}
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8696a0] block px-1">
                Contact Status Updates
              </span>

              <div className="space-y-2">
                {chats
                  .filter((c) => !c.isGroup)
                  .map((chat) => {
                    const info = getChatDisplayInfo(
                      chat,
                      currentUser,
                      contactAliases
                    );
                    return (
                      <div
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        className="flex items-center justify-between p-3.5 bg-[#111b21] hover:bg-[#202c33] active:bg-[#182229] rounded-xl border border-[#222d34] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={info.avatar}
                            alt={info.name}
                            className="w-10 h-10 rounded-full object-cover border border-[#00a884]"
                          />
                          <div className="truncate">
                            <span className="text-sm font-medium text-[#e9edef] block truncate">
                              {info.name}
                            </span>
                            <span className="text-xs text-[#00a884] truncate block">
                              {info.status || 'Available'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8696a0] shrink-0" />
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="p-3 bg-[#202c33]/70 rounded-xl text-xs text-[#8696a0] space-y-1 border border-[#374248]">
              <span className="font-semibold text-[#e9edef] block">
                OmniChat Status Sync
              </span>
              <p className="text-[11px] leading-relaxed">
                When you update your profile photo, display name, or status message, it automatically synchronizes with all participants in your Google Drive folder.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={onOpenNewChat}
        className="absolute bottom-6 right-6 z-20 w-14 h-14 bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] rounded-2xl shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        title="Start New Chat"
      >
        <MessageSquarePlus className="w-6 h-6 stroke-[2.2]" />
      </button>
    </div>
  );
};
