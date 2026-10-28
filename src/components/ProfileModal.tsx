import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  User,
  Info,
  Check,
  Smile,
  Upload,
  RotateCcw,
  Sparkles,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUpdateProfile: (updatedProfile: Partial<UserProfile>) => Promise<void>;
}

const PRESET_STATUSES = [
  'Available',
  'Busy',
  'At work',
  'At school',
  'In a meeting',
  'Battery about to die',
  'Can\'t talk, OmniChat only',
  'Urgent calls only',
  'Sleeping',
  'Hey there! I am using OmniChat',
];

const AVATAR_PRESETS = [
  'Alex',
  'Bob',
  'Charlie',
  'Diana',
  'Elena',
  'Felix',
  'Grace',
  'Leo',
  'Maya',
  'Zack',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
}) => {
  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || currentUser?.email?.split('@')[0] || 'OmniChat User'
  );
  const [statusText, setStatusText] = useState(
    currentUser?.status || 'Available'
  );
  const [photoURL, setPhotoURL] = useState(
    currentUser?.photoURL ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        currentUser?.email || 'OmniChat'
      )}`
  );
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please choose an image under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotoURL(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPresetAvatar = (seed: string) => {
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    setPhotoURL(url);
  };

  const handleResetPhoto = () => {
    const fallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      currentUser?.email || 'OmniChat'
    )}`;
    setPhotoURL(fallback);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSaving(true);
    try {
      await onUpdateProfile({
        displayName: displayName.trim(),
        status: statusText.trim(),
        photoURL,
      });
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#222e35] rounded-2xl shadow-2xl border border-[#374248] overflow-hidden text-[#e9edef] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#e9edef]">Profile & Status</h3>
              <p className="text-xs text-[#8696a0]">
                Customize your avatar, display name, and about message
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#374248] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <img
                src={photoURL}
                alt="Profile Preview"
                className="w-28 h-28 rounded-full object-cover border-3 border-[#00a884] shadow-xl bg-[#111b21]"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs gap-1 font-medium cursor-pointer"
                title="Upload Photo"
              >
                <Camera className="w-6 h-6 text-[#00a884]" />
                <span>Change Photo</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] rounded-full shadow-lg transition-transform active:scale-95"
                title="Upload Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#111b21] hover:bg-[#202c33] text-[#00a884] border border-[#00a884]/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Photo
              </button>
              <button
                type="button"
                onClick={handleResetPhoto}
                className="px-3 py-1.5 bg-[#111b21] hover:bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] border border-[#374248] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Reset to default avatar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            {/* Avatar Presets Selection */}
            <div className="w-full bg-[#111b21] p-3 rounded-xl border border-[#2a3942] space-y-2 mt-1">
              <div className="flex items-center justify-between text-xs text-[#8696a0]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Quick Avatar Styles
                </span>
                <span className="text-[10px]">Click any to preview</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                {AVATAR_PRESETS.map((seed) => {
                  const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                    seed
                  )}`;
                  const isSelected = photoURL === url;
                  return (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(seed)}
                      className={`relative shrink-0 rounded-full transition-transform hover:scale-105 ${
                        isSelected
                          ? 'ring-2 ring-[#00a884] ring-offset-2 ring-offset-[#111b21]'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={seed} className="w-9 h-9 rounded-full bg-[#202c33]" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Display Name Section */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#00a884]">
              Your Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                placeholder="Enter your name..."
                className="w-full bg-[#111b21] border border-[#374248] rounded-lg px-3.5 py-2.5 text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] transition-colors"
              />
              <User className="w-4 h-4 text-[#8696a0] absolute right-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[11px] text-[#8696a0]">
              This is the name your chat partners and group members will see across OmniChat.
            </p>
          </div>

          {/* About / Status Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#00a884]">
              About / Status
            </label>
            <div className="relative">
              <input
                type="text"
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                maxLength={80}
                placeholder="Add status or about info..."
                className="w-full bg-[#111b21] border border-[#374248] rounded-lg px-3.5 py-2.5 text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] transition-colors"
              />
              <Smile className="w-4 h-4 text-[#8696a0] absolute right-3 top-3 pointer-events-none" />
            </div>

            {/* Quick Presets */}
            <div className="bg-[#111b21] p-3 rounded-xl border border-[#2a3942] space-y-2">
              <span className="text-[11px] text-[#8696a0] block font-medium">
                Choose a preset status:
              </span>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                {PRESET_STATUSES.map((preset) => {
                  const isCurrent = statusText === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStatusText(preset)}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-xs truncate transition-colors flex items-center justify-between ${
                        isCurrent
                          ? 'bg-[#00a884]/20 text-[#00a884] font-medium border border-[#00a884]/30'
                          : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]'
                      }`}
                    >
                      <span className="truncate">{preset}</span>
                      {isCurrent && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Account & Drive Metadata */}
          <div className="p-3 bg-[#111b21] rounded-xl border border-[#2a3942] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#8696a0]">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-[#00a884]" />
                Google Drive Storage Sync
              </span>
              <span className="text-[#00a884] font-medium font-mono">
                OmniChat_Data/chats.json
              </span>
            </div>
            <div className="flex items-center justify-between text-[#8696a0]">
              <span>Email:</span>
              <span className="text-[#e9edef] font-mono">{currentUser?.email || 'Not connected'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8696a0] pt-1 border-t border-[#222d34]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00a884] shrink-0" />
              <span>
                Your photo and status will automatically update for your contacts in Google Drive.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#202c33] border-t border-[#2a3942] flex items-center justify-between shrink-0">
          <div>
            {successToast && (
              <span className="text-xs text-[#00a884] flex items-center gap-1 font-medium animate-in fade-in">
                <Check className="w-4 h-4" /> Profile saved!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#111b21] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !displayName.trim()}
              className="px-5 py-2 bg-[#00a884] hover:bg-[#06cf9c] disabled:opacity-50 text-[#111b21] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
