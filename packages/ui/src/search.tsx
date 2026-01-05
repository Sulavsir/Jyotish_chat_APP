/**
 * Reusable Search Component
 */

import * as React from 'react';
import { Input } from './input';
import { SearchIcon } from './icons';
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
      <div className={cn('cosmic-card rounded-xl p-4', containerClassName)}>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none" />
          <Input
            ref={ref}
            type="text"
            className={cn('pl-10', className)}
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
