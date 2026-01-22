import * as React from 'react';
import { cn } from './utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-md bg-white overflow-hidden border-2 border-purple-500/30 bg-slate-900/50 backdrop-blur-sm px-4 py-3 text-sm text-white transition-all duration-300',
          'placeholder:text-slate-400',
          'hover:border-purple-400/50 hover:bg-slate-900/70',
          'focus:outline-none focus:border-purple-500 focus:bg-slate-900/80 focus:ring-4 focus:ring-purple-500/20',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-purple-500/30',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
