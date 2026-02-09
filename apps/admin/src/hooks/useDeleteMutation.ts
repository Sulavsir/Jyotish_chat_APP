'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface UseDeleteMutationOptions<TId = string> {
  mutationFn: (id: TId) => Promise<unknown>;
  invalidateQueryKeys: readonly unknown[];
  successMessage: string;
  errorMessage?: string;
}

/**
 * Reusable delete (soft-delete) mutation with cache invalidation and toasts.
 */
export function useDeleteMutation<TId = string>({
  mutationFn,
  invalidateQueryKeys,
  successMessage,
  errorMessage = 'Failed to delete',
}: UseDeleteMutationOptions<TId>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: [...invalidateQueryKeys] });
    },
    onError: (err: Error) => {
      toast.error(err?.message ?? errorMessage);
    },
  });
}
