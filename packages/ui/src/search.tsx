/**
 * Reusable Search Component
 */

import * as React from 'react';
import { Input } from './input';
import { Search as SearchIcon, X } from 'lucide-react';
import { cn } from './utils';

export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  containerClassName?: string;
  showClear?: boolean;
  outerLayer?: boolean;
}

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (ref == null) continue;
      if (typeof ref === 'function') ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  (
    {
      className,
      onSearch,
      containerClassName,
      onChange,
      value: valueProp,
      defaultValue,
      showClear = true,
      outerLayer = true,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const mergedRef = mergeRefs(ref, inputRef);

    const isControlled = valueProp !== undefined;
    const [internalValue, setInternalValue] = React.useState(
      () => (defaultValue !== undefined ? String(defaultValue) : '')
    );

    const hasValue = isControlled
      ? String(valueProp ?? '').length > 0
      : internalValue.length > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalValue(e.target.value);
      onChange?.(e);
      onSearch?.(e.target.value);
    };

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isControlled) {
        setInternalValue('');
        if (inputRef.current) inputRef.current.value = '';
      }
      const empty = {
        target: { value: '' } as HTMLInputElement,
        currentTarget: { value: '' } as HTMLInputElement,
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(empty);
      onSearch?.('');
      inputRef.current?.focus();
    };

    const inner = (
      <div className={cn('relative min-w-0', !outerLayer && containerClassName)}>
        {/*
          Input first (paints full field). Icons sit in inset-y-0 columns so they stay
          vertically centered even when parent flex uses items-end (e.g. admin toolbars).
        */}
        <Input
          ref={mergedRef}
          type="text"
          {...(isControlled ? { value: valueProp } : defaultValue !== undefined ? { defaultValue } : {})}
          className={cn(
            'min-w-0 pl-10 pr-4 text-xs leading-normal sm:pl-12 sm:pr-4 sm:text-sm',
            showClear && hasValue ? '!pr-11 sm:!pr-12' : '',
            className
          )}
          onChange={handleChange}
          {...props}
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-20 flex w-10 items-center justify-center sm:w-12"
          aria-hidden
        >
          <SearchIcon
            size={22}
            strokeWidth={2.75}
            className={cn(
              'h-[22px] w-[22px] shrink-0 text-white sm:h-6 sm:w-6',
              'drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]'
            )}
          />
        </div>
        {showClear && hasValue ? (
          <div className="absolute inset-y-0 right-0 z-20 flex items-center pr-1.5 sm:pr-2">
            <button
              type="button"
              aria-label="Clear search"
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                'text-slate-100 transition-colors hover:bg-white/15 hover:text-white',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70'
              )}
              onClick={handleClear}
            >
              <X className="h-[18px] w-[18px] shrink-0 sm:h-5 sm:w-5" strokeWidth={2.75} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    );

    if (!outerLayer) {
      return inner;
    }

    return (
      <div
        className={cn(
          'cosmic-card min-w-0 w-full rounded-xl p-2.5 sm:p-4',
          containerClassName
        )}
      >
        {inner}
      </div>
    );
  }
);

Search.displayName = 'Search';

export { Search };
