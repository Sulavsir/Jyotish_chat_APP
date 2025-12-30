/**
 * Simple Emoji Picker Component
 * Displays common emojis without external dependencies
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

const EMOJI_CATEGORIES = {
  '😊 Smileys': [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
    '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏',
  ],
  '👍 Gestures': [
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏',
  ],
  '❤️ Hearts': [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❤️‍🔥', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌',
  ],
  '🎉 Celebrations': [
    '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟',
    '💫', '✨', '🎆', '🎇', '🎀', '🎗️', '🎖️', '🔥', '💯', '👑',
  ],
  '🌸 Nature': [
    '🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🌿', '🍀', '🌱', '🌲',
    '🌳', '🌴', '🌵', '🌾', '🎋', '🎍', '🍃', '🍂', '🍁', '🌾',
  ],
};

export function EmojiPicker({ onEmojiSelect, disabled = false }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedCategory, setSelectedCategory] = useState(Object.keys(EMOJI_CATEGORIES)[0]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        setPosition({
          top: rect.top + scrollY - 320, // Position above the button
          left: rect.left + scrollX - 250, // Align to left
        });
      }
    };

    updatePosition();

    if (isOpen) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Add emoji"
      >
        <Smile className="h-5 w-5" />
      </button>

      {isOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
            
            {/* Emoji Picker */}
            <div
              ref={pickerRef}
              className="fixed z-[9999] w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
              }}
            >
              {/* Header */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Emojis</h3>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                {Object.keys(EMOJI_CATEGORIES).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      selectedCategory === category
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Emoji Grid */}
              <div className="p-2 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES].map(
                    (emoji, index) => (
                      <button
                        key={index}
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-2xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}

