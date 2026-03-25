'use client';

import type { Control, FieldValues, Path } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@jyotish/ui';
import { Input } from '@jyotish/ui';

const FIELDS: { name: string; label: string; description: string }[] = [
  {
    name: 'chatMessageCommissionPercent',
    label: 'Direct chat commission (%)',
    description: 'Share of coins when clients pay per direct/instant chat message.',
  },
  {
    name: 'broadcastMessageCommissionPercent',
    label: 'Broadcast (standard) (%)',
    description: 'Share when client pays the normal broadcast fee.',
  },
  {
    name: 'firstBroadcastCommissionPercent',
    label: 'First broadcast (%)',
    description: 'Share when first-broadcast discount pricing applies.',
  },
  {
    name: 'kundaliReviewCommissionPercent',
    label: 'Full Kundali review (%)',
    description: 'Share for Full Kundali Review slot bookings (selective Jyotish).',
  },
  {
    name: 'appointmentCommissionPercent',
    label: 'Other appointments (%)',
    description: 'Share for general appointment coin deductions.',
  },
];

type Props<T extends FieldValues> = {
  control: Control<T>;
};

export function AstrologerCommissionPercentFields<T extends FieldValues>({ control }: Props<T>) {
  return (
    <div className="space-y-4 rounded-lg border border-slate-700/80 bg-slate-900/40 p-4">
      <h3 className="text-sm font-semibold text-white">Commission on client coin deductions (%)</h3>
      <p className="text-xs text-slate-400">
        Each rate is the percentage of <strong>client coins deducted</strong> credited to this Jyotish
        for that product. Default is 10%; adjust per Jyotish like chat message fees.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <FormField
            key={f.name}
            control={control}
            name={f.name as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200">{f.label}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    className="bg-slate-800 border-slate-600"
                    {...field}
                    value={field.value === undefined || field.value === null ? '' : field.value}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === '' ? undefined : parseFloat(v));
                    }}
                  />
                </FormControl>
                <FormDescription className="text-xs text-slate-500">{f.description}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}
