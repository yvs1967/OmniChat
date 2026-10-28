import React, { useState } from 'react';
import { X, Users, User, Plus, MessageSquare, Mail } from 'lucide-react';
import { ChatRoom, UserProfile } from '../types';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  currentUserEmail: string;
  onCreateChat: (chat: Omit<ChatRoom, 'id' | 'createdAt'>) => Promise<void>;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentUserEmail,
  onCreateChat,
}) => {
  const [isGroup, setIsGroup] = useState(false);
  const [name, setName] = useState('');
  const [directEmail, setDirectEmail] = useState('');
  const [participantInput, setParticipantInput] = useState('');
  const [groupParticipants, setGroupParticipants] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddGroupParticipant = () => {
    const email = participantInput.trim().toLowerCase();
    if (email && !groupParticipants.includes(email) && email !== currentUserEmail.toLowerCase()) {
      setGroupParticipants([...groupParticipants, email]);
      setParticipantInput('');
    }
  };

  const handleRemoveGroupParticipant = (email: string) => {
    setGroupParticipants(groupParticipants.filter((p) => p !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const myEmail = currentUser?.email || currentUserEmail;
    const myName = currentUser?.displayName || myEmail.split('@')[0] || 'You';
    const myAvatar =
      currentUser?.photoURL ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(myEmail)}`;

    if (!name.trim()) {
      setErrorMsg('Please enter a name.');
      return;
    }

    if (!isGroup && !directEmail.trim()) {
      setErrorMsg('Please enter the contact\'s Gmail address.');
      return;
    }

    if (isGroup && groupParticipants.length === 0) {
      setErrorMsg('Please add at least one participant to the group.');
      return;
    }

    setIsSubmitting(true);
    try {
      let allParticipants: { email: string; name: string; avatar?: string }[] = [];

      if (!isGroup) {
        const contactEmail = directEmail.trim().toLowerCase();
        const contactName = name.trim();
        allParticipants = [
          {
            email: myEmail.toLowerCase(),
            name: myName,
            avatar: myAvatar,
          },
          {
            email: contactEmail,
            name: contactName,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
              contactEmail
            )}`,
          },
        ];
      } else {
        allParticipants = [
          {
            email: myEmail.toLowerCase(),
            name: myName,
            avatar: myAvatar,
          },
          ...groupParticipants.map((email) => ({
            email: email.toLowerCase(),
            name: email.split('@')[0],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
          })),
        ];
      }

      await onCreateChat({
        name: name.trim(),
        isGroup,
        avatar: isGroup
          ? `https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80`
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
              !isGroup ? directEmail.trim() : name
            )}`,
        participants: allParticipants,
        createdBy: myEmail.toLowerCase(),
        lastMessage: {
          text: isGroup ? 'Group created' : 'Chat started',
          timestamp: Date.now(),
          senderName: myName,
        },
        unreadCount: 0,
        pinned: false,
      });

      // Reset
      setName('');
      setDirectEmail('');
      setGroupParticipants([]);
      onClose();
    } catch (err: any) {
      console.error('Failed to create chat:', err);
      setErrorMsg(err.message || 'Failed to create chat room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#222e35] text-[#e9edef] rounded-xl shadow-2xl border border-[#374248] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#202c33] border-b border-[#374248] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00a884]/20 text-[#00a884] rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#e9edef]">
                {isGroup ? 'New Group Chat' : 'New Direct Contact'}
              </h3>
              <p className="text-xs text-[#8696a0]">
                {isGroup ? 'Shared group with multiple members' : 'Private 1-on-1 conversation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8696a0] hover:text-[#e9edef] p-1 rounded-md hover:bg-[#374248] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {/* Type Toggle */}
          <div className="flex bg-[#111b21] p-1 rounded-lg border border-[#374248]">
            <button
              type="button"
              onClick={() => {
                setIsGroup(false);
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${
                !isGroup ? 'bg-[#00a884] text-[#111b21]' : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              <User className="w-4 h-4" /> Direct Contact
            </button>
            <button
              type="button"
              onClick={() => {
                setIsGroup(true);
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${
                isGroup ? 'bg-[#00a884] text-[#111b21]' : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              <Users className="w-4 h-4" /> Group Chat
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
              {isGroup ? 'Group Subject / Name' : "Contact Name (e.g. Bob)"}
            </label>
            <input
              type="text"
              required
              placeholder={isGroup ? 'e.g. Marketing Team, Family Trip' : 'e.g. Bob, Alice Smith'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#111b21] border border-[#374248] rounded-lg px-3 py-2 text-sm text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884] outline-none"
            />
          </div>

          {/* 1-on-1 Contact Email */}
          {!isGroup ? (
            <div>
              <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                Contact's Gmail Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="bob@gmail.com"
                  value={directEmail}
                  onChange={(e) => setDirectEmail(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#374248] rounded-lg pl-9 pr-3 py-2 text-sm text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884] outline-none"
                />
                <Mail className="w-4 h-4 text-[#8696a0] absolute left-3 top-2.5" />
              </div>
              <p className="text-[11px] text-[#8696a0] mt-1.5">
                When they sign in, they will see this chat as <span className="text-[#00a884]">{currentUser?.displayName || 'your name'}</span>!
              </p>
            </div>
          ) : (
            /* Group Participants Field */
            <div>
              <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                Add Group Members (Gmail addresses)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="email"
                  placeholder="member@gmail.com"
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGroupParticipant();
                    }
                  }}
                  className="flex-1 bg-[#111b21] border border-[#374248] rounded-lg px-3 py-1.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddGroupParticipant}
                  className="px-3 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] border border-[#00a884]/40 rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {groupParticipants.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 max-h-28 overflow-y-auto">
                  {groupParticipants.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 bg-[#202c33] text-[#d1d7db] text-xs px-2.5 py-1 rounded-full border border-[#374248]"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGroupParticipant(email)}
                        className="text-[#8696a0] hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#374248]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-[#8696a0] hover:text-[#e9edef] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-[#111b21]/30 border-t-[#111b21] rounded-full animate-spin" />
              )}
              Create Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
