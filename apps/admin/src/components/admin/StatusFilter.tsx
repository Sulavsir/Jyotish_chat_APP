'use client';

import { useState } from 'react';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@jyotish/ui';
import { Filter, ChevronDown, Check } from 'lucide-react';

export interface StatusFilterOption<T extends string> {
  value: T;
  label: string;
}

interface StatusFilterProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: StatusFilterOption<T>[];
  disabled?: boolean;
  placeholder?: string;
}

export function StatusFilter<T extends string>({
  value,
  onChange,
  options,
  disabled,
  placeholder = 'Filter',
}: StatusFilterProps<T>) {
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="border-slate-700 text-white hover:bg-slate-800 gap-2 h-9"
        >
          <Filter className="w-4 h-4" />
          <span>{selectedLabel}</span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[160px] p-1 bg-slate-900 border-slate-700"
      >
        <div className="flex flex-col">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`
                flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors
                ${
                  value === option.value
                    ? 'text-purple-300 bg-purple-600/15'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <span>{option.label}</span>
              {value === option.value && <Check className="w-4 h-4 text-purple-400" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type ActiveFilterValue = 'ALL' | 'ACTIVE' | 'INACTIVE';

export const ACTIVE_STATUS_OPTIONS: StatusFilterOption<ActiveFilterValue>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export function ActiveStatusFilter({
  value,
  onChange,
  disabled,
}: {
  value: ActiveFilterValue;
  onChange: (value: ActiveFilterValue) => void;
  disabled?: boolean;
}) {
  return (
    <StatusFilter
      value={value}
      onChange={onChange}
      options={ACTIVE_STATUS_OPTIONS}
      disabled={disabled}
    />
  );
}

export type AppointmentFilterValue = 'ALL' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export const APPOINTMENT_STATUS_OPTIONS: StatusFilterOption<AppointmentFilterValue>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
];

export function AppointmentStatusFilter({
  value,
  onChange,
  disabled,
}: {
  value: AppointmentFilterValue;
  onChange: (value: AppointmentFilterValue) => void;
  disabled?: boolean;
}) {
  return (
    <StatusFilter
      value={value}
      onChange={onChange}
      options={APPOINTMENT_STATUS_OPTIONS}
      disabled={disabled}
    />
  );
}

export type ComplaintFilterValue = 'ALL' | 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED' | 'ESCALATED';

export const COMPLAINT_STATUS_OPTIONS: StatusFilterOption<ComplaintFilterValue>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: 'ESCALATED', label: 'Escalated' },
];

export function ComplaintStatusFilter({
  value,
  onChange,
  disabled,
}: {
  value: ComplaintFilterValue;
  onChange: (value: ComplaintFilterValue) => void;
  disabled?: boolean;
}) {
  return (
    <StatusFilter
      value={value}
      onChange={onChange}
      options={COMPLAINT_STATUS_OPTIONS}
      disabled={disabled}
    />
  );
}

export type KundaliMatchFilterValue = 'ALL' | 'PENDING' | 'REVIEWED';

export const KUNDALI_MATCH_STATUS_OPTIONS: StatusFilterOption<KundaliMatchFilterValue>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REVIEWED', label: 'Reviewed' },
];

export function KundaliMatchStatusFilter({
  value,
  onChange,
  disabled,
}: {
  value: KundaliMatchFilterValue;
  onChange: (value: KundaliMatchFilterValue) => void;
  disabled?: boolean;
}) {
  return (
    <StatusFilter
      value={value}
      onChange={onChange}
      options={KUNDALI_MATCH_STATUS_OPTIONS}
      disabled={disabled}
    />
  );
}

export type ChatAuditStatusFilterValue = '' | 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

export const CHAT_AUDIT_STATUS_OPTIONS: StatusFilterOption<ChatAuditStatusFilterValue>[] = [
  { value: '', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function ChatAuditStatusFilter({
  value,
  onChange,
  disabled,
}: {
  value: ChatAuditStatusFilterValue;
  onChange: (value: ChatAuditStatusFilterValue) => void;
  disabled?: boolean;
}) {
  return (
    <StatusFilter
      value={value}
      onChange={onChange}
      options={CHAT_AUDIT_STATUS_OPTIONS}
      disabled={disabled}
      placeholder="All Status"
    />
  );
}

export type ChatAuditTypeFilterValue = '' | 'BROADCAST_MESSAGE' | 'INSTANT_CHAT_REQUEST';

export const CHAT_AUDIT_TYPE_OPTIONS: StatusFilterOption<ChatAuditTypeFilterValue>[] = [
  { value: '', label: 'All Types' },
  { value: 'BROADCAST_MESSAGE', label: 'Broadcast' },
  { value: 'INSTANT_CHAT_REQUEST', label: 'Instant Chat' },
];

export function ChatAuditTypeFilter({
  value,
  onChange,
  disabled,
}: {
  value: ChatAuditTypeFilterValue;
  onChange: (value: ChatAuditTypeFilterValue) => void;
  disabled?: boolean;
}) {
  return (
    <StatusFilter
      value={value}
      onChange={onChange}
      options={CHAT_AUDIT_TYPE_OPTIONS}
      disabled={disabled}
      placeholder="All Types"
    />
  );
}

export type ChatStatusFilterValue = '' | 'ACTIVE' | 'ENDED';

export const CHAT_STATUS_OPTIONS: StatusFilterOption<ChatStatusFilterValue>[] = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ENDED', label: 'Ended' },
];

export function ChatStatusFilter({
  value,
  onChange,
  disabled,
}: {
  value: ChatStatusFilterValue;
  onChange: (value: ChatStatusFilterValue) => void;
  disabled?: boolean;
}) {
  return (
    <StatusFilter
      value={value}
      onChange={onChange}
      options={CHAT_STATUS_OPTIONS}
      disabled={disabled}
      placeholder="All Status"
    />
  );
}

export type AdminChatStatusFilterValue = '' | 'ACTIVE' | 'RESOLVED' | 'CLOSED';

export const ADMIN_CHAT_STATUS_OPTIONS: StatusFilterOption<AdminChatStatusFilterValue>[] = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

export function AdminChatStatusFilter({
  value,
  onChange,
  disabled,
}: {
  value: AdminChatStatusFilterValue;
  onChange: (value: AdminChatStatusFilterValue) => void;
  disabled?: boolean;
}) {
  return (
    <StatusFilter
      value={value}
      onChange={onChange}
      options={ADMIN_CHAT_STATUS_OPTIONS}
      disabled={disabled}
      placeholder="All Status"
    />
  );
}

/** Online presence for admin astrologer list (maps to API isOnline). */
export type OnlinePresenceFilterValue = 'ALL' | 'ONLINE' | 'OFFLINE';

export const ONLINE_PRESENCE_OPTIONS: StatusFilterOption<OnlinePresenceFilterValue>[] = [
  { value: 'ALL', label: 'Any online status' },
  { value: 'ONLINE', label: 'Online now' },
  { value: 'OFFLINE', label: 'Offline' },
];

export function OnlinePresenceFilter({
  value,
  onChange,
  disabled,
}: {
  value: OnlinePresenceFilterValue;
  onChange: (value: OnlinePresenceFilterValue) => void;
  disabled?: boolean;
}) {
  return (
    <StatusFilter
      value={value}
      onChange={onChange}
      options={ONLINE_PRESENCE_OPTIONS}
      disabled={disabled}
      placeholder="Online status"
    />
  );
}

export default StatusFilter;
