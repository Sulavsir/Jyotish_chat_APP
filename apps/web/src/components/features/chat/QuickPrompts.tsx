/**
 * QuickPrompts - Reusable component for quick prompt chips (e.g. Jyotish waiting messages)
 */

import React from 'react';
import { Button } from '@jyotish/ui';

export const JYOTISH_QUICK_PROMPTS = [
  'ग्रह-नक्षत्र हेर्दैछु, कृपया केही क्षण प्रतीक्षा गर्नुहोस्।',
  'तपाईंको भविष्य सम्बन्धी जानकारी जाँच गर्दैछु।',
  'धैर्य राख्नुहोस्, उत्तर छिट्टै प्रस्तुत हुनेछ।',
  'तपाईंको प्रश्नको ज्योतिषीय विश्लेषण हुँदैछ।',
  'एकछिन कृपया प्रतीक्षा गर्नुहोस्, सबै स्पष्ट हुँदैछ।',
] as const;

export interface QuickPromptsProps {
  prompts: readonly string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'jyotish';
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  prompts,
  onSelect,
  disabled = false,
  variant = 'default',
}) => {
  if (prompts.length === 0) return null;

  const isJyotish = variant === 'jyotish';

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <Button
          key={prompt}
          type="button"
          variant="outline"
          color={isJyotish ? 'warning' : 'info'}
          size="sm"
          onClick={() => onSelect(prompt)}
          disabled={disabled}
          className="text-xs h-auto py-1.5 px-3 rounded-lg"
        >
          {prompt}
        </Button>
      ))}
    </div>
  );
};
