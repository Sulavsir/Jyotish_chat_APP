/**
 * Client Chat History Modal
 * Wraps ClientChatHistoryPanel in a dialog (non-sidebar contexts).
 */

'use client';

import React from 'react';
import { Dialog, DialogContent } from '@jyotish/ui';
import { ClientChatHistoryPanel } from './ClientChatHistoryPanel';

interface ClientChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName?: string | null;
}

export function ClientChatHistoryModal({
  isOpen,
  onClose,
  clientId,
  clientName,
}: ClientChatHistoryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[min(100vw-1.5rem,56rem)] max-h-[85vh] flex flex-col bg-slate-900 border-slate-700 p-0 gap-0 overflow-hidden">
        <ClientChatHistoryPanel
          isActive={isOpen}
          onClose={onClose}
          clientId={clientId}
          clientName={clientName}
          layout="modal"
        />
      </DialogContent>
    </Dialog>
  );
}
