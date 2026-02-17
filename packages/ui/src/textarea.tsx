import * as React from 'react';
import { cn } from './utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full rounded-md overflow-y-auto border-2 border-purple-500/30 bg-slate-900/50 backdrop-blur-sm px-4 py-3 text-sm text-white transition-all duration-300 resize-y',
          'placeholder:text-slate-400',
          'hover:border-purple-400/50 hover:bg-slate-900/70',
          'focus:outline-none focus:border-purple-500 focus:bg-slate-900/80 focus:ring-4 focus:ring-purple-500/20',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-purple-500/30',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };

