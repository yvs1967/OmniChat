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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111b21] p-4 select-none">
      {/* Background Top Green Header Bar like WhatsApp Web */}
      <div className="absolute top-0 left-0 right-0 h-56 bg-[#00a884] z-0" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-4xl bg-[#202c33] rounded-lg shadow-2xl border border-[#374248] overflow-hidden flex flex-col md:flex-row text-[#e9edef]">
        {/* Left Column: Instructions and Sign In */}
        <div className="flex-1 p-8 sm:p-12 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center shadow-lg">
                <FolderSync className="w-6 h-6 text-[#111b21]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-light tracking-wide text-white">
                  OmniChat <span className="font-semibold text-[#00a884]">Drive Sync</span>
                </h1>
                <p className="text-xs text-[#8696a0]">
                  Decentralized real-time chat powered by shared Google Drive folders
                </p>
              </div>
            </div>

            {/* Error Banner if auth failed */}
            {errorMessage && (
              <div className="p-4 bg-red-500/15 border border-red-500/40 rounded-lg text-xs space-y-2 text-red-200 animate-in fade-in">
                <div className="font-semibold text-white flex items-center justify-between">
                  <span>Authentication Setup Notice</span>
                  {onClearError && (
                    <button
                      onClick={onClearError}
                      className="text-[#8696a0] hover:text-white text-xs"
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

            {/* Steps list */}
            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-medium text-[#d1d7db] uppercase tracking-wider text-xs">
                To use OmniChat with Google Drive:
              </h2>
              <ol className="space-y-3 text-sm text-[#8696a0] list-decimal list-inside leading-relaxed">
                <li>
                  <span className="text-[#e9edef] font-medium">Sign in with your Google account</span> to connect Google Drive.
                </li>
                <li>
                  The app accesses or creates a private{' '}
                  <code className="text-[#00a884] bg-[#111b21] px-1 py-0.5 rounded text-xs">
                    OmniChat_Data
                  </code>{' '}
                  folder with isolated room subfolders.
                </li>
                <li>
                  Share this folder with friends or team members to chat and exchange media with zero backend servers!
                </li>
              </ol>
            </div>
          </div>

          {/* Action Button: Official Google Sign-In Button */}
          <div className="pt-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
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
                    {isLoading ? 'Connecting to Google Drive...' : 'Sign in with Google'}
                  </span>
                </div>
              </button>

              {onContinueAsGuest && (
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className="text-xs text-[#8696a0] hover:text-[#00a884] underline transition-colors"
                >
                  Explore Demo Preview first
                </button>
              )}
            </div>

            <p className="text-[11px] text-[#8696a0] flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00a884]" />
              Requires Google Drive permission to sync your shared chat files.
            </p>
          </div>
        </div>

        {/* Right Column: Simulated QR / Drive Sync Visual */}
        <div className="w-full md:w-80 bg-[#111b21] p-8 border-t md:border-t-0 md:border-l border-[#374248] flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 bg-white rounded-xl shadow-lg relative group">
            <div className="w-44 h-44 bg-white flex flex-col items-center justify-center border-4 border-dashed border-[#00a884]/40 rounded-lg p-2">
              <QrCode className="w-28 h-28 text-[#111b21]" />
              <div className="text-[10px] text-gray-700 font-mono mt-1 font-semibold flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-[#00a884]" /> Drive Sync Ready
              </div>
            </div>
            <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium p-4">
              Click "Sign in with Google" to link your Drive folder
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-[#e9edef] block">
              Host Anywhere • GitHub Pages
            </span>
            <p className="text-[11px] text-[#8696a0] leading-relaxed">
              Fully static frontend client that speaks directly to Google Drive REST API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
