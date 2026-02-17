import * as React from 'react';
import { cn } from './utils';
import { Input } from './input';
import { ClockIcon } from './icons';

export interface TimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string;
  /** Icon color class (default: text-yellow-500) */
  iconClassName?: string;
}

const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, iconClassName = 'text-yellow-500', ...props }, ref) => {
    return (
      <div className="relative">
        <Input
          type="time"
          ref={ref}
          className={cn(
            'w-full border-white/20 !text-white [color-scheme:dark]',
            '[&::-webkit-calendar-picker-indicator]:opacity-0',
            '[&::-webkit-calendar-picker-indicator]:absolute',
            '[&::-webkit-calendar-picker-indicator]:inset-0',
            '[&::-webkit-calendar-picker-indicator]:w-full',
            '[&::-webkit-calendar-picker-indicator]:h-full',
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
            className
          )}
          {...props}
        />
        <ClockIcon
          className={cn(
            'absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none',
            iconClassName
          )}
        />
      </div>
    );
  }
);
TimeInput.displayName = 'TimeInput';

export { TimeInput };
