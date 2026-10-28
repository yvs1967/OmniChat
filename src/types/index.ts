export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  status?: string;
  customName?: string;
}

export interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface MediaAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  driveFileId?: string;
  url: string; // Blob URL or Drive download URL or Data URL
  thumbnailUrl?: string;
  type: 'image' | 'audio' | 'document' | 'video';
  duration?: number; // for audio voice notes
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar?: string;
  text: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  media?: MediaAttachment;
  reactions?: Reaction[];
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  driveFileId?: string; // ID of the JSON file in Google Drive if individual message file
  starred?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  isGroup: boolean;
  avatar?: string;
  participants: {
    email: string;
    name: string;
    avatar?: string;
    status?: string;
  }[];
  lastMessage?: {
    text: string;
    timestamp: number;
    senderName: string;
    senderEmail?: string;
    senderId?: string;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
  };
  unreadCount?: number;
  unreadCountByUser?: Record<string, number>;
  lastReadByUser?: Record<string, number>;
  pinned?: boolean;
  createdAt: number;
  createdBy: string;
  driveFolderId?: string; // Subfolder in drive if applicable
}

export interface DriveFolderConfig {
  id: string;
  name: string;
  webViewLink?: string;
  isShared: boolean;
  ownerEmail?: string;
}

export interface SyncEngineStatus {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  folderConfig: DriveFolderConfig | null;
  error: string | null;
  connected: boolean;
}

export interface DrivePermission {
  id: string;
  displayName?: string;
  emailAddress?: string;
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
  photoLink?: string;
}
