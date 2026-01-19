/**
 * ProfileIncompleteDialog Component
 * Alert dialog shown when user tries to send a message without completing profile
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog';
import { Button, Label } from '@jyotish/ui';
import { useRouter } from 'next/navigation';
import { ROUTES, GenderEnum, type GenderType } from '@/constants';
import { AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth-store';
import { displayError, displaySuccess } from '@/utils/error-handler';
import type { ApiError } from '@/types/auth';

interface ProfileIncompleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
}

const GENDER_STORAGE_KEY = 'jyotish_user_gender';

export function ProfileIncompleteDialog({
  isOpen,
  onClose,
  missingFields,
}: ProfileIncompleteDialogProps) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const isGenderMissing = missingFields.includes('Gender');
  
  // Initialize selectedGender from user or localStorage
  const getInitialGender = (): GenderType | null => {
    // First try from user object (from auth store which reads from localStorage)
    if (user?.gender) {
      return user.gender as GenderType;
    }
    // Fallback to direct localStorage read
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(GENDER_STORAGE_KEY);
        if (stored) {
          return stored as GenderType;
        }
      } catch (error) {
        console.error('Error reading gender from localStorage:', error);
      }
    }
    return null;
  };
  
  const [selectedGender, setSelectedGender] = useState<GenderType | null>(getInitialGender);
  
  // Update selectedGender when user updates or dialog opens
  useEffect(() => {
    if (isOpen) {
      // First try from user object
      if (user?.gender) {
        setSelectedGender(user.gender as GenderType);
      } else if (typeof window !== 'undefined') {
        // Fallback to direct localStorage read
        try {
          const stored = localStorage.getItem(GENDER_STORAGE_KEY);
          if (stored) {
            setSelectedGender(stored as GenderType);
          }
        } catch (error) {
          console.error('Error reading gender from localStorage:', error);
        }
      }
    }
  }, [user?.gender, isOpen]);

  // Update gender mutation
  const updateGenderMutation = useMutation({
    mutationFn: async (gender: GenderType) => {
      return authApi.updateBirthDetails({ gender });
    },
    onSuccess: (updatedUser) => {
      // Update auth store (which persists to localStorage)
      setUser(updatedUser);
      
      // Also explicitly save to localStorage for immediate access
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(GENDER_STORAGE_KEY, updatedUser.gender || '');
        } catch (error) {
          console.error('Error saving gender to localStorage:', error);
        }
      }
      
      // Update local state
      setSelectedGender(updatedUser.gender as GenderType);
      
      displaySuccess('Gender updated successfully!');
      if (missingFields.length === 1 && isGenderMissing) {
        // If gender was the only missing field, close dialog
        onClose();
      }
    },
    onError: (error: ApiError) => {
      displayError(error, 'Failed to update gender');
    },
  });

  const handleSaveGender = () => {
    if (!selectedGender) {
      displayError({ message: 'Please select a gender' } as ApiError, 'Gender required');
      return;
    }
    updateGenderMutation.mutate(selectedGender);
  };

  const handleGoToProfile = () => {
    onClose();
    router.push(ROUTES.PROFILE);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <DialogHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/10">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
          </div>
          <DialogTitle className="text-white">Complete Your Profile</DialogTitle>
        </div>
        <DialogDescription className="text-gray-300">
          To send messages to astrologers, please complete your profile with the following
          information:
        </DialogDescription>
      </DialogHeader>

      <div className="py-4">
        <div className="bg-black/40 border border-white/10 rounded-lg p-4">
          <p className="text-sm font-semibold text-white mb-2">Missing Fields:</p>
          <ul className="space-y-1">
            {missingFields.map((field) => (
              <li key={field} className="text-sm text-gray-300 flex items-center gap-2">
                <span className="text-yellow-500">•</span>
                {field}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-gray-400 m-3">
          This information helps astrologers provide you with accurate readings and guidance.
        </p>

        {/* Quick Gender Selection - if only gender is missing */}
        {isGenderMissing && missingFields.length === 1 && (
          <div className="mt-4 p-4 bg-black/60 border border-white/10 rounded-lg">
            <Label htmlFor="quick-gender" className="text-white text-sm font-medium mb-2 block">
              Select Your Gender
            </Label>
            <select
              id="quick-gender"
              value={selectedGender || ''}
              onChange={(e) => setSelectedGender(e.target.value as GenderType | null)}
              className="w-full px-3 py-2 bg-white/5 border-2 border-white/20 rounded-md text-white text-sm transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 [color-scheme:dark]"
            >
              <option value="" className="bg-slate-900 text-white">Select Gender</option>
              <option value={GenderEnum.MALE} className="bg-slate-900 text-white">Male</option>
              <option value={GenderEnum.FEMALE} className="bg-slate-900 text-white">Female</option>
              <option value={GenderEnum.OTHER} className="bg-slate-900 text-white">Other</option>
            </select>
            <Button
              onClick={handleSaveGender}
              disabled={!selectedGender || updateGenderMutation.isPending}
              className="mt-3 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {updateGenderMutation.isPending ? 'Saving...' : 'Save Gender'}
            </Button>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} className="text-white border-white/20">
          Cancel
        </Button>
        <Button
          onClick={handleGoToProfile}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          Complete Profile
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
