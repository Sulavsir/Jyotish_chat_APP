'use client';

import { Button, LoadingButton } from '@jyotish/ui';
import { Pencil, Trash2, Power, Wifi } from 'lucide-react';
import { SimpleTooltip } from '@/components/ui/Tooltip';
import type { Astrologer } from '@/types';

export interface AstrologerRowActionsProps {
  astrologer: Astrologer;
  onEdit: (astrologer: Astrologer) => void;
  onDelete: (astrologer: Astrologer) => void;
  onToggleStatus: (astrologer: Astrologer) => void;
  onToggleOnline: (astrologer: Astrologer) => void;
  isToggleOnlinePending?: boolean;
  isDeletePending?: boolean;
}

const buttonClass = 'border-slate-600 text-slate-300 hover:bg-slate-700/50';
const deleteButtonClass = 'border-red-500/50 text-red-400 hover:bg-red-500/10';

/**
 * Row actions for astrologers table: Edit, Delete, Toggle Status (icon buttons with tooltips).
 */
export function AstrologerRowActions({
  astrologer,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleOnline,
  isToggleOnlinePending = false,
  isDeletePending = false,
}: AstrologerRowActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <SimpleTooltip content="Edit">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onEdit(astrologer)}
          className={buttonClass}
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </SimpleTooltip>
      <SimpleTooltip content="Delete">
        <span className="inline-flex">
          <LoadingButton
            variant="outline"
            size="icon"
            onClick={() => onDelete(astrologer)}
            loading={isDeletePending}
            className={deleteButtonClass}
          >
            <Trash2 className="w-4 h-4" />
          </LoadingButton>
        </span>
      </SimpleTooltip>
      <SimpleTooltip content="Change Account Status">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onToggleStatus(astrologer)}
          className={buttonClass}
        >
          <Power className="w-4 h-4" />
        </Button>
      </SimpleTooltip>
      <SimpleTooltip content={astrologer.isOnline ? 'Set Offline' : 'Set Online'}>
        <span className="inline-flex">
          <LoadingButton
            variant="outline"
            size="icon"
            onClick={() => onToggleOnline(astrologer)}
            loading={isToggleOnlinePending}
            className={buttonClass}
          >
            <Wifi className="w-4 h-4" />
          </LoadingButton>
        </span>
      </SimpleTooltip>
    </div>
  );
}
