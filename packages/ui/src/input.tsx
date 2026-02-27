import * as React from 'react';
import { cn } from './utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onFocus, onChange, value, ...props }, ref) => {
    const isNumber = type === 'number';
    const [internalValue, setInternalValue] = React.useState<string>('');
    React.useEffect(() => {
      if (isNumber) {
        setInternalValue(value !== undefined ? String(value) : '');
      }
    }, [value, isNumber]);
    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      if (isNumber) {
        setTimeout(() => event.target.select(), 0);
      }
      onFocus?.(event);
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isNumber) {
        onChange?.(e);
        return;
      }
      const raw = e.target.value;
      setInternalValue(raw);
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: raw === '' ? '' : Number(raw),
        },
      } as React.ChangeEvent<HTMLInputElement>;

      onChange?.(syntheticEvent);
    };

    return (
      <input
        ref={ref}
        type={isNumber ? 'text' : type}
        inputMode={isNumber ? 'numeric' : undefined}
        value={isNumber ? internalValue : value}
        onFocus={handleFocus}
        onChange={handleChange}
        className={cn(
          'flex h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 backdrop-blur-sm px-4 py-3 text-sm text-white transition-all duration-300',
          'placeholder:text-slate-400',
          'hover:border-purple-400/50 hover:bg-slate-900/70',
          'focus:outline-none focus:border-purple-500 focus:bg-slate-900/80 focus:ring-4 focus:ring-purple-500/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
export { Input };
