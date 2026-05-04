import * as React from 'react';
import { cn } from './utils';
import { Input } from './input';
import { CalendarDaysIcon } from './icons';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { BsAdCalendar } from './bs-calendar';

export interface DateInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange' | 'value'
> {
  className?: string;
  iconClassName?: string;
  /**
   * When true, use the Nepali (AD/BS) calendar popover instead of the native date picker.
   * Single prop to enable Nepali date input everywhere.
   */
  nepaliDate?: boolean;
  /** @deprecated Use nepaliDate instead. When true, same as nepaliDate. */
  useBsCalendar?: boolean;
  /**
   * Disable BS tab (AD only). Recommended for date-of-birth fields where BS mapping range is limited.
   */
  disableBs?: boolean;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Optional custom loader for Nepali mappings used by the BS calendar.
   * When provided, this overrides the internal fetch logic.
   */
  loadNepaliMap?: (
    dates: string[]
  ) => Promise<Record<string, { nepaliDate: string; days: string }>>;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      className,
      iconClassName = 'text-yellow-500',
      nepaliDate,
      useBsCalendar,
      disableBs,
      value,
      onChange,
      min,
      max,
      loadNepaliMap,
      ...props
    },
    ref
  ) => {
    const useCalendar = nepaliDate ?? useBsCalendar ?? false;
    const [open, setOpen] = React.useState(false);
    const [calendarSystem, setCalendarSystem] = React.useState<'AD' | 'BS'>(
      disableBs ? 'AD' : 'BS'
    );
    const [displayValue, setDisplayValue] = React.useState<string>('');

    const handleSelectFromCalendar = (newValue: string) => {
      const syntheticEvent = {
        target: { value: newValue },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent);
      setOpen(false);
    };

    if (!useCalendar) {
      return (
        <div className="relative">
          <Input
            type="date"
            ref={ref}
            className={cn(
              'w-full border-white/20 !text-white',
              '[&::-webkit-calendar-picker-indicator]:opacity-0',
              '[&::-webkit-calendar-picker-indicator]:absolute',
              '[&::-webkit-calendar-picker-indicator]:inset-0',
              '[&::-webkit-calendar-picker-indicator]:w-full',
              '[&::-webkit-calendar-picker-indicator]:h-full',
              '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
              className
            )}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            {...props}
          />
          <CalendarDaysIcon
            className={cn(
              'absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none',
              iconClassName
            )}
          />
        </div>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="relative w-full text-left">
            <Input
              type="text"
              ref={ref}
              readOnly
              className={cn(
                'w-full border-white/20 !text-white cursor-pointer',
                '[&::-webkit-calendar-picker-indicator]:hidden',
                className
              )}
              value={calendarSystem === 'BS' && displayValue ? displayValue : (value ?? '')}
              placeholder="Select date"
              {...props}
            />
            <CalendarDaysIcon
              className={cn(
                'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2',
                iconClassName
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-3">
          <BsAdCalendar
            value={value}
            onChange={handleSelectFromCalendar}
            min={typeof min === 'string' ? min : undefined}
            max={typeof max === 'string' ? max : undefined}
            disableBs={disableBs}
            loadNepaliMap={loadNepaliMap}
            onSystemChange={(system) => {
              setCalendarSystem(system);
              // When switching back to AD, reset display to raw value.
              if (system === 'AD') {
                setDisplayValue('');
              }
            }}
            onDateMetaChange={(val, meta) => {
              if (meta.system === 'BS' && meta.mapping?.nepaliDate) {
                // Show Nepali date on top (input value) when BS is active.
                setDisplayValue(`${meta.mapping.nepaliDate} (${val})`);
              } else {
                setDisplayValue('');
              }
            }}
          />
        </PopoverContent>
      </Popover>
    );
  }
);
DateInput.displayName = 'DateInput';

export { DateInput };
