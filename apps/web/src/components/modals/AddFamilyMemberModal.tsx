/**
 * Add Family Member Modal
 * Form to add a family/friend profile (birth details). Opens from Select Profile modal or Request Instant Chat.
 */

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  LoadingButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jyotish/ui';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClientProfileSchema } from '@jyotish/shared';
import { z } from 'zod';
import type { ClientProfile } from '@jyotish/shared';
import { clientProfileService } from '@/services/clientProfile.service';
import { QUERY_KEYS } from '@/constants';

type AddFamilyFormValues = z.infer<typeof createClientProfileSchema>;

export interface AddFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (profile: ClientProfile) => void;
}

const defaultFormValues: AddFamilyFormValues = {
  name: '',
  relationship: '',
  dateOfBirth: undefined,
  timeOfBirth: '',
  placeOfBirth: '',
  gender: null,
};

export function AddFamilyMemberModal({ isOpen, onClose, onSuccess }: AddFamilyMemberModalProps) {
  const queryClient = useQueryClient();
  const form = useForm<AddFamilyFormValues>({
    resolver: zodResolver(createClientProfileSchema),
    defaultValues: defaultFormValues,
  });

  const addProfileMutation = useMutation({
    mutationFn: (values: AddFamilyFormValues) => {
      const dateOfBirth =
        values.dateOfBirth == null
          ? undefined
          : values.dateOfBirth instanceof Date
            ? values.dateOfBirth.toISOString().split('T')[0]
            : typeof values.dateOfBirth === 'string'
              ? values.dateOfBirth.trim() || undefined
              : undefined;
      return clientProfileService.create({
        name: values.name.trim(),
        relationship: values.relationship.trim(),
        dateOfBirth,
        timeOfBirth:
          typeof values.timeOfBirth === 'string'
            ? values.timeOfBirth.trim() || undefined
            : undefined,
        placeOfBirth:
          typeof values.placeOfBirth === 'string'
            ? values.placeOfBirth.trim() || undefined
            : undefined,
        gender: values.gender ?? undefined,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.PROFILES });
      form.reset(defaultFormValues);
      onClose();
      onSuccess?.(data.profile);
      toast.success('Family member added');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add');
    },
  });

  const handleClose = () => {
    form.reset(defaultFormValues);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md border border-white/10 bg-slate-900/95 backdrop-blur-md text-white shadow-xl shadow-black/20">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-semibold flex items-center justify-between text-white">
            <span>Add Family Member or Friend</span>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) => addProfileMutation.mutate(values))}
          className="space-y-3"
        >
          <div>
            <Label htmlFor="add-profile-name" className="text-gray-300">
              Name
            </Label>
            <Input
              id="add-profile-name"
              {...form.register('name')}
              placeholder="Full name"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-400 mt-0.5">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="add-profile-relationship" className="text-gray-300">
              Relationship
            </Label>
            <Input
              id="add-profile-relationship"
              {...form.register('relationship')}
              placeholder="e.g. Father, Mother, Friend"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
            {form.formState.errors.relationship && (
              <p className="text-xs text-red-400 mt-0.5">
                {form.formState.errors.relationship.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="add-profile-dob" className="text-gray-300">
                Date of birth
              </Label>
              <Input
                id="add-profile-dob"
                type="date"
                {...form.register('dateOfBirth')}
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="add-profile-tob" className="text-gray-300">
                Time of Birth
              </Label>
              <Input
                id="add-profile-tob"
                type="time"
                {...form.register('timeOfBirth')}
                className="mt-1 bg-white/5 border-white/10 text-white [color-scheme:dark]"
              />
              {form.formState.errors.timeOfBirth && (
                <p className="text-xs text-red-400 mt-0.5">
                  {form.formState.errors.timeOfBirth.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">24-hour format</p>
            </div>
          </div>
          <div>
            <Label htmlFor="add-profile-pob" className="text-gray-300">
              Place of birth
            </Label>
            <Input
              id="add-profile-pob"
              {...form.register('placeOfBirth')}
              placeholder="City or place"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <div>
            <Label className="text-gray-300">Gender</Label>
            <Select
              value={form.watch('gender') ?? ''}
              onValueChange={(v) =>
                form.setValue('gender', v === '' ? null : (v as 'MALE' | 'FEMALE' | 'OTHER'))
              }
            >
              <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              loading={addProfileMutation.isPending}
              disabled={addProfileMutation.isPending}
            >
              Add
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
