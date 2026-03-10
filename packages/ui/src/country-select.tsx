'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getCountries } from 'react-phone-number-input/max';
import type { Country } from 'react-phone-number-input';
import enLocale from 'react-phone-number-input/locale/en.json';
import { cn } from './utils';

export interface CountrySelectProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  onBlur?: (event?: React.FocusEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  defaultCountry?: Country;
  className?: string;
  id?: string;
  variant?: 'admin' | 'jyotish';
}

const labels = enLocale as Record<string, string>;

const variantStyles = {
  admin: {
    container: 'border-purple-500/30',
    button:
      'bg-slate-800/50 text-white hover:bg-slate-700/50 focus:ring-purple-500/50',
    placeholder: 'text-slate-400',
    chevron: 'text-slate-400',
    dropdown: 'border-slate-600 bg-slate-900',
    searchWrap: 'border-slate-600 bg-slate-800/50',
    searchInput:
      'border-slate-600 bg-slate-800 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/50',
    optionSelected: 'bg-purple-600/30 text-white',
    option: 'text-slate-300 hover:bg-slate-700/50',
    noResults: 'text-slate-400',
  },
  jyotish: {
    container: 'border-white/20',
    button:
      'bg-white/10 text-white hover:bg-white/15 focus:ring-orange-500/50',
    placeholder: 'text-gray-400',
    chevron: 'text-gray-400',
    dropdown: 'border-white/20 bg-slate-900/95 backdrop-blur',
    searchWrap: 'border-white/20 bg-white/5',
    searchInput:
      'border-white/20 bg-white/10 text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500/50',
    optionSelected: 'bg-orange-600/30 text-white',
    option: 'text-gray-300 hover:bg-white/10',
    noResults: 'text-gray-400',
  },
} as const;

function countryToFlag(code: Country): string {
  return [...code]
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('');
}

export function CountrySelect({
  value,
  onChange,
  onBlur,
  placeholder = 'Select country',
  disabled = false,
  defaultCountry,
  className,
  id,
  variant = 'admin',
}: CountrySelectProps) {
  const styles = variantStyles[variant];
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const countries = useMemo(() => getCountries(), []);
  const options = useMemo(
    () =>
      countries
        .filter((c): c is Country => typeof c === 'string' && c.length === 2)
        .map((c) => ({
          value: c,
          label: (labels[c] ?? c) as string,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [countries]
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [options, search]);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const updatePosition = useRef(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 288),
    });
  });

  useEffect(() => {
    if (!open || !buttonRef.current) {
      setDropdownPosition(null);
      return;
    }
    updatePosition.current();
    const handleScrollOrResize = () => updatePosition.current();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const handleSelect = (country: Country) => {
    onChange?.(country);
    setOpen(false);
    setSearch('');
  };

  const dropdownContent =
    open && dropdownPosition ? (
      <div
        ref={dropdownRef}
        className={cn(
          'fixed z-[9999] w-72 overflow-hidden rounded-md border shadow-xl',
          styles.dropdown
        )}
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
        }}
        role="listbox"
        aria-label="Country list"
      >
        <div className={cn('border-b p-2', styles.searchWrap)}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country..."
            className={cn(
              'w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-1',
              styles.searchInput
            )}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {filteredOptions.length === 0 ? (
            <div
              className={cn(
                'px-3 py-4 text-center text-sm',
                styles.noResults
              )}
            >
              No country found
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                    isSelected ? styles.optionSelected : styles.option
                  )}
                >
                  <span className="text-base">{countryToFlag(opt.value)}</span>
                  <span className="flex-1 truncate">{opt.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    ) : null;

  return (
    <>
      <div ref={containerRef} className={cn('flex', className)}>
        <button
          ref={buttonRef}
          id={id}
          type="button"
          onClick={() => {
            if (!disabled) setOpen((prev) => !prev);
          }}
          onBlur={onBlur}
          disabled={disabled}
          aria-label="Select country"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            'flex h-11 w-full items-center gap-2 rounded-md border-2 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-inset',
            styles.container,
            styles.button,
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {selectedOption ? (
            <>
              <span className="text-base">
                {countryToFlag(selectedOption.value)}
              </span>
              <span className="flex-1 truncate text-left">
                {selectedOption.label}
              </span>
            </>
          ) : (
            <span className={cn('flex-1 text-left', styles.placeholder)}>
              {placeholder}
            </span>
          )}
          <svg
            className={cn(
              'h-4 w-4 shrink-0 transition-transform',
              styles.chevron,
              open && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {typeof document !== 'undefined' && dropdownContent
        ? createPortal(dropdownContent, document.body)
        : null}
    </>
  );
}
