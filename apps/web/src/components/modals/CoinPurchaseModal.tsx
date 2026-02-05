/**
 * Coin Purchase Modal
 * Opens when user has insufficient coins for chat
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  AlertDescription,
  Input,
} from '@jyotish/ui';
import { Coins, Loader2, Plus, Infinity as InfinityIcon } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pricingService } from '@/services/pricing.service';
import { coinService } from '@/services/coin.service';
import { QUERY_KEYS, ROUTES, COIN_PRICE_NPR } from '@/constants';
import { useAuthStore } from '@/store/auth-store';
import type { PricingPlan } from '@/types/pricing.types';
import { toast } from 'sonner';

type CoinPurchaseMode = 'insufficient' | 'purchase';

interface CoinPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCoins: number;
  onPurchaseSuccess?: () => void;
  mode?: CoinPurchaseMode;
}

export function CoinPurchaseModal({
  isOpen,
  onClose,
  requiredCoins,
  onPurchaseSuccess,
  mode = 'insufficient',
}: CoinPurchaseModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // Custom coin selection state (defaults to requiredCoins or 1)
  const [customCoins, setCustomCoins] = useState<number>(requiredCoins || 1);

  const isInsufficientMode = mode === 'insufficient';

  const handleDecreaseCoins = () => {
    setCustomCoins((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleIncreaseCoins = () => {
    setCustomCoins((prev) => prev + 1);
  };

  // Fetch pricing plans
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: QUERY_KEYS.PRICING.PLANS,
    queryFn: () => pricingService.getPlans(),
    enabled: isOpen,
  });

  // Fetch current coin balance
  const { data: balanceData } = useQuery({
    queryKey: QUERY_KEYS.COINS.BALANCE,
    queryFn: () => coinService.getBalance(),
    enabled: isOpen && !!user,
  });

  const currentBalance = balanceData?.balance ?? 0;

  const plans = plansData?.plans || [];

  // Unlimited chat pack (if available)
  const unlimitedPlan = plans.find((plan) => plan.isUnlimited && plan.isActive);

  // Filter coin packs that have enough coins (exclude unlimited here)
  const eligiblePlans = plans.filter(
    (plan) => !plan.isUnlimited && plan.coins >= requiredCoins && plan.isActive
  );

  const handlePurchase = (plan: PricingPlan) => {
    // Store pending chat info if callback exists
    if (onPurchaseSuccess) {
      sessionStorage.setItem(
        'pendingChatAfterPurchase',
        JSON.stringify({
          hasCallback: true,
        })
      );
    }
    // Navigate to payment page
    router.push(
      `${ROUTES.PAYMENT}?planId=${plan.id}&amount=${plan.priceInNrs}&coins=${plan.coins}`
    );
    onClose();
  };

  const handleGoToPricing = () => {
    router.push(ROUTES.PRICING);
    onClose();
  };

  const handleCustomPurchase = () => {
    const coins = customCoins > 0 ? customCoins : 1;
    const amount = COIN_PRICE_NPR * coins;

    // Store pending chat info if callback exists
    if (onPurchaseSuccess) {
      sessionStorage.setItem(
        'pendingChatAfterPurchase',
        JSON.stringify({
          hasCallback: true,
        })
      );
    }

    router.push(`${ROUTES.PAYMENT}?planId=custom-${coins}&amount=${amount}&coins=${coins}`);
    onClose();
  };

  const handlePurchaseWithCoins = async (plan: PricingPlan) => {
    if (!plan.coinPrice || plan.coinPrice <= 0) {
      toast.error('This plan cannot be purchased with coins');
      return;
    }

    if (currentBalance < plan.coinPrice) {
      toast.error(
        `Insufficient coins. You need ${plan.coinPrice} coins but have ${currentBalance}`
      );
      return;
    }

    try {
      // Call API to purchase plan with coins (amount: 0 indicates coin purchase)
      const { coinService } = await import('@/services/coin.service');
      await coinService.addCoins({ planId: plan.id, amount: 0 });

      toast.success('Unlimited plan activated successfully!');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRICING.PLANS });

      // Store pending chat info if callback exists
      if (onPurchaseSuccess) {
        sessionStorage.setItem(
          'pendingChatAfterPurchase',
          JSON.stringify({
            hasCallback: true,
          })
        );
        // Trigger callback after a short delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('coinsPurchased'));
        }, 500);
      }

      onClose();
    } catch (error) {
      console.error('Error purchasing plan with coins:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to purchase plan');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border border-purple-500/30 shadow-2xl shadow-purple-900/50 overflow-hidden rounded-2xl flex flex-col">
        {/* Animated background effect (same style as BookAppointmentModal) */}
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
          <div
            className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
            style={{ animationDelay: '4s' }}
          />
        </div>

        {/* Content wrapper */}
        <div className="relative flex flex-col h-full min-h-0">
          {/* Header with DialogTitle and current balance (aligned with BookAppointment style) */}
          <DialogHeader className="flex-shrink-0 px-4 py-4 sm:px-6 sm:py-5 border-b border-purple-500 bg-gradient-to-r from-purple-900/40 to-indigo-900 backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-300 to-orange-400 shadow-[0_0_25px_rgba(251,191,36,0.8)]">
                  <Coins className="h-5 w-5 text-slate-900" />
                </span>
                <div className="flex flex-col">
                  <DialogTitle className="text-lg sm:text-2xl font-bold text-white flex items-center flex-wrap gap-1 sm:gap-2">
                    <span>{isInsufficientMode ? 'Insufficient Coins' : 'Purchase Coins'}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-purple-200/90">
                    {isInsufficientMode
                      ? 'Top up your balance or unlock an unlimited chat pack to continue.'
                      : 'Add more coins to your wallet or unlock an unlimited chat pack.'}
                  </DialogDescription>
                </div>
              </div>

              <div className="sm:w-80">
                <Alert
                  variant={isInsufficientMode ? 'warning' : 'info'}
                  className="bg-opacity-90 border-opacity-70"
                >
                  <AlertTitle className="flex items-center justify-between text-[11px] sm:text-xs">
                    <span>Current Balance</span>
                    <span className="inline-flex items-center gap-1">
                      <Coins className="h-3 w-3 text-yellow-300" />
                      <span className="font-semibold">
                        {currentBalance.toLocaleString()} coin{currentBalance === 1 ? '' : 's'}
                      </span>
                    </span>
                  </AlertTitle>
                  <AlertDescription className="mt-1 text-[11px] sm:text-xs">
                    {isInsufficientMode && requiredCoins > currentBalance ? (
                      <>
                        You need{' '}
                        <span className="font-semibold">
                          {requiredCoins - currentBalance} more coin
                          {requiredCoins - currentBalance === 1 ? '' : 's'}
                        </span>{' '}
                        to start this chat.
                      </>
                    ) : (
                      <>You can purchase more coins or choose an unlimited chat pack below.</>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable content area (BookAppointment-style) */}
          <div
            className="flex-1 min-h-0 p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 border-t border-purple-500/30 shadow-inner overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800/50 [&::-webkit-scrollbar-thumb]:bg-purple-500/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/70"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#a855f7 #1e293b',
            }}
          >
            {/* Custom coins selector */}
            <Card className="mb-6 border-none bg-transparent shadow-none p-0">
              <CardContent className="p-0">
                <div className="rounded-2xl border border-purple-500/50 bg-gradient-to-br from-purple-900/70 via-indigo-900/60 to-slate-900/80 px-4 py-4 space-y-4 shadow-[0_0_25px_rgba(129,140,248,0.35)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white flex items-center gap-2 tracking-wide">
                        <Coins className="h-4 w-4 text-yellow-300" />
                        Select coins to buy
                      </p>
                      <p className="text-xs text-purple-200/80">
                        1 coin = NPR {COIN_PRICE_NPR.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-12 h-12 flex items-center justify-center rounded-full border-purple-400/60 bg-purple-900/40 text-purple-100 hover:bg-purple-800/70 hover:border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                        onClick={handleDecreaseCoins}
                      >
                        <span className="text-lg leading-none">-</span>
                      </Button>
                      <div className="flex flex-col items-center gap-1">
                        <Input
                          type="number"
                          min={1}
                          max={9999}
                          value={customCoins}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '') {
                              setCustomCoins(1);
                              return;
                            }
                            const n = parseInt(v, 10);
                            if (!Number.isNaN(n) && n >= 1) {
                              setCustomCoins(Math.min(9999, n));
                            }
                          }}
                          className="h-12 min-w-[5.5rem] w-20 px-3 text-center text-lg font-bold text-yellow-300 caret-yellow-300 border-purple-400/70 bg-purple-950/80 shadow-[0_0_12px_rgba(168,85,247,0.25)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <p className="text-[10px] uppercase tracking-[0.18em] text-purple-200/80">
                          Coins
                        </p>
                      </div>
                      <Button
                        type="button"
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white shadow-[0_0_18px_rgba(129,140,248,0.75)]"
                        onClick={handleIncreaseCoins}
                      >
                        <Plus className="h-8 w-8 text-white" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-purple-500/30 pt-3">
                    <p className="text-xs text-purple-100/80">Estimated amount</p>
                    <p className="text-sm font-semibold text-yellow-200">
                      NPR {(customCoins * COIN_PRICE_NPR).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleCustomPurchase}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(129,140,248,0.75)] hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400"
                    >
                      <Coins className="h-4 w-4" />
                      <span>
                        Buy {customCoins} Coin{customCoins > 1 ? 's' : ''}
                      </span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unlimited chat pack highlight (if available) */}
            {unlimitedPlan && (
              <Card className="mb-6 border-none bg-transparent shadow-none p-0">
                <CardContent className="p-0">
                  <div className="rounded-2xl border border-indigo-400/70 bg-gradient-to-r from-indigo-700/80 via-purple-700/80 to-pink-700/80 px-4 py-4 shadow-[0_0_35px_rgba(129,140,248,0.6)]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 ring-2 ring-indigo-200/70">
                          <InfinityIcon className="h-5 w-5 text-indigo-100" />
                        </div>
                        <div>
                          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100/80">
                            Unlimited Chat Pack
                            <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-medium text-indigo-100">
                              {unlimitedPlan.validityInDays ?? 1} Day
                            </span>
                          </p>
                          <h4 className="mt-1 text-base font-bold text-white">
                            {unlimitedPlan.name || '1-Day Unlimited Consultations'}
                          </h4>
                          <p className="mt-1 text-xs text-indigo-100/85">
                            Unlimited chat sessions with astrologers for the selected period.
                            Perfect when you expect many follow-up questions in a single day.
                          </p>
                          <p className="mt-2 text-sm font-semibold text-amber-200">
                            NPR {unlimitedPlan.priceInNrs.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          onClick={() => handlePurchase(unlimitedPlan)}
                          className="shrink-0 rounded-xl bg-black/40 px-4 py-2 text-sm font-semibold text-indigo-100 ring-2 ring-indigo-200/80 hover:bg-black/60 hover:ring-indigo-100"
                        >
                          Buy with Money
                        </Button>
                        {unlimitedPlan.coinPrice && unlimitedPlan.coinPrice > 0 && (
                          <Button
                            type="button"
                            onClick={() => handlePurchaseWithCoins(unlimitedPlan)}
                            className="shrink-0 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-4 py-2 text-sm font-semibold text-yellow-200 ring-2 ring-yellow-400/50 hover:from-yellow-500/30 hover:to-amber-500/30"
                            disabled={currentBalance < unlimitedPlan.coinPrice}
                          >
                            Buy with {unlimitedPlan.coinPrice} Coins
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {plansLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
              </div>
            ) : eligiblePlans.length === 0 ? (
              <div className="text-center py-8">
                <p className="mb-4 text-sm text-purple-100/80">
                  No coin packs available that meet this requirement. Explore all packs on the
                  pricing page.
                </p>
                <Button
                  onClick={handleGoToPricing}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_22px_rgba(129,140,248,0.7)] hover:from-purple-500 hover:to-indigo-500"
                >
                  View All Plans
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {eligiblePlans.slice(0, 3).map((plan) => (
                  <div
                    key={plan.id}
                    className="relative overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-br from-slate-900/80 via-purple-900/70 to-slate-900/80 px-4 py-3 hover:border-purple-300/80 transition-colors"
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-20">
                      <div className="absolute -right-6 -top-8 h-20 w-20 rounded-full bg-purple-500/60 blur-2xl" />
                    </div>
                    <div className="relative z-10 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white mb-1">{plan.name}</h4>
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-[11px] font-semibold text-yellow-300">
                            <Coins className="h-3 w-3" />
                            {plan.coins} coins
                          </span>
                          <span className="text-purple-100">
                            NPR {plan.priceInNrs.toLocaleString()}
                          </span>
                          {plan.validityInDays && (
                            <span className="rounded-full border border-purple-400/50 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-purple-100/80">
                              {plan.validityInDays} Days Validity
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handlePurchase(plan)}
                        className="shrink-0 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-400 px-4 py-2 text-xs font-semibold text-slate-900 shadow-[0_0_18px_rgba(250,204,21,0.85)] hover:from-yellow-400 hover:via-amber-300 hover:to-orange-300"
                      >
                        Buy Pack
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-purple-500/20 mt-6">
              <Button
                onClick={handleGoToPricing}
                variant="outline"
                className="flex-1 rounded-xl border-purple-400/50 bg-black/20 text-purple-100 hover:bg-purple-900/40 text-sm"
              >
                View All Plans
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 rounded-xl border-purple-400/40 bg-black/10 text-purple-100 hover:bg-purple-900/30 text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
