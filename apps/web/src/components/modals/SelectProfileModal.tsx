'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  LoadingButton,
} from '@jyotish/ui';
import { X, Banknote } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { clientProfileService } from '@/services/clientProfile.service';
import { QUERY_KEYS } from '@/constants';
import { SelectProfileSection } from '@/components/profile';
import { AddFamilyMemberModal } from './AddFamilyMemberModal';
import type { ClientProfile } from '@jyotish/shared';

export interface SelectProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedProfileId: string) => void;
  defaultSelectedProfileId?: string;
  title?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  /** Only for "chat with specific jyotish" - do NOT pass for Request Instant Chat */
  feePerMessageNr?: number;
  /** Only for "chat with specific jyotish" - do NOT pass for Request Instant Chat */
  astrologerName?: string;
}

export function SelectProfileModal({
  isOpen,
  onClose,
  onConfirm,
  defaultSelectedProfileId = 'me',
  title = 'Select profile',
  confirmLabel = 'Continue',
  isLoading = false,
  feePerMessageNr,
  astrologerName,
}: SelectProfileModalProps) {
  const user = useAuthStore((s) => s.user);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(defaultSelectedProfileId);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);

  // When modal opens, sync selection to current context (e.g. chat's selected profile)
  useEffect(() => {
    if (isOpen) {
      setSelectedProfileId(defaultSelectedProfileId);
    }
  }, [isOpen, defaultSelectedProfileId]);

  const { data: profilesData } = useQuery({
    queryKey: QUERY_KEYS.USERS.PROFILES,
    queryFn: () => clientProfileService.list(),
    enabled: isOpen,
  });
  const familyProfiles: ClientProfile[] = profilesData?.profiles ?? [];

  const handleConfirm = () => {
    onConfirm(selectedProfileId);
    onClose();
  };

  const handleAddSuccess = (profile: ClientProfile) => {
    setSelectedProfileId(profile.id);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md border border-white/10 bg-slate-900/95 backdrop-blur-md text-white shadow-xl shadow-black/20">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-semibold flex items-center justify-between text-white">
              <span>{title}</span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogTitle>
          </DialogHeader>

          {feePerMessageNr != null && feePerMessageNr > 0 && (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-3">
              <Banknote className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-100">
                  {astrologerName
                    ? `${astrologerName} charges NRs ${feePerMessageNr.toLocaleString()} per message`
                    : `NRs ${feePerMessageNr.toLocaleString()} per message`}
                </p>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  This amount will be deducted when you send your first message.
                </p>
              </div>
            </div>
          )}

          {feePerMessageNr === 0 && astrologerName && (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-start gap-3">
              <Banknote className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-100">
                {astrologerName} is appointment-only. No per-message fee for chat.
              </p>
            </div>
          )}

          <p className="text-sm text-gray-400 mb-3">
            Whose birth details should be shared with the Jyotish?
          </p>

          <SelectProfileSection
            user={user}
            profiles={familyProfiles}
            selectedProfileId={selectedProfileId}
            onSelectProfileId={setSelectedProfileId}
            onAddFamilyClick={() => setShowAddFamilyModal(true)}
            compact
          />

          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <LoadingButton
              type="button"
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={handleConfirm}
              loading={isLoading}
              disabled={isLoading}
            >
              {confirmLabel}
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      <AddFamilyMemberModal
        isOpen={showAddFamilyModal}
        onClose={() => setShowAddFamilyModal(false)}
        onSuccess={handleAddSuccess}
      />
    </>
  );
}
