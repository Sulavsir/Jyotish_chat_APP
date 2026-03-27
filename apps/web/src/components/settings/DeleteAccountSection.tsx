/**
 * Danger zone: soft-delete client account (server clears phone/email for re-registration).
 */

'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  LoadingButton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
} from '@jyotish/ui';
import { deleteMyAccountBodySchema } from '@jyotish/shared';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth-store';
import { ROUTES } from '@/constants';
import { useRouter } from 'next/navigation';
import { displayError, displaySuccess } from '@/utils/error-handler';
import type { ApiError } from '@/types/auth';

const CONFIRM_PHRASE = 'DELETE_MY_ACCOUNT' as const;

export function DeleteAccountSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const mutation = useMutation({
    mutationFn: () => authApi.deleteMyAccount({ confirmation: CONFIRM_PHRASE }),
    onSuccess: async (data) => {
      displaySuccess(data.message);
      await queryClient.invalidateQueries();
      await logout();
      setOpen(false);
      setConfirmText('');
      router.push(ROUTES.HOME);
    },
    onError: (error: ApiError) => {
      displayError(error);
    },
  });

  const confirmationValid = deleteMyAccountBodySchema.safeParse({
    confirmation: confirmText,
  }).success;

  return (
    <>
      <Card className="bg-black/40 backdrop-blur-md border-red-500/25">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">Delete account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-400 leading-relaxed">
            Permanently remove access to this account. Your profile data stays on record for support
            and history, but your phone and email can be used to create a new account later.
          </p>
          <Button type="button" color="danger" onClick={() => setOpen(true)}>
            Delete my account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription className="text-gray-400">
              This cannot be undone from the app. Type{' '}
              <span className="font-mono text-amber-200/95">{CONFIRM_PHRASE}</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="delete-account-confirm" className="text-gray-300">
              Confirmation
            </Label>
            <Input
              id="delete-account-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              autoComplete="off"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => {
                setOpen(false);
                setConfirmText('');
              }}
            >
              Cancel
            </Button>
            <LoadingButton
              type="button"
              color="danger"
              disabled={!confirmationValid}
              loading={mutation.isPending}
              loadingText="Deleting…"
              onClick={() => mutation.mutate()}
            >
              Delete account
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
