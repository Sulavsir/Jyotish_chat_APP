'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  Button,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import { ADMIN_QUERY_KEYS } from '@/constants';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface AddCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentBalance?: number;
}

const addCoinsSchema = z.object({
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter a valid positive amount' }),
  reason: z.string().trim().optional(),
});

type AddCoinsFormValues = z.infer<typeof addCoinsSchema>;

export function AddCoinsModal({
  isOpen,
  onClose,
  userId,
  userName,
  currentBalance = 0,
}: AddCoinsModalProps) {
  const queryClient = useQueryClient();

  const form = useForm<AddCoinsFormValues>({
    resolver: zodResolver(addCoinsSchema),
    defaultValues: {
      amount: 0,
      reason: '',
    },
  });

  const addCoinsMutation = useMutation({
    mutationFn: (data: { amount: number; reason?: string }) =>
      adminApi.users.addCoins(userId, data),
    onSuccess: () => {
      toast.success('Balance added successfully');
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.USERS.ALL });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.USERS.DETAIL(userId) });
      handleClose();
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      const message = axiosError?.response?.data?.error?.message || 'Failed to add balance';
      toast.error(message);
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = (values: AddCoinsFormValues) => {
    addCoinsMutation.mutate({
      amount: values.amount,
      reason: values.reason?.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            Add Balance (NRs)
          </DialogTitle>
          <DialogDescription className="text-purple-200/80">
            Add balance to {userName}
            {currentBalance !== undefined && `'s account.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <Label className="text-purple-200 mb-2 block">User</Label>
              <p className="text-white font-semibold">{userName}</p>
              {currentBalance !== undefined && (
                <p className="text-sm text-purple-300 mt-1">
                  Current Balance:{' '}
                  <span className="text-emerald-400 font-semibold">
                    NRs {currentBalance.toLocaleString()}
                  </span>
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-200 mb-2 block">Amount (Balance) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter amount"
                      className="bg-slate-800/50 text-white border-purple-500/30"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-200 mb-2 block">Reason (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g., Promotional bonus, Refund, etc."
                      className="bg-slate-800/50 text-white border-purple-500/30"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="flex-1 border-purple-500/30 text-purple-200 hover:bg-purple-900/30"
                disabled={addCoinsMutation.isPending}
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white"
                disabled={!form.watch('amount')}
                isLoading={addCoinsMutation.isPending}
                loadingText="Adding Balance..."
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Balance
              </LoadingButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
