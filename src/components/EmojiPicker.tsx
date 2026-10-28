import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
  },
  {
    name: 'Gestures',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪'],
  },
  {
    name: 'Hearts & Emotions',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '🔥', '✨', '⭐', '🌟', '💥', '💯', '🎉', '🎊'],
  },
  {
    name: 'Objects & Food',
    emojis: ['☕', '🍵', '🍕', '🍔', '🍟', '🌮', '🍣', '🍰', '🍫', '🍦', '🍩', '🍎', '🍓', '🥑', '📱', '💻', '📷', '📁', '📂', '🔒', '🔑', '🚀', '✈️', '🚗', '💡', '📌', '📎'],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');

  const filteredEmojis = search
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : EMOJI_CATEGORIES[activeTab].emojis;

  return (
    <div className="absolute bottom-16 left-4 z-40 w-80 max-w-[calc(100vw-32px)] bg-[#202c33] border border-[#374248] rounded-xl shadow-2xl overflow-hidden flex flex-col h-72 animate-in fade-in zoom-in-95 duration-150">
      {/* Search Header */}
      <div className="p-2 border-b border-[#2d3b42] flex items-center gap-2">
        <div className="flex-1 flex items-center bg-[#111b21] rounded-md px-2.5 py-1.5 text-xs text-[#8696a0]">
          <Search className="w-3.5 h-3.5 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-[#e9edef] outline-none w-full text-xs"
            autoFocus
          />
        </div>
      </div>

      {/* Categories Tabs */}
      {!search && (
        <div className="flex border-b border-[#2d3b42] bg-[#1a242a] overflow-x-auto text-xs scrollbar-none">
          {EMOJI_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-2 whitespace-nowrap transition-colors ${
                activeTab === idx
                  ? 'text-[#00a884] border-b-2 border-[#00a884] font-medium'
                  : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-7 gap-1 content-start">
        {filteredEmojis.map((emoji, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
            }}
            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-[#2a3942] rounded-lg transition-transform active:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
