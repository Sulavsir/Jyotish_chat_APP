'use client';

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@jyotish/ui';

export type SortFilterOption<T extends string = string> = {
  value: T;
  label: string;
};

export type SortFilterProps<T extends string = string> = {
  sortBy: T;
  onSortByChange: (value: T) => void;
  sortOptions: SortFilterOption<T>[];
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  disabled?: boolean;
  className?: string;
  sortByLabel?: string;
  orderLabel?: string;
  selectTriggerClassName?: string;
  labelClassName?: string;
};

const DEFAULT_TRIGGER = 'border-slate-700 bg-slate-900 text-white w-full h-10';
const DEFAULT_LABEL = 'text-slate-400 text-xs block';

export function SortFilter<T extends string>({
  sortBy,
  onSortByChange,
  sortOptions,
  sortOrder,
  onSortOrderChange,
  disabled,
  className,
  sortByLabel = 'Sort by',
  orderLabel = 'Order',
  selectTriggerClassName = DEFAULT_TRIGGER,
  labelClassName = DEFAULT_LABEL,
}: SortFilterProps<T>) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-[420px] shrink-0',
        className
      )}
    >
      <div className="space-y-1">
        <Label className={labelClassName}>{sortByLabel}</Label>
        <Select value={sortBy} onValueChange={(v) => onSortByChange(v as T)} disabled={disabled}>
          <SelectTrigger className={selectTriggerClassName}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className={labelClassName}>{orderLabel}</Label>
        <Select
          value={sortOrder}
          onValueChange={(v) => onSortOrderChange(v === 'asc' ? 'asc' : 'desc')}
          disabled={disabled}
        >
          <SelectTrigger className={selectTriggerClassName}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
