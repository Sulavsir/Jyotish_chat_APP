/**
 * ProfileIncompleteDialog Component
 * Alert dialog shown when user tries to send a message without completing profile
 */

'use client';

import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog';
import { Button } from '@jyotish/ui';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants';
import { AlertCircle } from 'lucide-react';

interface ProfileIncompleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
}

export function ProfileIncompleteDialog({
  isOpen,
  onClose,
  missingFields,
}: ProfileIncompleteDialogProps) {
  const router = useRouter();

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
