import React, { useState, useEffect } from 'react';
import {
  X,
  FolderSync,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Share2,
  Users,
  HardDrive,
  UserPlus,
  Shield,
  HelpCircle,
  Sparkles,
  FolderTree,
  FileJson,
  Folder,
  Lock,
  FileText,
  Image as ImageIcon,
  Mic,
  Info,
} from 'lucide-react';
import { DriveFolderConfig, SyncEngineStatus, DrivePermission } from '../types';
import { shareFolderWithEmail, fetchFolderPermissions } from '../services/driveSync';

interface FolderSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderConfig: DriveFolderConfig | null;
  syncStatus: SyncEngineStatus;
  onSwitchFolder: (folderId: string) => Promise<void>;
  onForceSync: () => Promise<void>;
}

export const FolderSyncModal: React.FC<FolderSyncModalProps> = ({
  isOpen,
  onClose,
  folderConfig,
  syncStatus,
  onSwitchFolder,
  onForceSync,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'share' | 'connect'>('details');
  const [folderInput, setFolderInput] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // In-app Gmail Share state
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'writer' | 'reader'>('writer');
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);

  // Permissions list
  const [permissions, setPermissions] = useState<DrivePermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    if (isOpen && folderConfig?.id) {
      loadPermissions(folderConfig.id);
    }
  }, [isOpen, folderConfig?.id]);

  const loadPermissions = async (folderId: string) => {
    setLoadingPermissions(true);
    try {
      const list = await fetchFolderPermissions(folderId);
      setPermissions(list);
    } catch {
      // ignore
    } finally {
      setLoadingPermissions(false);
    }
  };

  if (!isOpen) return null;

  const handleConnectCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderInput.trim()) return;

    let targetId = folderInput.trim();
    if (targetId.includes('folders/')) {
      const match = targetId.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) targetId = match[1];
    }

    setIsSwitching(true);
    setErrorMsg(null);
    try {
      await onSwitchFolder(targetId);
      setFolderInput('');
      await loadPermissions(targetId);
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          'Failed to connect to folder. Ensure the folder exists and your Google account has Editor access.'
      );
    } finally {
      setIsSwitching(false);
    }
  };

  const handleShareWithGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim() || !folderConfig?.id) return;

    setIsSharing(true);
    setShareSuccessMsg(null);
    setErrorMsg(null);

    try {
      await shareFolderWithEmail(folderConfig.id, shareEmail.trim().toLowerCase(), shareRole);
      setShareSuccessMsg(`Successfully shared with ${shareEmail}! Google sent them access.`);
      setShareEmail('');
      await loadPermissions(folderConfig.id);
    } catch (err: any) {
      setErrorMsg(
        `Failed to share: ${err.message}. If you are not the folder owner, please ask the folder owner to share it in Google Drive.`
      );
    } finally {
      setIsSharing(false);
    }
  };

  const getInviteLink = () => {
    if (!folderConfig?.id) return window.location.href;
    const url = new URL(window.location.href);
    url.searchParams.set('folderId', folderConfig.id);
    return url.toString();
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(getInviteLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyFolderIdOnly = () => {
    if (!folderConfig?.id) return;
    navigator.clipboard.writeText(folderConfig.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#222e35] text-[#e9edef] rounded-xl shadow-2xl border border-[#374248] flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#202c33] border-b border-[#374248] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00a884]/20 text-[#00a884] rounded-lg">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#e9edef]">OmniChat Google Drive Hub</h3>
              <p className="text-xs text-[#8696a0]">
                Folder architecture, file locations & Gmail sharing
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

        {/* Tab Navigation */}
        <div className="flex border-b border-[#374248] bg-[#1a242a] px-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-[#00a884] text-[#00a884] bg-[#222e35]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Folder & File Locations</span>
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'share'
                ? 'border-[#00a884] text-[#00a884] bg-[#222e35]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Share with Gmail</span>
          </button>
          <button
            onClick={() => setActiveTab('connect')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'connect'
                ? 'border-[#00a884] text-[#00a884] bg-[#222e35]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Connect Folder</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          {/* TAB 1: Folder & File Details / Tree */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Active Folder Card */}
              <div className="p-4 bg-[#111b21] rounded-lg border border-[#374248] space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className="w-5 h-5 text-[#00a884]" />
                    <div>
                      <span className="font-semibold text-white text-sm block">
                        {folderConfig?.name || 'OmniChat_Data'}
                      </span>
                      <span className="text-[11px] text-[#8696a0]">
                        Root folder in your Google Drive
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                      syncStatus.connected
                        ? 'bg-[#00a884]/20 text-[#00a884]'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        syncStatus.connected ? 'bg-[#00a884] animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    {syncStatus.connected ? 'Live Syncing' : 'Connecting...'}
                  </span>
                </div>

                {folderConfig?.id && (
                  <div className="text-xs space-y-1">
                    <div className="text-[#8696a0]">Folder ID:</div>
                    <div className="flex items-center justify-between bg-[#202c33] px-3 py-1.5 rounded border border-[#374248] font-mono text-[#53bdeb] text-xs">
                      <span className="truncate mr-2">{folderConfig.id}</span>
                      <button
                        onClick={copyFolderIdOnly}
                        className="text-[#8696a0] hover:text-[#e9edef] shrink-0"
                        title="Copy Folder ID"
                      >
                        {copiedId ? (
                          <Check className="w-3.5 h-3.5 text-[#00a884]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#374248]/50 text-xs">
                  <span className="text-[#8696a0]">
                    Last synced:{' '}
                    {syncStatus.lastSyncedAt
                      ? new Date(syncStatus.lastSyncedAt).toLocaleTimeString()
                      : 'Just now'}
                  </span>
                  <div className="flex items-center gap-3">
                    {folderConfig?.webViewLink && (
                      <a
                        href={folderConfig.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-[#00a884] text-[#111b21] font-semibold rounded hover:bg-[#06cf9c] flex items-center gap-1.5 text-xs transition-colors"
                      >
                        Open in Google Drive <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={onForceSync}
                      disabled={syncStatus.isSyncing}
                      className="px-2.5 py-1 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] rounded border border-[#374248] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${
                          syncStatus.isSyncing ? 'animate-spin text-[#00a884]' : ''
                        }`}
                      />
                      Sync Now
                    </button>
                  </div>
                </div>
              </div>

              {/* DIRECTORY TREE ARCHITECTURE (EXACT LOCATIONS) */}
              <div className="p-4 bg-[#111b21] rounded-lg border border-[#374248] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-semibold text-xs sm:text-sm flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-[#00a884]" />
                    Where Files & Folders are Created in Google Drive
                  </h4>
                  <span className="text-[11px] font-mono text-[#00a884]">Drive Structure</span>
                </div>

                <p className="text-xs text-[#8696a0] leading-relaxed">
                  OmniChat uses your Google Drive as a decentralized serverless database. Here is the exact
                  folder hierarchy and purpose of each item:
                </p>

                {/* Visual Tree */}
                <div className="p-3 bg-[#0b141a] rounded-lg border border-[#374248] font-mono text-xs text-[#d1d7db] space-y-2">
                  <div className="flex items-center gap-2 text-[#00a884] font-bold">
                    <Folder className="w-4 h-4" />
                    <span>My Drive / OmniChat_Data/</span>
                    <span className="text-[10px] font-normal text-[#8696a0] font-sans">
                      (Root app folder created automatically)
                    </span>
                  </div>

                  <div className="pl-5 border-l-2 border-[#202c33] ml-2 space-y-2.5">
                    {/* chats.json */}
                    <div className="flex items-start gap-2 pt-1">
                      <FileJson className="w-4 h-4 text-[#53bdeb] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#53bdeb] font-semibold">chats.json</span>
                        <p className="text-[11px] text-[#8696a0] font-sans">
                          Index of all chat rooms, member emails, unread counts, and last message previews.
                        </p>
                      </div>
                    </div>

                    {/* chats/ subfolder */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2 text-amber-400 font-semibold">
                        <Folder className="w-4 h-4" />
                        <span>chats/</span>
                        <span className="text-[10px] font-normal text-[#8696a0] font-sans">
                          (Dedicated subfolders for room privacy)
                        </span>
                      </div>
                      <div className="pl-5 border-l-2 border-[#202c33] ml-2 space-y-1.5 text-[11px]">
                        <div className="flex items-start gap-2">
                          <Lock className="w-3.5 h-3.5 text-[#00a884] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-white">room_{'{chatId}'}/</span>
                            <span className="text-[#8696a0] font-sans block">
                              Private subfolder for each conversation. Only invited participants have Drive access.
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 pl-4">
                          <FileJson className="w-3.5 h-3.5 text-[#53bdeb] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[#53bdeb]">messages_{'{chatId}'}.json</span>
                            <span className="text-[#8696a0] font-sans block">
                              The full encrypted chat log and reactions for that specific room.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* media/ subfolder */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center gap-2 text-purple-400 font-semibold">
                        <Folder className="w-4 h-4" />
                        <span>media/</span>
                        <span className="text-[10px] font-normal text-[#8696a0] font-sans">
                          (Media attachments storage)
                        </span>
                      </div>
                      <div className="pl-5 border-l-2 border-[#202c33] ml-2 space-y-1 text-[11px] text-[#8696a0] font-sans">
                        <div className="flex items-center gap-2 text-purple-300">
                          <Mic className="w-3.5 h-3.5 text-[#00a884]" />
                          <span>voice_*.webm (Recorded audio voice notes)</span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-300">
                          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                          <span>photo_*.jpg (Shared photos & images)</span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-300">
                          <FileText className="w-3.5 h-3.5 text-amber-300" />
                          <span>doc_*.pdf (Documents & attachments)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Where to view on Google Drive */}
                <div className="p-3 bg-[#202c33] rounded-lg border border-[#374248] text-xs space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#00a884]" />
                    How to view directly inside Google Drive:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[#8696a0] text-[11px]">
                    <li>
                      <strong className="text-white">Folder Creator:</strong> Go to{' '}
                      <a
                        href="https://drive.google.com/drive/u/0/my-drive"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#00a884] hover:underline"
                      >
                        drive.google.com (My Drive)
                      </a>{' '}
                      and you will see the <code className="text-[#00a884]">OmniChat_Data</code> folder.
                    </li>
                    <li>
                      <strong className="text-white">Invited Friends / Colleagues:</strong> Check the{' '}
                      <a
                        href="https://drive.google.com/drive/u/0/shared-with-me"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#00a884] hover:underline"
                      >
                        "Shared with me"
                      </a>{' '}
                      tab in Google Drive, or click the direct chat invite link.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Share with Gmail */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#111b21] rounded-lg border border-[#374248] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
                    <UserPlus className="w-4 h-4 text-[#00a884]" />
                    <span>Invite Gmail Accounts to OmniChat</span>
                  </div>
                  <span className="text-[11px] text-[#00a884] font-medium">In-App Share</span>
                </div>
                <p className="text-xs text-[#8696a0] leading-relaxed">
                  Enter the Gmail address of the person you want to chat with. The app grants them
                  Google Drive access so messages and media synchronize automatically:
                </p>

                <form onSubmit={handleShareWithGmail} className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      required
                      placeholder="friend.email@gmail.com"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      className="flex-1 bg-[#202c33] border border-[#374248] rounded px-3 py-1.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884] outline-none"
                    />
                    <select
                      value={shareRole}
                      onChange={(e) => setShareRole(e.target.value as any)}
                      className="bg-[#202c33] border border-[#374248] rounded px-2.5 py-1.5 text-xs text-[#d1d7db] outline-none"
                    >
                      <option value="writer">Editor (Can chat & send files)</option>
                      <option value="reader">Viewer (Read-only)</option>
                    </select>
                    <button
                      type="submit"
                      disabled={isSharing || !shareEmail.trim()}
                      className="px-4 py-1.5 bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] font-semibold rounded text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {isSharing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                      {isSharing ? 'Granting...' : 'Share Access'}
                    </button>
                  </div>
                </form>

                {shareSuccessMsg && (
                  <p className="text-xs text-[#00a884] bg-[#00a884]/10 p-2 rounded border border-[#00a884]/30 flex items-center gap-1.5">
                    <Check className="w-4 h-4 shrink-0" />
                    {shareSuccessMsg}
                  </p>
                )}

                {/* Currently Authorized Members */}
                {permissions.length > 0 && (
                  <div className="pt-2 border-t border-[#374248]/50 space-y-1.5">
                    <span className="text-[11px] text-[#8696a0] font-medium block">
                      People with access ({permissions.length}):
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {permissions.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-[11px] p-2 bg-[#202c33] rounded"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {p.photoLink ? (
                              <img
                                src={p.photoLink}
                                alt=""
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <Shield className="w-3.5 h-3.5 text-[#00a884]" />
                            )}
                            <span className="text-[#e9edef] truncate">
                              {p.displayName || p.emailAddress || 'User'}
                            </span>
                            {p.emailAddress && (
                              <span className="text-[#8696a0] truncate text-[10px]">
                                ({p.emailAddress})
                              </span>
                            )}
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#111b21] text-[#00a884] capitalize shrink-0">
                            {p.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Share Link */}
              <div className="p-4 bg-[#111b21] rounded-lg border border-[#374248] space-y-2">
                <div className="flex items-center gap-2 text-white font-medium text-xs">
                  <Share2 className="w-4 h-4 text-[#00a884]" />
                  <span>Direct OmniChat Invite Link</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getInviteLink()}
                    className="flex-1 bg-[#202c33] border border-[#374248] rounded px-3 py-1.5 text-xs text-[#d1d7db] font-mono select-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyInvite}
                    className="px-3 py-1.5 bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] rounded font-medium text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Connect Folder */}
          {activeTab === 'connect' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#111b21] rounded-lg border border-[#374248] space-y-3">
                <div className="flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
                  <HardDrive className="w-4 h-4 text-[#00a884]" />
                  <span>Connect to Any Empty or Existing Google Drive Folder</span>
                </div>
                <p className="text-xs text-[#8696a0] leading-relaxed">
                  Have an empty folder in Google Drive? Paste its URL or Folder ID below. OmniChat
                  will automatically initialize <code className="text-[#00a884]">chats.json</code>,{' '}
                  <code className="text-[#00a884]">chats/</code>, and <code className="text-[#00a884]">media/</code>:
                </p>

                <form onSubmit={handleConnectCustom} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste Google Drive URL or Folder ID..."
                    value={folderInput}
                    onChange={(e) => setFolderInput(e.target.value)}
                    className="flex-1 bg-[#202c33] border border-[#374248] rounded px-3 py-1.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSwitching || !folderInput.trim()}
                    className="px-4 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] border border-[#00a884]/40 hover:border-[#00a884] rounded font-medium text-xs transition-colors disabled:opacity-50"
                  >
                    {isSwitching ? 'Connecting...' : 'Connect'}
                  </button>
                </form>

                {errorMsg && (
                  <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/30">
                    {errorMsg}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#202c33] border-t border-[#374248] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] font-semibold text-xs rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
