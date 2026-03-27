/**
 * Reusable Search Component
 */

import * as React from 'react';
import { Input } from './input';
import { SearchIcon } from 'lucide-react';
import { cn } from './utils';

export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  containerClassName?: string;
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ className, onSearch, containerClassName, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onSearch?.(e.target.value);
    };

    return (
      <div
        className={cn(
          'cosmic-card min-w-0 w-full rounded-xl p-2.5 sm:p-4',
          containerClassName
        )}
      >
        <div className="relative min-w-0">
          <SearchIcon
            size={20}
            strokeWidth={2}
            absoluteStrokeWidth
            className="pointer-events-none absolute left-2 top-1/2 z-10 h-4 w-4 -translate-y-1/2 !text-white sm:left-3 sm:h-5 sm:w-5"
          />
          <Input
            ref={ref}
            type="text"
            className={cn(
              'min-w-0 pl-8 pr-2 text-xs leading-normal sm:pl-10 sm:pr-4 sm:text-sm',
              className
            )}
            onChange={handleChange}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Search.displayName = 'Search';

export { Search };
