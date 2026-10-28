import { ChatRoom, UserProfile } from '../types';

export interface ChatDisplayInfo {
  name: string;
  originalName: string;
  avatar: string;
  subtitle: string;
  isGroup: boolean;
  recipientEmail?: string;
  otherParticipant?: {
    email: string;
    name: string;
    avatar?: string;
    status?: string;
  };
  hasCustomAlias?: boolean;
  status?: string;
}

/**
 * Computes dynamic chat display name, avatar, and status based on:
 * 1. The currently logged-in user (ensuring Alex sees Bob, and Bob sees Alex)
 * 2. User-specific custom contact aliases/nicknames (e.g. Alex naming Bob "Bob Newyork")
 *    which are stored locally for that user only and do not alter the contact's own account.
 */
export function getChatDisplayInfo(
  chat: ChatRoom,
  currentUser: UserProfile | null,
  contactAliases?: Record<string, string>
): ChatDisplayInfo {
  if (chat.isGroup) {
    const count = chat.participants?.length || 0;
    const groupAlias = contactAliases?.[chat.id];
    return {
      name: groupAlias || chat.name,
      originalName: chat.name,
      avatar:
        chat.avatar ||
        `https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80`,
      subtitle: `${count} participants`,
      isGroup: true,
      hasCustomAlias: !!groupAlias,
    };
  }

  const myEmail = currentUser?.email?.trim().toLowerCase();

  // Find the other participant who is not the current user
  const other =
    chat.participants?.find((p) => p.email?.trim().toLowerCase() !== myEmail) ||
    chat.participants?.[0];

  if (!other) {
    const fallbackAlias = contactAliases?.[chat.id];
    return {
      name: fallbackAlias || chat.name,
      originalName: chat.name,
      avatar:
        chat.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(chat.name)}`,
      subtitle: 'Direct contact',
      isGroup: false,
      hasCustomAlias: !!fallbackAlias,
    };
  }

  const isSelf = myEmail && other.email?.trim().toLowerCase() === myEmail;
  let originalName = other.name || chat.name;

  if (!isSelf) {
    if (other.name && other.name !== 'You' && other.name.trim() !== '') {
      originalName = other.name;
    } else if (other.email) {
      originalName = other.email.split('@')[0];
    }
  } else {
    if (chat.name && !chat.name.toLowerCase().includes(myEmail || '')) {
      originalName = chat.name;
    }
  }

  // Check if current user has assigned a custom nickname/alias for this contact or room
  const otherEmailLower = other.email?.trim().toLowerCase();
  const alias =
    (otherEmailLower && contactAliases?.[otherEmailLower]) ||
    contactAliases?.[chat.id];

  const hasCustomAlias = Boolean(alias && alias.trim() !== '');
  const finalDisplayName = hasCustomAlias ? (alias as string).trim() : originalName;

  const avatar =
    other.avatar ||
    (other.email
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(other.email)}`
      : chat.avatar) ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalDisplayName)}`;

  const statusText = other.status || 'Hey there! I am using OmniChat';

  return {
    name: finalDisplayName,
    originalName,
    avatar,
    subtitle: other.status ? other.status : (other.email || 'Direct message'),
    isGroup: false,
    recipientEmail: other.email,
    otherParticipant: other,
    hasCustomAlias,
    status: statusText,
  };
}
