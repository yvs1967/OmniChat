import React, { useState, useEffect } from 'react';
import { X, UserCheck, Edit3, RotateCcw, ShieldCheck, Tag } from 'lucide-react';

interface RenameContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  contactEmail?: string;
  currentDisplayName: string;
  originalName: string;
  currentAlias?: string;
  isGroup?: boolean;
  onSaveAlias: (identifier: string, alias: string | null) => void;
}

export const RenameContactModal: React.FC<RenameContactModalProps> = ({
  isOpen,
  onClose,
  chatId,
  contactEmail,
  currentDisplayName,
  originalName,
  currentAlias,
  isGroup,
  onSaveAlias,
}) => {
  const [aliasInput, setAliasInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAliasInput(currentAlias || '');
    }
  }, [isOpen, currentAlias]);

  if (!isOpen) return null;

  const targetIdentifier = contactEmail?.toLowerCase() || chatId;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = aliasInput.trim();
    if (clean) {
      onSaveAlias(targetIdentifier, clean);
    } else {
      // If empty string, clear the alias
      onSaveAlias(targetIdentifier, null);
    }
    onClose();
  };

  const handleReset = () => {
    onSaveAlias(targetIdentifier, null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#222e35] rounded-xl shadow-2xl border border-[#374248] overflow-hidden text-[#e9edef]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#00a884]/20 rounded-full text-[#00a884]">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#e9edef]">
                {isGroup ? 'Rename Group (For You)' : 'Edit Contact Name'}
              </h3>
              <p className="text-xs text-[#8696a0]">
                Custom nickname visible only to your account
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Original Info Callout */}
          <div className="p-3 bg-[#111b21] rounded-lg border border-[#2a3942] text-xs space-y-1.5">
            <div className="flex justify-between items-center text-[#8696a0]">
              <span>Original Account Name:</span>
              <span className="text-[#e9edef] font-medium">{originalName}</span>
            </div>
            {contactEmail && (
              <div className="flex justify-between items-center text-[#8696a0]">
                <span>Google / Gmail Address:</span>
                <span className="text-[#00a884] font-mono">{contactEmail}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-[#8696a0] pt-1 border-t border-[#222d34]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00a884] shrink-0" />
              <span>
                Personal address book: The other person will not see this alias.
              </span>
            </div>
          </div>

          {/* Alias Input Field */}
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
              Custom Nickname (e.g. &quot;Bob Newyork&quot;, &quot;Team Lead&quot;)
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder={originalName || 'Enter custom contact name...'}
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                maxLength={45}
                className="w-full bg-[#111b21] border border-[#374248] rounded-lg px-3.5 py-2.5 text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] transition-colors"
              />
              <Tag className="w-4 h-4 text-[#8696a0] absolute right-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[11px] text-[#8696a0] mt-1.5">
              This name will replace their Gmail in your chat list, conversation header, and search.
            </p>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-[#8696a0] mr-1">Suggestions:</span>
            {[`${originalName} Work`, `${originalName} Newyork`, `${originalName} (Friend)`].map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setAliasInput(sug)}
                className="px-2 py-0.5 bg-[#111b21] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#00a884] border border-[#374248] rounded text-[11px] transition-colors"
              >
                + {sug}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#2a3942] flex items-center justify-between gap-3">
            {currentAlias ? (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 bg-transparent hover:bg-[#111b21] text-amber-400 hover:text-amber-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-amber-500/30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Default
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
              >
                <UserCheck className="w-4 h-4" />
                Save Name
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
