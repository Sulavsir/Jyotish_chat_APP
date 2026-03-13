'use client';

import { useState } from 'react';
import { JyotishBookingStatus } from '@jyotish/shared';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@jyotish/ui';
import { Filter, ChevronDown, Check } from 'lucide-react';

export type BookingStatusFilterValue = JyotishBookingStatus | 'ALL';

interface BookingStatusFilterProps {
  value: BookingStatusFilterValue;
  onChange: (value: BookingStatusFilterValue) => void;
  disabled?: boolean;
}

const STATUS_OPTIONS: { value: BookingStatusFilterValue; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: JyotishBookingStatus.PENDING, label: 'Pending' },
  { value: JyotishBookingStatus.APPROVED, label: 'Approved' },
  { value: JyotishBookingStatus.REJECTED, label: 'Rejected' },
];

function getSelectedLabel(value: BookingStatusFilterValue): string {
  const option = STATUS_OPTIONS.find((opt) => opt.value === value);
  return option?.label ?? 'All';
}

export function BookingStatusFilter({ value, onChange, disabled }: BookingStatusFilterProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="border-slate-700 text-white hover:bg-slate-800 gap-2 h-9"
        >
          <Filter className="w-4 h-4" />
          <span>{getSelectedLabel(value)}</span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[160px] p-1 bg-slate-900 border-slate-700"
      >
        <div className="flex flex-col">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`
                flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors
                ${
                  value === option.value
                    ? 'text-purple-300 bg-purple-600/15'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <span>{option.label}</span>
              {value === option.value && <Check className="w-4 h-4 text-purple-400" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default BookingStatusFilter;
