'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jyotish/ui';
import type { SlotTimeRangeOption } from '@/constants/slot.constants';

export interface TimeRangeSelectProps {
  options: SlotTimeRangeOption[];
  value: string;
  onValueChange: (start: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/** Single-select for one slot time. Same options as TimeRangeMultiSelect; use for edit slot. */
export function TimeRangeSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Select time',
  className,
  disabled,
}: TimeRangeSelectProps) {
  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.start} value={opt.start}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
