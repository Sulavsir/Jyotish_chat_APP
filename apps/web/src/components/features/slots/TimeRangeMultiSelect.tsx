'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@jyotish/ui';
import { cn } from '@jyotish/ui';
import type { SlotTimeRangeOption } from '@/constants/slot.constants';
import { ChevronDown, Check, X } from 'lucide-react';

export interface TimeRangeMultiSelectProps {
  options: SlotTimeRangeOption[];
  value: string[];
  onChange: (starts: string[]) => void;
  placeholder?: string;
  className?: string;
}

/** Multi-select for slot times: Select-style trigger with scrollable badges (time + X), dropdown with clickable rows (no checkboxes). */
export function TimeRangeMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select times',
  className,
}: TimeRangeMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (start: string) => {
    if (value.includes(start)) {
      onChange(value.filter((s) => s !== start));
    } else {
      onChange([...value, start].sort());
    }
  };

  const remove = (e: React.MouseEvent, start: string) => {
    e.stopPropagation();
    onChange(value.filter((s) => s !== start));
  };

  const selectedOptions = value
    .map((start) => options.find((o) => o.start === start))
    .filter(Boolean) as SlotTimeRangeOption[];

  const allSelected = options.length > 0 && value.length === options.length;
  const handleSelectAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.start).sort());
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-11 w-full min-h-[2.75rem] items-center gap-2 rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white backdrop-blur-sm transition-all duration-300',
            'hover:border-purple-400/50 hover:bg-slate-900/70',
            'focus:outline-none focus:border-purple-500 focus:bg-slate-900/80 focus:ring-4 focus:ring-purple-500/20',
            className
          )}
        >
          <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto overflow-y-hidden flex-nowrap py-0.5 scrollbar-thin">
            {selectedOptions.length === 0 ? (
              <span className="text-slate-400 shrink-0">{placeholder}</span>
            ) : (
              selectedOptions.map((opt) => (
                <span
                  key={opt.start}
                  className="inline-flex items-center gap-1 shrink-0 rounded-md bg-purple-500/30 px-2 py-1 text-xs text-white border border-purple-400/30"
                >
                  <span>{opt.label}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${opt.label}`}
                    onClick={(e) => remove(e, opt.start)}
                    className="rounded p-0.5 hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-white/50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          'w-[var(--radix-popover-trigger-width)] min-w-[200px] max-h-64 flex flex-col p-0',
          'border border-purple-500/30 bg-slate-950 text-white shadow-2xl shadow-purple-900/30',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
        )}
      >
        <div
          role="listbox"
          tabIndex={0}
          className="overflow-y-auto overflow-x-hidden p-1 min-h-0 overscroll-contain"
          style={{
            maxHeight: '240px',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            role="option"
            aria-selected={allSelected}
            tabIndex={0}
            onClick={handleSelectAll}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectAll();
              }
            }}
            className={cn(
              'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none border-b border-white/10',
              'hover:bg-purple-500/15 hover:text-white',
              'focus:bg-purple-500/15 focus:text-white',
              allSelected && 'bg-purple-500/15 text-white'
            )}
          >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
              {allSelected ? <Check className="h-4 w-4" /> : null}
            </span>
            <span className="font-medium">Select All</span>
          </div>
          {options.map((opt) => {
            const isSelected = value.includes(opt.start);
            return (
              <div
                key={opt.start}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => toggle(opt.start)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(opt.start);
                  }
                }}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                  'hover:bg-purple-500/15 hover:text-white',
                  'focus:bg-purple-500/15 focus:text-white',
                  isSelected && 'bg-purple-500/15 text-white'
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  {isSelected ? <Check className="h-4 w-4" /> : null}
                </span>
                <span>{opt.label}</span>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
