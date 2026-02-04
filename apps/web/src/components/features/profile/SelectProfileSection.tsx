'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
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
import { UserPlus, User as UserIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClientProfileSchema } from '@jyotish/shared';
import { z } from 'zod';
import type { User, ClientProfile } from '@jyotish/shared';
import { clientProfileService } from '@/services/clientProfile.service';
import { QUERY_KEYS } from '@/constants';
import { formatBirthSummary } from '@/utils/birth-details.utils';

type AddFamilyFormValues = z.infer<typeof createClientProfileSchema>;

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
  const [showAddForm, setShowAddForm] = useState(false);
  const useAddFamilyModal = typeof onAddFamilyClick === 'function';

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
      setShowAddForm(false);
      form.reset(defaultFormValues);
      onSelectProfileId(data.profile.id);
      toast.success('Family member added');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add');
    },
  });

  const defaultFormValues: AddFamilyFormValues = {
    name: '',
    relationship: '',
    dateOfBirth: undefined,
    timeOfBirth: '',
    placeOfBirth: '',
    gender: null,
  };

  const form = useForm<AddFamilyFormValues>({
    resolver: zodResolver(createClientProfileSchema),
    defaultValues: defaultFormValues,
  });

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
        {profiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => onSelectProfileId(profile.id)}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm border transition-colors ${
              selectedProfileId === profile.id
                ? 'bg-purple-500/20 border-purple-400/50 text-white'
                : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="font-medium">{profile.name}</span>
            <span className="text-xs text-gray-400">{profile.relationship}</span>
          </button>
        ))}
        {useAddFamilyModal ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-dashed border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
            onClick={onAddFamilyClick}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Family Members or Friends
          </Button>
        ) : !showAddForm ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-dashed border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
            onClick={() => setShowAddForm(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Family Members or Friends
          </Button>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
            <p className="text-xs font-medium text-gray-300">Add family or friend</p>
            <form
              onSubmit={form.handleSubmit((values) => addProfileMutation.mutate(values))}
              className="space-y-2"
            >
              <div>
                <Label htmlFor="profile-name" className="text-gray-400">
                  Name
                </Label>
                <Input
                  id="profile-name"
                  {...form.register('name')}
                  placeholder="Full name"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-400 mt-0.5">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="profile-relationship" className="text-gray-400">
                  Relationship
                </Label>
                <Input
                  id="profile-relationship"
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
                  <Label htmlFor="profile-dob" className="text-gray-400">
                    Date of birth
                  </Label>
                  <Input
                    id="profile-dob"
                    type="date"
                    {...form.register('dateOfBirth')}
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="profile-tob" className="text-gray-400">
                    Time of Birth
                  </Label>
                  <Input
                    id="profile-tob"
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
                <Label htmlFor="profile-pob" className="text-gray-400">
                  Place of birth
                </Label>
                <Input
                  id="profile-pob"
                  {...form.register('placeOfBirth')}
                  placeholder="City or place"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label className="text-gray-400">Gender</Label>
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
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-gray-300"
                  onClick={() => {
                    setShowAddForm(false);
                    form.reset(defaultFormValues);
                  }}
                >
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  size="sm"
                  loading={addProfileMutation.isPending}
                  disabled={addProfileMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Add
                </LoadingButton>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
