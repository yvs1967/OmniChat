import React from 'react';
import { HardDrive, ShieldCheck, Sparkles, FolderSync, QrCode } from 'lucide-react';

interface SignInPromptProps {
  onSignIn: () => void;
  isLoading: boolean;
  onContinueAsGuest?: () => void;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export const SignInPrompt: React.FC<SignInPromptProps> = ({
  onSignIn,
  isLoading,
  onContinueAsGuest,
  errorMessage,
  onClearError,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111b21] p-3 sm:p-6 select-none overflow-y-auto">
      {/* Background Top Green Header Bar like WhatsApp Web */}
      <div className="absolute top-0 left-0 right-0 h-48 sm:h-56 bg-[#00a884] z-0" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl bg-[#202c33] rounded-2xl shadow-2xl border border-[#374248] overflow-hidden my-auto flex flex-col text-[#e9edef]">
        
        {/* Top Header & Brand Bar */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-[#374248] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#182229]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#00a884] flex items-center justify-center shadow-lg shadow-[#00a884]/20 shrink-0">
              <FolderSync className="w-7 h-7 text-[#111b21]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                OmniChat <span className="text-xs bg-[#00a884]/20 text-[#00a884] px-2 py-0.5 rounded-full font-medium border border-[#00a884]/40">Drive Sync</span>
              </h1>
              <p className="text-xs text-[#8696a0]">
                Private, Serverless Real-Time Messaging Client Powered by Google Drive
              </p>
            </div>
          </div>

          {/* Quick Sign In button in header */}
          <button
            type="button"
            onClick={onSignIn}
            disabled={isLoading}
            className="px-5 py-2.5 bg-[#00a884] hover:bg-[#06cf9c] active:scale-95 text-[#111b21] font-semibold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {isLoading ? 'Connecting...' : 'Sign In with Google'}
          </button>
        </div>

        {/* Error Banner if auth failed */}
        {errorMessage && (
          <div className="mx-6 sm:mx-10 mt-6 p-4 bg-red-500/15 border border-red-500/40 rounded-xl text-xs space-y-2 text-red-200 animate-in fade-in">
            <div className="font-semibold text-white flex items-center justify-between">
              <span>Authentication Notice</span>
              {onClearError && (
                <button
                  onClick={onClearError}
                  className="text-[#8696a0] hover:text-white text-xs underline cursor-pointer"
                >
                  Dismiss
                </button>
              )}
            </div>
            <p className="whitespace-pre-line text-[11px] leading-relaxed text-red-100 font-mono">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-10 space-y-8 max-h-[65vh] overflow-y-auto scrollbar-thin">
          
          {/* Main Google Sign-In Card */}
          <div className="bg-[#111b21] p-6 rounded-xl border border-[#2a3942] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-left">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00a884]" />
                Get Started with OmniChat
              </h2>
              <p className="text-xs text-[#8696a0] max-w-lg leading-relaxed">
                Connect your Google Account to establish your private chat folder on Google Drive. No passwords or separate registration required.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={onSignIn}
                disabled={isLoading}
                className="gsi-material-button w-full sm:w-auto hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      xmlnsXlink="http://www.w3.org/1999/xlink"
                      style={{ display: 'block' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      ></path>
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      ></path>
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      ></path>
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      ></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isLoading ? 'Connecting...' : 'Sign in with Google'}
                  </span>
                </div>
              </button>

              {onContinueAsGuest && (
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className="text-xs text-[#8696a0] hover:text-[#00a884] underline transition-colors"
                >
                  Explore preview
                </button>
              )}
            </div>
          </div>

          {/* Detailed Features & App Functionality (Google Verification Requirement) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
              Application Features & Functionality
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-[#182229] rounded-xl border border-[#2a3942] space-y-1">
                <span className="text-xs font-semibold text-white block">1-on-1 & Group Chats</span>
                <p className="text-[11px] text-[#8696a0] leading-relaxed">
                  Real-time messaging with contact custom nicknames, search filtering, and WhatsApp checkmarks.
                </p>
              </div>

              <div className="p-3.5 bg-[#182229] rounded-xl border border-[#2a3942] space-y-1">
                <span className="text-xs font-semibold text-white block">Voice Notes & Media</span>
                <p className="text-[11px] text-[#8696a0] leading-relaxed">
                  Record web audio voice notes, share photos, exchange documents, and react with emojis.
                </p>
              </div>

              <div className="p-3.5 bg-[#182229] rounded-xl border border-[#2a3942] space-y-1">
                <span className="text-xs font-semibold text-white block">Serverless Google Drive</span>
                <p className="text-[11px] text-[#8696a0] leading-relaxed">
                  Decentralized synchronization: Your messages remain in your own Google Drive storage.
                </p>
              </div>
            </div>
          </div>

          {/* Transparent Google Permissions Disclosure (Google Verification Requirement) */}
          <div className="p-4 bg-[#182229] rounded-xl border border-[#00a884]/30 space-y-3 text-left">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-[#00a884]" />
              <span>Transparent Data & Google Permissions Notice</span>
            </div>
            
            <p className="text-xs text-[#d1d7db] leading-relaxed">
              OmniChat requests specific Google OAuth permissions solely to provide its messaging service:
            </p>

            <ul className="text-[11px] text-[#8696a0] space-y-2 list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-white">Google Profile & Email:</strong> Used exclusively to identify you to other participants in chats you join or create.
              </li>
              <li>
                <strong className="text-white">Google Drive Access (<code className="text-[#00a884]">drive.file</code> scope):</strong> OmniChat requests limited access <em>strictly to files and folders created by this application</em>. It creates a private <code className="text-[#00a884]">OmniChat_Data</code> folder to hold your conversations. OmniChat cannot view, edit, or access any other personal files in your Google Drive.
              </li>
              <li>
                <strong className="text-white">Zero Third-Party Storage:</strong> OmniChat does not maintain a central database or external server. Your data stays 100% inside your Google account.
              </li>
            </ul>
          </div>

        </div>

        {/* Footer with Mandatory Privacy Policy and Terms of Service Links */}
        <div className="px-6 py-4 sm:px-10 bg-[#182229] border-t border-[#374248] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8696a0]">
          <div className="flex items-center gap-1.5">
            <span>&copy; 2026 OmniChat. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <a
              href="./privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00a884] hover:underline transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-[#374248]">•</span>
            <a
              href="./terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00a884] hover:underline transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
