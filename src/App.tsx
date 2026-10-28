import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatRoom,
  ChatMessage,
  UserProfile,
  DriveFolderConfig,
  SyncEngineStatus,
  MediaAttachment,
} from './types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/auth';
import {
  getOrCreateRootFolder,
  fetchChatsFromDrive,
  saveChatsToDrive,
  fetchMessagesFromDrive,
  saveMessagesToDrive,
  uploadMediaToDrive,
  ensureFolderInitialized,
  getOrCreateChatSubfolder,
  shareFolderWithEmail,
  saveRoomMetadataToDrive,
} from './services/driveSync';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SignInPrompt } from './components/SignInPrompt';
import { NewChatModal } from './components/NewChatModal';
import { FolderSyncModal } from './components/FolderSyncModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ProfileModal } from './components/ProfileModal';
import { RenameContactModal } from './components/RenameContactModal';
import { MessageSquare, Sparkles, FolderSync } from 'lucide-react';

export default function App() {
  // Authentication & User State
  const [needsAuth, setNeedsAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  // Chats & Messaging State - Clean production data loaded from Google Drive
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});

  // Active Refs to prevent stale closures in polling timer
  const chatsRef = useRef(chats);
  chatsRef.current = chats;
  const selectedChatIdRef = useRef(selectedChatId);
  selectedChatIdRef.current = selectedChatId;

  // User-specific contact aliases (e.g. Alex naming Bob "Bob Newyork")
  const [contactAliases, setContactAliases] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('omnichat_contact_aliases');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Google Drive Sync Engine State
  const [folderConfig, setFolderConfig] = useState<DriveFolderConfig | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncEngineStatus>({
    isSyncing: false,
    lastSyncedAt: null,
    folderConfig: null,
    error: null,
    connected: false,
  });

  // Modals & UI Controls
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isFolderSettingsOpen, setIsFolderSettingsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [renameChatTarget, setRenameChatTarget] = useState<ChatRoom | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  // Destructive Confirmation Modal (Workspace Integration Skill requirement)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Helper to load user profile customizations (photo, display name, status) from localStorage
  const applyProfileOverride = useCallback((user: UserProfile): UserProfile => {
    try {
      const raw = localStorage.getItem('omnichat_profile_override');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...user,
          displayName: parsed.displayName || user.displayName,
          photoURL: parsed.photoURL || user.photoURL,
          status: parsed.status || user.status || 'Available',
        };
      }
    } catch {}
    return {
      ...user,
      status: user.status || 'Available',
    };
  }, []);

  // Save or delete contact alias
  const handleSaveAlias = (identifier: string, alias: string | null) => {
    setContactAliases((prev) => {
      const updated = { ...prev };
      const key = identifier.toLowerCase();
      if (alias && alias.trim()) {
        updated[key] = alias.trim();
      } else {
        delete updated[key];
      }
      try {
        localStorage.setItem('omnichat_contact_aliases', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save alias:', err);
      }
      return updated;
    });
  };

  // Update current user profile and sync to Drive chats
  const handleUpdateProfile = async (updatedFields: Partial<UserProfile>) => {
    const base = currentUser || {
      uid: 'user_self',
      displayName: 'OmniChat User',
      email: 'you@example.com',
    };
    const updatedUser: UserProfile = {
      ...base,
      ...updatedFields,
    };
    setCurrentUser(updatedUser);

    try {
      localStorage.setItem(
        'omnichat_profile_override',
        JSON.stringify({
          displayName: updatedUser.displayName,
          photoURL: updatedUser.photoURL,
          status: updatedUser.status,
        })
      );
    } catch {}

    // Update participant records in active chats
    const myEmailLower = updatedUser.email?.toLowerCase();
    const updatedChats = chats.map((chat) => {
      const isPart = chat.participants?.some(
        (p) => p.email?.toLowerCase() === myEmailLower
      );
      if (!isPart) return chat;
      return {
        ...chat,
        participants: chat.participants.map((p) =>
          p.email?.toLowerCase() === myEmailLower
            ? {
                ...p,
                name: updatedUser.displayName,
                avatar: updatedUser.photoURL,
                status: updatedUser.status,
              }
            : p
        ),
      };
    });
    setChats(updatedChats);

    // Save to Google Drive if connected
    if (folderConfig?.id && syncStatus.connected) {
      try {
        await saveChatsToDrive(folderConfig.id, updatedChats);
      } catch (err) {
        console.warn('Failed to save profile updates to Drive chats:', err);
      }
    }
  };

  // Polling ref
  const pollingTimerRef = useRef<number | null>(null);

  // Check URL query params for shared folder ID: ?folderId=...
  const getUrlFolderId = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('folderId') || undefined;
    } catch {
      return undefined;
    }
  };

  /**
   * Initialize Authentication & Token caching
   */
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        const enrichedUser = applyProfileOverride(user);
        setCurrentUser(enrichedUser);
        setNeedsAuth(false);
        setIsGuestMode(false);
        // Connect to Drive
        initDriveConnection(enrichedUser);
      },
      () => {
        // Not signed in
        if (!isGuestMode) {
          setNeedsAuth(true);
        }
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [isGuestMode, applyProfileOverride]);

  /**
   * Handle Login Click
   */
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        const enrichedUser = applyProfileOverride(result.user);
        setCurrentUser(enrichedUser);
        setNeedsAuth(false);
        setIsGuestMode(false);
        setAuthErrorMessage(null);
        await initDriveConnection(enrichedUser);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setAuthErrorMessage(err.message || 'Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  /**
   * Connect to Google Drive Root Folder and initial sync
   */
  const initDriveConnection = async (user?: UserProfile | null) => {
    const activeUser = user || currentUser;
    setSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      const targetFolderId = getUrlFolderId();
      const folder = await getOrCreateRootFolder(targetFolderId);
      setFolderConfig(folder);

      // Fetch chats from Drive
      const driveChats = await fetchChatsFromDrive(folder.id);

      if (driveChats && driveChats.length > 0) {
        setChats(driveChats);
        if (!selectedChatId || !driveChats.some((c) => c.id === selectedChatId)) {
          setSelectedChatId(driveChats[0].id);
        }
      } else {
        // Initialize clean empty chats.json in Drive with zero mock data
        await saveChatsToDrive(folder.id, []);
        setChats([]);
      }

      setSyncStatus({
        isSyncing: false,
        lastSyncedAt: Date.now(),
        folderConfig: folder,
        error: null,
        connected: true,
      });

      // Start periodic sync polling
      startPolling(folder.id);
    } catch (err: any) {
      console.error('Drive connection error:', err);
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        connected: false,
        error: err.message,
      }));
    }
  };

  /**
   * Periodic synchronization poller (every 5 seconds)
  /**
   * Mark all unread incoming messages in a chat as 'read'
   */
  const markChatMessagesAsRead = async (chatId: string, msgsToMark?: ChatMessage[]) => {
    if (!currentUser?.email) return;
    const myEmailLower = currentUser.email.toLowerCase();

    const currentMsgs = msgsToMark || messagesMap[chatId] || [];
    let hasUnread = false;

    const updatedMsgs = currentMsgs.map((m) => {
      if (m.senderEmail?.toLowerCase() !== myEmailLower && m.status !== 'read') {
        hasUnread = true;
        return { ...m, status: 'read' as const };
      }
      return m;
    });

    if (hasUnread) {
      setMessagesMap((prev) => ({ ...prev, [chatId]: updatedMsgs }));
      // Also update chat.lastMessage and reset unreadCount to 0
      setChats((prevChats) => {
        const nextChats = prevChats.map((c) => {
          if (c.id !== chatId) return c;
          const updatedLastMsg = c.lastMessage
            ? {
                ...c.lastMessage,
                status:
                  c.lastMessage.senderEmail?.toLowerCase() !== myEmailLower
                    ? ('read' as const)
                    : c.lastMessage.status,
              }
            : undefined;
          return {
            ...c,
            unreadCount: 0,
            lastMessage: updatedLastMsg,
          };
        });

        // Save updated read receipts to Drive
        if (folderConfig?.id && syncStatus.connected) {
          const targetChat = nextChats.find((c) => c.id === chatId);
          saveMessagesToDrive(folderConfig.id, chatId, updatedMsgs, targetChat?.driveFolderId).catch((err) =>
            console.warn('Failed to save read status to Drive:', err)
          );
          saveChatsToDrive(folderConfig.id, nextChats).catch((err) =>
            console.warn('Failed to save chat read status to Drive:', err)
          );
        }
        return nextChats;
      });
    } else {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId && (c.unreadCount || 0) > 0 ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  /**
   * Periodic synchronization poller (every 5 seconds)
   * This ensures that whenever another user updates the shared Drive folder,
   * our screen receives their new messages automatically without a backend!
   */
  const startPolling = (folderId: string) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    pollingTimerRef.current = window.setInterval(async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;

        // Sync chats list
        const latestChats = await fetchChatsFromDrive(folderId);
        if (latestChats && latestChats.length > 0) {
          setChats((prevChats) => {
            return latestChats.map((lc) => {
              if (lc.id === selectedChatId) {
                return { ...lc, unreadCount: 0 };
              }
              const prevChat = prevChats.find((p) => p.id === lc.id);
              const prevTimestamp = prevChat?.lastMessage?.timestamp || 0;
              const newTimestamp = lc.lastMessage?.timestamp || 0;
              const isFromOther = lc.lastMessage?.senderEmail?.toLowerCase() !== currentUser?.email?.toLowerCase();
              if (newTimestamp > prevTimestamp && isFromOther) {
                const currentUnread = prevChat?.unreadCount || 0;
                return { ...lc, unreadCount: currentUnread + 1 };
              }
              return {
                ...lc,
                unreadCount: lc.id === selectedChatId ? 0 : lc.unreadCount ?? prevChat?.unreadCount ?? 0,
              };
            });
          });
        }

        // Sync active chat messages
        const currentActiveChatId = selectedChatIdRef.current;
        if (currentActiveChatId) {
          const targetChat =
            latestChats.find((c) => c.id === currentActiveChatId) ||
            chatsRef.current.find((c) => c.id === currentActiveChatId);
          const remoteMsgs = await fetchMessagesFromDrive(
            folderId,
            currentActiveChatId,
            targetChat?.driveFolderId
          );
          if (remoteMsgs && remoteMsgs.length > 0) {
            setMessagesMap((prev) => {
              const currentList = prev[currentActiveChatId] || [];
              const mergedMap = new Map<string, ChatMessage>();
              currentList.forEach((m) => mergedMap.set(m.id, m));
              remoteMsgs.forEach((m) => mergedMap.set(m.id, m));
              const sorted = Array.from(mergedMap.values()).sort(
                (a, b) => a.timestamp - b.timestamp
              );
              return { ...prev, [currentActiveChatId]: sorted };
            });
            // Auto mark incoming remote messages as read
            markChatMessagesAsRead(currentActiveChatId, remoteMsgs);
          }
        }

        setSyncStatus((prev) => ({
          ...prev,
          lastSyncedAt: Date.now(),
          connected: true,
        }));
      } catch (err) {
        console.warn('Sync tick skipped:', err);
      }
    }, 5000);
  };

  // Sync messages when selectedChatId changes
  useEffect(() => {
    if (!selectedChatId || !folderConfig?.id) return;

    const loadChatMessages = async () => {
      try {
        const targetChat =
          chatsRef.current.find((c) => c.id === selectedChatId) ||
          chats.find((c) => c.id === selectedChatId);
        const msgs = await fetchMessagesFromDrive(
          folderConfig.id,
          selectedChatId,
          targetChat?.driveFolderId
        );
        if (msgs && msgs.length > 0) {
          setMessagesMap((prev) => ({ ...prev, [selectedChatId]: msgs }));
          markChatMessagesAsRead(selectedChatId, msgs);
        } else {
          markChatMessagesAsRead(selectedChatId, []);
        }
      } catch (err) {
        console.error('Error fetching chat messages:', err);
      }
    };

    loadChatMessages();
  }, [selectedChatId, folderConfig?.id]);

  /**
   * Handle selecting a chat from the sidebar
   */
  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    markChatMessagesAsRead(chatId);
  };

  /**
   * Send a Text message
   */
  const handleSendMessage = async (
    text: string,
    media?: MediaAttachment,
    replyTo?: ChatMessage
  ) => {
    if (!selectedChatId) return;

    const senderEmail = currentUser?.email || 'you@example.com';
    const senderName = currentUser?.displayName || 'You';
    const senderAvatar = currentUser?.photoURL;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      chatId: selectedChatId,
      senderId: currentUser?.uid || 'user_self',
      senderName,
      senderEmail,
      senderAvatar,
      text,
      timestamp: Date.now(),
      status: 'delivered',
      media,
      replyTo: replyTo
        ? { id: replyTo.id, text: replyTo.text, senderName: replyTo.senderName }
        : undefined,
    };

    // Optimistic UI update
    const updatedMessages = [...(messagesMap[selectedChatId] || []), newMsg];
    setMessagesMap((prev) => ({ ...prev, [selectedChatId]: updatedMessages }));

    // Update chat last message
    const updatedChats = chats.map((c) =>
      c.id === selectedChatId
        ? {
            ...c,
            lastMessage: {
              text: media ? (media.type === 'audio' ? '🎤 Voice note' : '📷 Photo') : text,
              timestamp: Date.now(),
              senderName,
              senderEmail,
              senderId: currentUser?.uid || 'user_self',
              status: 'delivered' as const,
            },
            unreadCount: 0,
          }
        : c
    );
    setChats(updatedChats);

    // Save to Google Drive in background
    if (folderConfig?.id && syncStatus.connected) {
      try {
        const targetChat =
          chatsRef.current.find((c) => c.id === selectedChatId) ||
          chats.find((c) => c.id === selectedChatId);
        await saveMessagesToDrive(folderConfig.id, selectedChatId, updatedMessages, targetChat?.driveFolderId);
        await saveChatsToDrive(folderConfig.id, updatedChats);
        setSyncStatus((prev) => ({ ...prev, lastSyncedAt: Date.now() }));
      } catch (err) {
        console.error('Failed to sync message to Google Drive:', err);
      }
    }
  };

  /**
   * Send Audio Voice Note
   */
  const handleSendAudioNote = async (audioBlob: Blob, duration: number) => {
    if (!selectedChatId) return;

    let mediaAttachment: MediaAttachment;
    const targetChat = chats.find((c) => c.id === selectedChatId);

    if (folderConfig?.id && syncStatus.connected) {
      try {
        mediaAttachment = await uploadMediaToDrive(
          folderConfig.id,
          audioBlob,
          `voice_${Date.now()}.webm`,
          'audio',
          targetChat?.driveFolderId
        );
        mediaAttachment.duration = duration;
      } catch (err) {
        console.warn('Fallback local voice upload:', err);
        mediaAttachment = {
          id: `audio_${Date.now()}`,
          name: 'Voice Note',
          mimeType: audioBlob.type,
          size: audioBlob.size,
          url: URL.createObjectURL(audioBlob),
          type: 'audio',
          duration,
        };
      }
    } else {
      mediaAttachment = {
        id: `audio_${Date.now()}`,
        name: 'Voice Note',
        mimeType: audioBlob.type,
        size: audioBlob.size,
        url: URL.createObjectURL(audioBlob),
        type: 'audio',
        duration,
      };
    }

    await handleSendMessage('', mediaAttachment);
  };

  /**
   * Send Media File (Image, PDF, Document)
   */
  const handleSendMediaFile = async (file: File) => {
    if (!selectedChatId) return;

    const isImage = file.type.startsWith('image/');
    const fileType = isImage ? 'image' : 'document';
    const targetChat = chats.find((c) => c.id === selectedChatId);

    let mediaAttachment: MediaAttachment;

    if (folderConfig?.id && syncStatus.connected) {
      try {
        mediaAttachment = await uploadMediaToDrive(
          folderConfig.id,
          file,
          file.name,
          fileType,
          targetChat?.driveFolderId
        );
      } catch (err) {
        console.warn('Local preview fallback:', err);
        const objUrl = URL.createObjectURL(file);
        mediaAttachment = {
          id: `media_${Date.now()}`,
          name: file.name,
          mimeType: file.type,
          size: file.size,
          url: objUrl,
          thumbnailUrl: isImage ? objUrl : undefined,
          type: fileType,
        };
      }
    } else {
      const objUrl = URL.createObjectURL(file);
      mediaAttachment = {
        id: `media_${Date.now()}`,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        url: objUrl,
        thumbnailUrl: isImage ? objUrl : undefined,
        type: fileType,
      };
    }

    await handleSendMessage(isImage ? 'Shared an image' : `Shared file: ${file.name}`, mediaAttachment);
  };

  /**
   * React to Message with Emoji
   */
  const handleReactToMessage = async (messageId: string, emoji: string) => {
    if (!selectedChatId) return;

    const currentList = messagesMap[selectedChatId] || [];
    const userEmail = currentUser?.email?.toLowerCase() || 'you@example.com';
    const userName = currentUser?.displayName || userEmail.split('@')[0] || 'You';

    const updated = currentList.map((msg) => {
      if (msg.id !== messageId) return msg;
      const reactions = msg.reactions || [];
      const existingIdx = reactions.findIndex(
        (r) => r.userId?.toLowerCase() === userEmail && r.emoji === emoji
      );

      let newReactions;
      if (existingIdx >= 0) {
        newReactions = reactions.filter((_, idx) => idx !== existingIdx);
      } else {
        newReactions = [
          ...reactions,
          { emoji, userId: userEmail, userName },
        ];
      }
      return { ...msg, reactions: newReactions };
    });

    setMessagesMap((prev) => ({ ...prev, [selectedChatId]: updated }));

    if (folderConfig?.id && syncStatus.connected) {
      try {
        const targetChat = chats.find((c) => c.id === selectedChatId);
        await saveMessagesToDrive(folderConfig.id, selectedChatId, updated, targetChat?.driveFolderId);
      } catch (err) {
        console.error('Error saving reaction to Drive:', err);
      }
    }
  };

  /**
   * Star / Unstar Message (WhatsApp feature)
   */
  const handleToggleStarMessage = async (messageId: string) => {
    if (!selectedChatId) return;
    const currentList = messagesMap[selectedChatId] || [];
    const updated = currentList.map((m) =>
      m.id === messageId ? { ...m, starred: !m.starred } : m
    );
    setMessagesMap((prev) => ({ ...prev, [selectedChatId]: updated }));

    if (folderConfig?.id && syncStatus.connected) {
      const targetChat = chats.find((c) => c.id === selectedChatId);
      saveMessagesToDrive(
        folderConfig.id,
        selectedChatId,
        updated,
        targetChat?.driveFolderId
      ).catch((err) => console.error('Failed to sync star to Drive:', err));
    }
  };

  /**
   * Delete Message (Destructive operation: Prompt confirmation dialog per Workspace guidelines)
   */
  const handleRequestDeleteMessage = (message: ChatMessage) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete message from Google Drive?',
      message:
        'This message and its associated data will be permanently removed from your shared Google Drive messages file for all participants.',
      action: async () => {
        if (!selectedChatId) return;
        const currentList = messagesMap[selectedChatId] || [];
        const filtered = currentList.filter((m) => m.id !== message.id);
        setMessagesMap((prev) => ({ ...prev, [selectedChatId]: filtered }));

        if (folderConfig?.id && syncStatus.connected) {
          const targetChat = chats.find((c) => c.id === selectedChatId);
          await saveMessagesToDrive(folderConfig.id, selectedChatId, filtered, targetChat?.driveFolderId);
        }
      },
    });
  };

  /**
   * Delete Chat Room (Destructive operation)
   */
  const handleRequestDeleteChat = (chatId: string) => {
    const chatToDelete = chats.find((c) => c.id === chatId);
    setConfirmConfig({
      isOpen: true,
      title: `Delete chat "${chatToDelete?.name || 'Chat'}"?`,
      message:
        'This will remove the chat room from chats.json in your shared Google Drive folder. Messages may no longer be visible.',
      action: async () => {
        const filtered = chats.filter((c) => c.id !== chatId);
        setChats(filtered);
        if (selectedChatId === chatId) {
          setSelectedChatId(filtered[0]?.id || null);
        }
        if (folderConfig?.id && syncStatus.connected) {
          await saveChatsToDrive(folderConfig.id, filtered);
        }
      },
    });
  };

  /**
   * Create New Chat
   */
  const handleCreateChat = async (newChatData: Omit<ChatRoom, 'id' | 'createdAt'>) => {
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let subfolderId: string | undefined = undefined;

    if (folderConfig?.id && syncStatus.connected) {
      try {
        // Create an isolated subfolder for this chat room in Google Drive
        subfolderId = await getOrCreateChatSubfolder(folderConfig.id, chatId, newChatData.name);

        // Auto-grant permission on this subfolder to the other invited participants
        for (const p of newChatData.participants) {
          if (p.email && p.email.toLowerCase() !== currentUser?.email?.toLowerCase()) {
            await shareFolderWithEmail(subfolderId, p.email, 'writer').catch((err) =>
              console.warn(`Could not share subfolder with ${p.email}:`, err)
            );
          }
        }

        // Save room metadata (room.json) & initial empty messages file into shared room subfolder
        await saveRoomMetadataToDrive(subfolderId, {
          ...newChatData,
          id: chatId,
          createdAt: Date.now(),
          driveFolderId: subfolderId,
        });
        await saveMessagesToDrive(folderConfig.id, chatId, [], subfolderId);
      } catch (err) {
        console.warn('Subfolder creation fallback:', err);
      }
    }

    const newChat: ChatRoom = {
      ...newChatData,
      id: chatId,
      createdAt: Date.now(),
      driveFolderId: subfolderId,
    };

    // If direct chat, save the custom name as an alias for this contact
    if (!newChatData.isGroup) {
      const otherParticipant = newChatData.participants?.find(
        (p) => p.email?.toLowerCase() !== currentUser?.email?.toLowerCase()
      );
      if (
        otherParticipant &&
        newChatData.name &&
        newChatData.name.trim() !== otherParticipant.email
      ) {
        handleSaveAlias(otherParticipant.email, newChatData.name);
      }
    }

    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    setSelectedChatId(newChat.id);

    if (folderConfig?.id && syncStatus.connected) {
      await saveChatsToDrive(folderConfig.id, updatedChats);
    }
  };

  /**
   * Switch Google Drive Folder
   */
  const handleSwitchFolder = async (newFolderId: string) => {
    const folder = await getOrCreateRootFolder(newFolderId);
    setFolderConfig(folder);

    // Update URL query param so refresh preserves the chosen folder
    const url = new URL(window.location.href);
    url.searchParams.set('folderId', folder.id);
    window.history.replaceState({}, '', url.toString());

    // Ensure folder has chats.json initialized if completely new
    const driveChats = await ensureFolderInitialized(folder.id, []);
    setChats(driveChats);
    setSelectedChatId(driveChats[0]?.id || null);

    setSyncStatus((prev) => ({
      ...prev,
      lastSyncedAt: Date.now(),
      folderConfig: folder,
      connected: true,
    }));

    startPolling(folder.id);
  };

  /**
   * Force manual sync
   */
  const handleForceSync = async () => {
    if (!folderConfig?.id) return;
    setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
    try {
      const driveChats = await fetchChatsFromDrive(folderConfig.id);
      if (driveChats && driveChats.length > 0) setChats(driveChats);

      if (selectedChatId) {
        const msgs = await fetchMessagesFromDrive(folderConfig.id, selectedChatId);
        if (msgs) {
          setMessagesMap((prev) => ({ ...prev, [selectedChatId]: msgs }));
        }
      }
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: Date.now(),
        connected: true,
      }));
    } catch (err: any) {
      setSyncStatus((prev) => ({ ...prev, isSyncing: false, error: err.message }));
    }
  };

  /**
   * Sign Out
   */
  const handleSignOut = async () => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    await logout();
    setCurrentUser(null);
    setFolderConfig(null);
    setSyncStatus({
      isSyncing: false,
      lastSyncedAt: null,
      folderConfig: null,
      error: null,
      connected: false,
    });
    setNeedsAuth(true);
  };

  const myEmail = currentUser?.email?.toLowerCase();
  const visibleChats = chats.filter(
    (c) =>
      !myEmail ||
      c.participants?.some((p) => p.email.toLowerCase() === myEmail) ||
      c.createdBy?.toLowerCase() === myEmail ||
      c.id === 'chat_drive_general'
  );
  const activeChat = selectedChatId
    ? visibleChats.find((c) => c.id === selectedChatId) || null
    : null;
  const activeMessages = selectedChatId ? messagesMap[selectedChatId] || [] : [];

  return (
    <div className={`w-screen h-screen overflow-hidden flex flex-col bg-[#0c1317]`}>
      {/* WhatsApp Web Green Top Banner Decoration */}
      <div className="h-32 bg-[#00a884] absolute top-0 left-0 right-0 z-0 hidden lg:block" />

      {/* Main WhatsApp Window Container */}
      <div className="relative z-10 w-full h-[100dvh] lg:h-[calc(100vh-38px)] lg:w-[calc(100vw-38px)] lg:m-auto lg:rounded-lg shadow-2xl flex flex-col md:flex-row overflow-hidden border border-[#222d34]/60 bg-[#111b21]">
        {/* Left Sidebar: on mobile, shown when no chat is selected; on md+ always shown */}
        <div
          className={`h-full ${
            selectedChatId ? 'hidden md:flex' : 'flex'
          } w-full md:w-auto shrink-0 flex-col min-h-0 overflow-hidden`}
        >
          <Sidebar
            chats={chats}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            currentUser={currentUser}
            syncStatus={syncStatus}
            folderConfig={folderConfig}
            contactAliases={contactAliases}
            onOpenNewChat={() => setIsNewChatOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenFolderSettings={() => setIsFolderSettingsOpen(true)}
            onForceSync={handleForceSync}
            onSignOut={handleSignOut}
            onDeleteChat={handleRequestDeleteChat}
            onOpenRenameModal={(chat) => setRenameChatTarget(chat)}
            darkMode={darkMode}
            onToggleTheme={() => setDarkMode(!darkMode)}
          />
        </div>

        {/* Right Chat Area: on mobile, shown when chat is selected; on md+ takes remaining space */}
        <div
          className={`h-full flex-1 ${
            !selectedChatId ? 'hidden md:flex' : 'flex'
          } flex-col min-w-0 overflow-hidden`}
        >
          {activeChat ? (
            <ChatArea
              chat={activeChat}
              messages={activeMessages}
              currentUser={currentUser}
              contactAliases={contactAliases}
              onSendMessage={handleSendMessage}
              onSendAudioNote={handleSendAudioNote}
              onSendMediaFile={handleSendMediaFile}
              onReactToMessage={handleReactToMessage}
              onRequestDeleteMessage={handleRequestDeleteMessage}
              onOpenFolderSettings={() => setIsFolderSettingsOpen(true)}
              onOpenRenameModal={(chat) => setRenameChatTarget(chat)}
              onBack={() => setSelectedChatId(null)}
              onToggleStarMessage={handleToggleStarMessage}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#222e35] text-[#8696a0] border-b-6 border-[#00a884] p-6 sm:p-8 text-center space-y-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#111b21] flex items-center justify-center text-[#00a884] shadow-lg">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <h2 className="text-xl sm:text-2xl font-light text-[#e9edef]">OmniChat for Google Drive</h2>
              <p className="text-xs max-w-md text-[#8696a0] leading-relaxed">
                Send and receive messages with multimedia & voice notes. Synchronized automatically via your private OmniChat Google Drive folder.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsNewChatOpen(true)}
                  className="px-5 py-2.5 bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] rounded-lg font-semibold text-xs transition-transform active:scale-95 shadow-md"
                >
                  + Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sign In Prompt Overlay if unauthenticated */}
      {needsAuth && (
        <SignInPrompt
          onSignIn={handleLogin}
          isLoading={isLoggingIn}
          errorMessage={authErrorMessage}
          onClearError={() => setAuthErrorMessage(null)}
          onContinueAsGuest={() => {
            setNeedsAuth(false);
            setIsGuestMode(true);
          }}
        />
      )}

      {/* Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        currentUser={currentUser}
        currentUserEmail={currentUser?.email || 'you@example.com'}
        onCreateChat={handleCreateChat}
      />

      <FolderSyncModal
        isOpen={isFolderSettingsOpen}
        onClose={() => setIsFolderSettingsOpen(false)}
        folderConfig={folderConfig}
        syncStatus={syncStatus}
        onSwitchFolder={handleSwitchFolder}
        onForceSync={handleForceSync}
      />

      {/* Profile & Status Customization Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* Rename Contact (Local Alias / Nickname) Modal */}
      {renameChatTarget && (
        <RenameContactModal
          isOpen={!!renameChatTarget}
          onClose={() => setRenameChatTarget(null)}
          chatId={renameChatTarget.id}
          contactEmail={
            renameChatTarget.isGroup
              ? undefined
              : renameChatTarget.participants?.find(
                  (p) =>
                    p.email?.toLowerCase() !== currentUser?.email?.toLowerCase()
                )?.email
          }
          currentDisplayName={renameChatTarget.name}
          originalName={
            renameChatTarget.isGroup
              ? renameChatTarget.name
              : renameChatTarget.participants?.find(
                  (p) =>
                    p.email?.toLowerCase() !== currentUser?.email?.toLowerCase()
                )?.name || renameChatTarget.name
          }
          currentAlias={
            renameChatTarget.isGroup
              ? contactAliases[renameChatTarget.id]
              : contactAliases[
                  renameChatTarget.participants?.find(
                    (p) =>
                      p.email?.toLowerCase() !==
                      currentUser?.email?.toLowerCase()
                  )?.email?.toLowerCase() || ''
                ] || contactAliases[renameChatTarget.id]
          }
          isGroup={renameChatTarget.isGroup}
          onSaveAlias={handleSaveAlias}
        />
      )}

      {/* Explicit User Confirmation Modal for Destructive Operations (Workspace Skill) */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isLoading={isConfirmLoading}
        onConfirm={async () => {
          setIsConfirmLoading(true);
          try {
            await confirmConfig.action();
            setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          } catch (err) {
            console.error('Confirmation action error:', err);
          } finally {
            setIsConfirmLoading(false);
          }
        }}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
