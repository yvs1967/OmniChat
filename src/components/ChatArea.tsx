import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Search,
  Paperclip,
  Smile,
  Mic,
  Send,
  Check,
  CheckCheck,
  Image as ImageIcon,
  FileText,
  Phone,
  Video,
  X,
  CornerUpLeft,
  Trash2,
  Lock,
  FolderSync,
  ArrowLeft,
  Star,
  Copy,
  ChevronDown,
  Plus,
  Users,
  Info,
  ExternalLink,
  ChevronUp,
  Edit3,
} from 'lucide-react';
import { ChatMessage, ChatRoom, UserProfile, MediaAttachment } from '../types';
import { AudioVoiceRecorder } from './AudioVoiceRecorder';
import { EmojiPicker } from './EmojiPicker';
import { MediaItem } from './MediaItem';
import { getChatDisplayInfo } from '../utils/chatUtils';

interface ChatAreaProps {
  chat: ChatRoom;
  messages: ChatMessage[];
  currentUser: UserProfile | null;
  contactAliases?: Record<string, string>;
  onSendMessage: (text: string, media?: MediaAttachment, replyTo?: ChatMessage) => Promise<void>;
  onSendAudioNote: (audioBlob: Blob, duration: number) => Promise<void>;
  onSendMediaFile: (file: File) => Promise<void>;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onRequestDeleteMessage: (message: ChatMessage) => void;
  onOpenFolderSettings: () => void;
  onOpenRenameModal?: (chat: ChatRoom) => void;
  onBack?: () => void;
  onToggleStarMessage?: (messageId: string) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages,
  currentUser,
  contactAliases = {},
  onSendMessage,
  onSendAudioNote,
  onSendMediaFile,
  onReactToMessage,
  onRequestDeleteMessage,
  onOpenFolderSettings,
  onOpenRenameModal,
  onBack,
  onToggleStarMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
  const [reactingToMessageId, setReactingToMessageId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-chat search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);

  // Contact / Group Info drawer
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Compute dynamic display name & avatar for this user
  const displayInfo = getChatDisplayInfo(chat, currentUser, contactAliases);
  const myEmail = currentUser?.email?.toLowerCase();

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');
    const replyTarget = replyingTo || undefined;
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);

    await onSendMessage(textToSend, undefined, replyTarget);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setShowAttachMenu(false);
      await onSendMediaFile(file);
      e.target.value = '';
    }
  };

  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (msg: ChatMessage) => {
    if (!myEmail) return false;
    return (
      msg.senderEmail?.toLowerCase() === myEmail ||
      msg.senderId === currentUser?.uid ||
      msg.senderId === 'user_self'
    );
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Message copied to clipboard');
    setActiveMessageMenuId(null);
  };

  // Search matches
  const searchMatches = searchQuery.trim()
    ? messages.filter((m) =>
        m.text?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b141a] relative select-none min-w-0 overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#202c33] border border-[#00a884] text-[#e9edef] text-xs px-4 py-2 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,audio/*,application/pdf,.doc,.docx,.txt"
      />

      {/* Main Chat Header */}
      <div className="h-15 px-3 sm:px-4 bg-[#202c33] border-b border-[#222d34] flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Mobile Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 -ml-1 text-[#aebac1] hover:text-white rounded-full hover:bg-[#374248] transition-colors shrink-0"
              title="Back to chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Profile & Info trigger */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 min-w-0 cursor-pointer flex-1"
            onClick={() => setShowInfoDrawer(!showInfoDrawer)}
          >
            <div className="relative shrink-0">
              <img
                src={displayInfo.avatar}
                alt={displayInfo.name}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-[#374248]"
              />
              {displayInfo.isGroup && (
                <span className="absolute bottom-0 right-0 bg-[#202c33] text-[#00a884] p-0.5 rounded-full border border-[#111b21]">
                  <Users className="w-2.5 h-2.5" />
                </span>
              )}
            </div>

            <div className="flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-1.5 truncate">
                <h2 className="text-sm font-semibold text-[#e9edef] truncate">
                  {displayInfo.name}
                </h2>
                {displayInfo.hasCustomAlias && (
                  <span className="text-[10px] bg-[#00a884]/20 text-[#00a884] px-1 rounded font-normal shrink-0">
                    Alias
                  </span>
                )}
                {onOpenRenameModal && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRenameModal(chat);
                    }}
                    className="text-[#8696a0] hover:text-[#00a884] p-0.5 transition-colors rounded hover:bg-[#374248]"
                    title="Edit contact name"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-[11px] text-[#8696a0] truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] shrink-0" />
                <span className="truncate">
                  {displayInfo.status ? displayInfo.status : displayInfo.subtitle}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 text-[#aebac1] shrink-0">
          <button
            onClick={() => setIsSearching(!isSearching)}
            className={`p-2 rounded-full hover:bg-[#374248] transition-colors ${
              isSearching ? 'text-[#00a884] bg-[#2a3942]' : 'hover:text-[#e9edef]'
            }`}
            title="Search messages in chat"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={onOpenFolderSettings}
            className="p-2 rounded-full hover:bg-[#374248] transition-colors hover:text-[#00a884]"
            title="Drive Folder Hub"
          >
            <FolderSync className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
              className="p-2 rounded-full hover:bg-[#374248] transition-colors hover:text-[#e9edef]"
              title="More options"
            >
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {headerMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setHeaderMenuOpen(false)}
                />
                <div className="absolute right-0 top-11 z-40 w-52 bg-[#233138] rounded-md shadow-2xl py-2 border border-[#374248] text-sm text-[#d1d7db] animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setShowInfoDrawer(true);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-[#182229] transition-colors flex items-center gap-3 text-xs"
                  >
                    <Info className="w-4 h-4 text-[#00a884]" />
                    <span>{displayInfo.isGroup ? 'Group info' : 'Contact info'}</span>
                  </button>

                  {onOpenRenameModal && (
                    <button
                      onClick={() => {
                        setHeaderMenuOpen(false);
                        onOpenRenameModal(chat);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[#182229] transition-colors flex items-center gap-3 text-xs text-[#e9edef]"
                    >
                      <Edit3 className="w-4 h-4 text-[#00a884]" />
                      <span>{displayInfo.hasCustomAlias ? 'Edit Nickname' : 'Set Custom Name'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      onOpenFolderSettings();
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-[#182229] transition-colors flex items-center gap-3 text-xs"
                  >
                    <FolderSync className="w-4 h-4 text-[#53bdeb]" />
                    <span>Google Drive folder</span>
                  </button>

                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setIsSearching(true);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-[#182229] transition-colors flex items-center gap-3 text-xs"
                  >
                    <Search className="w-4 h-4 text-[#aebac1]" />
                    <span>Search messages</span>
                  </button>

                  {onBack && (
                    <button
                      onClick={() => {
                        setHeaderMenuOpen(false);
                        onBack();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[#182229] transition-colors flex items-center gap-3 text-xs md:hidden"
                    >
                      <ArrowLeft className="w-4 h-4 text-[#8696a0]" />
                      <span>Back to chat list</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* In-Chat Search Bar */}
      {isSearching && (
        <div className="px-4 py-2 bg-[#202c33] border-b border-[#2d3b42] flex items-center gap-2 text-xs animate-in slide-in-from-top-1">
          <Search className="w-4 h-4 text-[#8696a0] shrink-0" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchIndex(0);
            }}
            className="flex-1 bg-transparent text-[#e9edef] placeholder-[#8696a0] outline-none text-xs"
            autoFocus
          />
          {searchQuery && (
            <span className="text-[#8696a0] text-[11px] shrink-0">
              {searchMatches.length} {searchMatches.length === 1 ? 'match' : 'matches'}
            </span>
          )}
          <button
            onClick={() => {
              setIsSearching(false);
              setSearchQuery('');
            }}
            className="text-[#8696a0] hover:text-[#e9edef] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Chat Body & Info Drawer Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-8 lg:px-12 py-4 space-y-2 wa-chat-pattern relative">
          {/* Security / Google Drive notice pill */}
          <div className="flex justify-center my-3">
            <div className="bg-[#182229]/95 border border-[#222d34] text-[#ffd279] text-[11px] px-3.5 py-1.5 rounded-lg max-w-md text-center shadow-md flex items-center gap-2 leading-relaxed">
              <Lock className="w-3.5 h-3.5 text-[#ffd279] shrink-0" />
              <span>
                Synchronized directly via private Google Drive folders with zero intermediary servers.
              </span>
            </div>
          </div>

          {/* Date Separator Pill */}
          <div className="flex justify-center my-2">
            <span className="bg-[#182229] text-[#8696a0] text-[11px] font-medium uppercase px-3 py-1 rounded-md shadow-xs">
              MESSAGES
            </span>
          </div>

          {/* Message Bubbles */}
          {messages.map((msg) => {
            const isMe = isMyMessage(msg);
            const isHovered = hoveredMessageId === msg.id;
            const isMenuOpen = activeMessageMenuId === msg.id;
            const isHighlighted =
              searchQuery.trim() &&
              msg.text?.toLowerCase().includes(searchQuery.trim().toLowerCase());

            return (
              <div
                key={msg.id}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => {
                  setHoveredMessageId(null);
                  if (activeMessageMenuId === msg.id) setActiveMessageMenuId(null);
                }}
                className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} my-1 relative`}
              >
                {/* Floating Reaction Bar on Hover/Tap */}
                {(isHovered || isMenuOpen) && (
                  <div
                    className={`absolute -top-7 z-20 flex items-center gap-0.5 bg-[#202c33] border border-[#374248] rounded-full px-2 py-0.5 shadow-xl animate-in fade-in duration-100 ${
                      isMe ? 'right-2' : 'left-2'
                    }`}
                  >
                    {/* Quick Reactions */}
                    {QUICK_REACTIONS.map((emoji) => {
                      const userReacted = msg.reactions?.some(
                        (r) =>
                          r.emoji === emoji &&
                          (r.userId.toLowerCase() === myEmail || r.userId === 'user_self')
                      );

                      return (
                        <button
                          key={emoji}
                          onClick={() => onReactToMessage(msg.id, emoji)}
                          className={`hover:scale-130 transition-transform text-xs p-1 rounded-full ${
                            userReacted ? 'bg-[#00a884]/20 scale-110' : ''
                          }`}
                          title={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      );
                    })}

                    {/* Plus Button for Any Emoji */}
                    <button
                      onClick={() => setReactingToMessageId(msg.id)}
                      className="p-1 text-[#8696a0] hover:text-white hover:scale-120 transition-transform rounded-full"
                      title="React with any emoji"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-[1px] h-3 bg-[#374248] mx-0.5" />

                    {/* Reply Button */}
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 text-[#8696a0] hover:text-[#e9edef] rounded-full"
                      title="Reply"
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* Copy Button */}
                    {msg.text && (
                      <button
                        onClick={() => handleCopyText(msg.text)}
                        className="p-1 text-[#8696a0] hover:text-[#e9edef] rounded-full"
                        title="Copy text"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Star / Bookmark Button */}
                    <button
                      onClick={() => onToggleStarMessage?.(msg.id)}
                      className={`p-1 rounded-full ${
                        msg.starred ? 'text-amber-400' : 'text-[#8696a0] hover:text-amber-400'
                      }`}
                      title={msg.starred ? 'Unstar message' : 'Star message'}
                    >
                      <Star className={`w-3.5 h-3.5 ${msg.starred ? 'fill-amber-400' : ''}`} />
                    </button>

                    {/* Delete Message Button */}
                    <button
                      onClick={() => onRequestDeleteMessage(msg)}
                      className="p-1 text-[#8696a0] hover:text-red-400 rounded-full"
                      title="Delete message from Google Drive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-lg px-3 py-2 shadow-sm text-sm text-[#e9edef] transition-all ${
                    isMe
                      ? 'bg-[#005c4b] rounded-tr-none'
                      : 'bg-[#202c33] rounded-tl-none border border-[#26353d]'
                  } ${isHighlighted ? 'ring-2 ring-amber-400/80 bg-amber-950/40' : ''}`}
                >
                  {/* Sender Name in Group Chat */}
                  {chat.isGroup && !isMe && (
                    <div className="text-[12px] font-semibold text-[#53bdeb] mb-1">
                      {contactAliases?.[msg.senderEmail?.toLowerCase()] || msg.senderName}
                    </div>
                  )}

                  {/* Reply Quoted Reference Bubble */}
                  {msg.replyTo && (
                    <div className="mb-2 p-2 bg-black/25 rounded-md border-l-4 border-[#00a884] text-xs">
                      <span className="font-semibold text-[#00a884] block">
                        {msg.replyTo.senderName}
                      </span>
                      <span className="text-[#8696a0] line-clamp-1">{msg.replyTo.text}</span>
                    </div>
                  )}

                  {/* Media Attachment */}
                  {msg.media && (
                    <MediaItem
                      media={msg.media}
                      isOutgoing={isMe}
                    />
                  )}

                  {/* Text Content */}
                  {msg.text && (
                    <p className="whitespace-pre-wrap break-words leading-relaxed select-text">
                      {msg.text}
                    </p>
                  )}

                  {/* Timestamp, Star & Status Checkmarks */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#8696a0] select-none float-right ml-3">
                    {msg.starred && (
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0 mr-0.5" />
                    )}
                    <span>{formatMessageTime(msg.timestamp)}</span>
                    {isMe && (
                      <span>
                        {msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                        ) : msg.status === 'delivered' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-[#8696a0]" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* CLICKABLE EMOJI REACTION BADGES */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="absolute -bottom-3 right-2 flex items-center gap-1 bg-[#202c33] border border-[#374248] rounded-full px-1.5 py-0.5 shadow-md">
                      {Array.from(new Set(msg.reactions.map((r) => r.emoji))).map((emoji) => {
                        const matchingReactions =
                          msg.reactions?.filter((r) => r.emoji === emoji) || [];
                        const count = matchingReactions.length;
                        const userReacted = matchingReactions.some(
                          (r) =>
                            r.userId.toLowerCase() === myEmail || r.userId === 'user_self'
                        );
                        const reactionAuthors = matchingReactions
                          .map((r) =>
                            r.userId.toLowerCase() === myEmail ? 'You' : r.userName
                          )
                          .join(', ');

                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReactToMessage(msg.id, emoji);
                            }}
                            className={`text-xs flex items-center px-1 py-0.5 rounded-full transition-transform hover:scale-110 active:scale-95 ${
                              userReacted
                                ? 'bg-[#00a884]/20 border border-[#00a884]/40 text-[#00a884]'
                                : 'hover:bg-[#2a3942]'
                            }`}
                            title={`Reacted by: ${reactionAuthors} (Click to toggle)`}
                          >
                            <span>{emoji}</span>
                            {count > 1 && (
                              <span
                                className={`text-[10px] ml-1 font-mono ${
                                  userReacted ? 'text-[#00a884] font-semibold' : 'text-[#8696a0]'
                                }`}
                              >
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Contact & Group Info Drawer (WhatsApp Web style slide-over) */}
        {showInfoDrawer && (
          <div className="w-full sm:w-80 md:w-88 bg-[#111b21] border-l border-[#222d34] flex flex-col h-full z-20 animate-in slide-in-from-right duration-200 shadow-2xl">
            {/* Drawer Header */}
            <div className="h-15 px-4 bg-[#202c33] border-b border-[#222d34] flex items-center justify-between shrink-0">
              <span className="text-sm font-semibold text-[#e9edef]">
                {displayInfo.isGroup ? 'Group Info' : 'Contact Info'}
              </span>
              <button
                onClick={() => setShowInfoDrawer(false)}
                className="p-1 text-[#8696a0] hover:text-white rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Profile Card */}
              <div className="flex flex-col items-center p-4 bg-[#202c33] rounded-xl border border-[#374248] text-center space-y-2">
                <img
                  src={displayInfo.avatar}
                  alt={displayInfo.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#00a884] shadow-md bg-[#111b21]"
                />
                <div className="space-y-0.5">
                  <h3 className="text-base font-semibold text-white">{displayInfo.name}</h3>
                  {displayInfo.hasCustomAlias && (
                    <p className="text-[11px] text-[#00a884]">
                      Original: {displayInfo.originalName}
                    </p>
                  )}
                  <p className="text-xs text-[#8696a0]">{displayInfo.subtitle}</p>
                </div>

                {onOpenRenameModal && (
                  <button
                    onClick={() => onOpenRenameModal(chat)}
                    className="px-3.5 py-1.5 bg-[#111b21] hover:bg-[#2a3942] text-[#00a884] border border-[#00a884]/40 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors mt-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{displayInfo.hasCustomAlias ? 'Edit Nickname' : 'Set Custom Name'}</span>
                  </button>
                )}
              </div>

              {/* Status / About Card */}
              {!chat.isGroup && displayInfo.status && (
                <div className="p-3 bg-[#202c33] rounded-lg border border-[#374248] space-y-1">
                  <span className="text-[#8696a0] font-semibold uppercase tracking-wider text-[10px] block">
                    About / Status
                  </span>
                  <p className="text-xs text-[#e9edef] font-medium leading-relaxed">
                    {displayInfo.status}
                  </p>
                </div>
              )}

              {/* Group Members List if Group */}
              {chat.isGroup && (
                <div className="p-3 bg-[#202c33] rounded-lg border border-[#374248] space-y-2">
                  <span className="text-[#8696a0] font-semibold uppercase tracking-wider text-[10px] block">
                    Group Participants ({chat.participants?.length || 0})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {chat.participants?.map((p) => {
                      const isMe = p.email?.toLowerCase() === myEmail;
                      const isCreator = chat.createdBy?.toLowerCase() === p.email?.toLowerCase();

                      return (
                        <div
                          key={p.email}
                          className="flex items-center justify-between p-1.5 bg-[#111b21] rounded"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <img
                              src={
                                p.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                  p.email
                                )}`
                              }
                              alt=""
                              className="w-6 h-6 rounded-full"
                            />
                            <div className="truncate">
                              <span className="text-white text-xs block truncate">
                                {isMe ? `${p.name} (You)` : p.name}
                              </span>
                              <span className="text-[10px] text-[#8696a0] truncate block">
                                {p.email}
                              </span>
                            </div>
                          </div>
                          {isCreator && (
                            <span className="text-[10px] bg-[#00a884]/20 text-[#00a884] px-1.5 py-0.5 rounded font-mono shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Google Drive Subfolder info */}
              <div className="p-3 bg-[#202c33] rounded-lg border border-[#374248] space-y-2">
                <span className="text-[#8696a0] font-semibold uppercase tracking-wider text-[10px] block">
                  Google Drive Storage
                </span>
                <p className="text-[#8696a0] text-[11px] leading-relaxed">
                  Messages and media in this room are isolated inside its dedicated Google Drive subfolder:
                </p>
                <div className="p-2 bg-[#111b21] rounded font-mono text-[11px] text-[#00a884] break-all">
                  chats/room_{chat.id}/
                </div>
                <button
                  onClick={onOpenFolderSettings}
                  className="w-full py-1.5 bg-[#111b21] hover:bg-[#2a3942] text-[#00a884] border border-[#00a884]/30 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FolderSync className="w-3.5 h-3.5" />
                  View Drive Hub
                </button>
              </div>

              {/* Shared Media count */}
              <div className="p-3 bg-[#202c33] rounded-lg border border-[#374248] space-y-1">
                <span className="text-[#8696a0] font-semibold uppercase tracking-wider text-[10px] block">
                  Messages Statistics
                </span>
                <div className="flex justify-between text-xs text-[#d1d7db] py-1 border-b border-[#374248]/50">
                  <span>Total Messages</span>
                  <span className="font-semibold text-white">{messages.length}</span>
                </div>
                <div className="flex justify-between text-xs text-[#d1d7db] py-1">
                  <span>Starred Messages</span>
                  <span className="font-semibold text-amber-400">
                    {messages.filter((m) => m.starred).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Emoji Picker for reacting to a specific message */}
      {reactingToMessageId && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setReactingToMessageId(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <EmojiPicker
              onSelectEmoji={(emoji) => {
                onReactToMessage(reactingToMessageId, emoji);
                setReactingToMessageId(null);
              }}
              onClose={() => setReactingToMessageId(null)}
            />
          </div>
        </>
      )}

      {/* Reply Preview Bar above input */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[#202c33] border-t border-[#222d34] flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
          <div className="border-l-4 border-[#00a884] pl-2 min-w-0 flex-1">
            <span className="font-semibold text-[#00a884] block truncate">
              Replying to {replyingTo.senderName}
            </span>
            <span className="text-[#8696a0] line-clamp-1 truncate">{replyingTo.text}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-[#8696a0] hover:text-[#e9edef] p-1 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover for Input Bar */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelectEmoji={(emoji) => {
            setInputText((prev) => prev + emoji);
          }}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* Attachment Menu Popup */}
      {showAttachMenu && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowAttachMenu(false)}
          />
          <div className="absolute bottom-16 left-12 z-40 bg-[#233138] border border-[#374248] rounded-xl shadow-2xl p-2 w-52 space-y-1 animate-in fade-in zoom-in-95 duration-100 text-xs text-[#d1d7db]">
            <button
              onClick={() => {
                setShowAttachMenu(false);
                fileInputRef.current?.click();
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#182229] transition-colors"
            >
              <div className="p-1.5 rounded-full bg-cyan-500/20 text-cyan-400">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span>Photos & Videos</span>
            </button>

            <button
              onClick={() => {
                setShowAttachMenu(false);
                fileInputRef.current?.click();
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#182229] transition-colors"
            >
              <div className="p-1.5 rounded-full bg-indigo-500/20 text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <span>Document / PDF</span>
            </button>

            <button
              onClick={() => {
                setShowAttachMenu(false);
                setIsRecordingAudio(true);
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#182229] transition-colors"
            >
              <div className="p-1.5 rounded-full bg-red-500/20 text-red-400">
                <Mic className="w-4 h-4" />
              </div>
              <span>Record Voice Note</span>
            </button>
          </div>
        </>
      )}

      {/* Bottom Message Input Bar */}
      <div className="min-h-16 px-3 sm:px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] bg-[#202c33] border-t border-[#222d34] flex items-center gap-1.5 sm:gap-2 shrink-0 relative z-20">
        {isRecordingAudio ? (
          <AudioVoiceRecorder
            onSendAudio={(blob: Blob, duration: number) => {
              setIsRecordingAudio(false);
              onSendAudioNote(blob, duration);
            }}
            onCancel={() => setIsRecordingAudio(false)}
          />
        ) : (
          <>
            {/* Emoji Picker Button */}
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowAttachMenu(false);
              }}
              className={`p-2 rounded-full hover:bg-[#374248] transition-colors ${
                showEmojiPicker ? 'text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
              title="Emoji"
            >
              <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Paperclip Attachment Button */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(!showAttachMenu);
                setShowEmojiPicker(false);
              }}
              className={`p-2 rounded-full hover:bg-[#374248] transition-colors ${
                showAttachMenu ? 'text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
              title="Attach File or Photo"
            >
              <Paperclip className="w-5 h-5 sm:w-6 sm:h-6 rotate-45" />
            </button>

            {/* Text Input Box */}
            <div className="flex-1 bg-[#2a3942] rounded-lg px-3 py-2 flex items-center min-w-0">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="w-full bg-transparent text-[#e9edef] placeholder-[#8696a0] text-sm outline-none resize-none max-h-24 scrollbar-thin"
              />
            </div>

            {/* Send or Voice Note Button */}
            {inputText.trim() ? (
              <button
                type="button"
                onClick={handleSend}
                className="p-2 sm:p-2.5 bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] rounded-full transition-transform active:scale-95 shadow-md shrink-0"
                title="Send message"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecordingAudio(true)}
                className="p-2 sm:p-2.5 hover:bg-[#374248] text-[#8696a0] hover:text-[#e9edef] rounded-full transition-colors shrink-0"
                title="Record voice note"
              >
                <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
