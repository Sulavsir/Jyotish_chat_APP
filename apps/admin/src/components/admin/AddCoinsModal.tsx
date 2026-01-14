/**
 * Add Coins Modal
 * Allows admin to add coins to a user
 */

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
import { Coins, Plus } from 'lucide-react';
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
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (value) => {
        const num = Number(value);
        return Number.isFinite(num) && num > 0;
      },
      { message: 'Please enter a valid positive number of coins' }
    ),
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
      amount: '',
      reason: '',
    },
  });

  const addCoinsMutation = useMutation({
    mutationFn: (data: { amount: number; reason?: string }) =>
      adminApi.users.addCoins(userId, data),
    onSuccess: () => {
      toast.success('Coins added successfully');
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.USERS.ALL });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.USERS.DETAIL(userId) });
      handleClose();
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      const message = axiosError?.response?.data?.error?.message || 'Failed to add coins';
      toast.error(message);
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = (values: AddCoinsFormValues) => {
    const coinsAmount = Number(values.amount);
    addCoinsMutation.mutate({
      amount: coinsAmount,
      reason: values.reason?.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-400" />
            Add Coins
          </DialogTitle>
          <DialogDescription className="text-purple-200/80">
            Add coins to {userName}
            {currentBalance !== undefined &&
              `'s account (Current Balance: ${currentBalance} coins)`}
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
                  <span className="text-yellow-400 font-semibold">{currentBalance}</span> coins
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-200 mb-2 block">Amount (Coins) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter number of coins"
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
                className="flex-1 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white"
                disabled={!form.watch('amount')}
                isLoading={addCoinsMutation.isPending}
                loadingText="Processing..."
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Coins
              </LoadingButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
