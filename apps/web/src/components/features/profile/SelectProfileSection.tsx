'use client';

import React, { useState, useCallback } from 'react';
import { Button, Label } from '@jyotish/ui';
import { UserPlus, User as UserIcon, Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { User, ClientProfile } from '@jyotish/shared';
import { clientProfileService } from '@/services/clientProfile.service';
import { QUERY_KEYS } from '@/constants';
import { showErrorToast } from '@/lib/error-handler';
import { formatBirthSummary } from '@/utils/birth-details.utils';
import { AddFamilyMemberModal } from '@/components/modals/AddFamilyMemberModal';
import { EditFamilyMemberModal } from '@/components/modals/EditFamilyMemberModal';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  LoadingButton,
} from '@/components/ui';

export interface SelectProfileSectionProps {
  user: User | null;
  profiles: ClientProfile[];
  selectedProfileId: string;
  onSelectProfileId: (id: string) => void;
  className?: string;
  /** Tighter layout for embedding in Ask Questions section */
  compact?: boolean;
  /** When set, "Add Family" opens this callback (e.g. open Add Family modal) instead of showing inline form */
  onAddFamilyClick?: () => void;
}

export function SelectProfileSection({
  user,
  profiles,
  selectedProfileId,
  onSelectProfileId,
  className = '',
  compact = false,
  onAddFamilyClick,
}: SelectProfileSectionProps) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ClientProfile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<ClientProfile | null>(null);
  const useExternalAddModal = typeof onAddFamilyClick === 'function';

  const deleteProfileMutation = useMutation({
    mutationFn: (id: string) => clientProfileService.remove(id),
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.PROFILES });
      setDeletingProfile(null);
      if (selectedProfileId === deletedId) onSelectProfileId('me');
      toast.success('Profile removed');
    },
    onError: (err) => {
      setDeletingProfile(null);
      showErrorToast(err);
    },
  });

  const handleAddClick = useCallback(() => {
    if (useExternalAddModal) {
      onAddFamilyClick!();
    } else {
      setShowAddModal(true);
    }
  }, [useExternalAddModal, onAddFamilyClick]);

  const meBirthSummary = formatBirthSummary(
    user
      ? {
          dateOfBirth: user.dateOfBirth,
          timeOfBirth: user.timeOfBirth,
          placeOfBirth: user.placeOfBirth,
        }
      : null
  );

  const gapClass = compact ? 'gap-1.5' : 'gap-2';
  const listMaxH = compact ? 'max-h-32' : 'max-h-40';

  return (
    <div className={className}>
      <Label className="text-sm font-medium text-gray-300 mb-1.5 block">
        Select profile (whose birth details to share with Jyotish)
      </Label>
      <div
        className={`flex flex-col ${gapClass} ${listMaxH} overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-2`}
      >
        {/* "Me" row */}
        <button
          type="button"
          onClick={() => onSelectProfileId('me')}
          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm border transition-colors ${
            selectedProfileId === 'me'
              ? 'bg-purple-500/20 border-purple-400/50 text-white'
              : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 flex-shrink-0" />
            <strong>Me</strong>
            {user?.name ? ` — ${user.name}` : ''}
          </span>
          <span className="text-xs text-gray-400 truncate max-w-[140px]">{meBirthSummary}</span>
        </button>

        {/* Family / friend profiles */}
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
              selectedProfileId === profile.id
                ? 'bg-purple-500/20 border-purple-400/50 text-white'
                : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <button
              type="button"
              className="flex-1 flex items-center justify-between gap-2 text-left min-w-0"
              onClick={() => onSelectProfileId(profile.id)}
            >
              <span className="font-medium truncate">{profile.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{profile.relationship}</span>
            </button>

            {/* Edit / Delete actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                type="button"
                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Edit profile"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingProfile(profile);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                title="Remove profile"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingProfile(profile);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Add button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-dashed border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
          onClick={handleAddClick}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Family Members or Friends
        </Button>
      </div>

      {/* Add modal (only used when no external onAddFamilyClick is provided) */}
      {!useExternalAddModal && (
        <AddFamilyMemberModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={(profile) => onSelectProfileId(profile.id)}
        />
      )}

      {/* Edit modal */}
      <EditFamilyMemberModal
        isOpen={editingProfile !== null}
        onClose={() => setEditingProfile(null)}
        profile={editingProfile}
      />

      {/* Delete confirmation modal */}
      <Dialog isOpen={deletingProfile !== null} onClose={() => setDeletingProfile(null)}>
        <DialogHeader>
          <DialogTitle>Remove Profile</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{deletingProfile?.name}</strong>
            {deletingProfile?.relationship ? ` (${deletingProfile.relationship})` : ''}?
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            This action cannot be undone. All birth details for this profile will be permanently
            deleted.
          </p>
        </DialogBody>

        <DialogFooter>
          <Button
            onClick={() => setDeletingProfile(null)}
            disabled={deleteProfileMutation.isPending}
            variant="outline"
            color="neutral"
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={() => deletingProfile && deleteProfileMutation.mutate(deletingProfile.id)}
            isLoading={deleteProfileMutation.isPending}
            loadingText="Removing..."
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Remove
          </LoadingButton>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
