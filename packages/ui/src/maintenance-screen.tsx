'use client';

import * as React from 'react';
import { MAINTENANCE_MESSAGES } from '@jyotish/shared';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { LoadingButton } from './loading-button';
import { cn } from './utils';

function MaintenanceIllustration({
  className,
  variant,
}: {
  className?: string;
  variant: 'default' | 'admin';
}) {
  return (
    <div
      className={cn(
        'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-inner ring-1',
        variant === 'admin'
          ? 'bg-gradient-to-br from-amber-500/25 to-orange-600/15 ring-amber-400/35'
          : 'bg-gradient-to-br from-amber-100 to-orange-100 ring-amber-200/80 dark:from-amber-950/80 dark:to-orange-950/60 dark:ring-amber-800/50',
        className
      )}
      aria-hidden
    >
      <svg
        className={cn(
          'h-9 w-9',
          variant === 'admin' ? 'text-amber-200' : 'text-amber-800 dark:text-amber-200'
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5-4.5a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  );
}

export type MaintenanceScreenProps = {
  className?: string;
  /**
   * `admin` = transparent overlay; keeps the host app’s global background (e.g. admin starfield).
   * `default` = full light/dark surface for the public web app.
   */
  variant?: 'default' | 'admin';
  /** Called when user taps “Try again” (default: full reload). */
  onRetry?: () => void;
};

export function MaintenanceScreen({ className, variant = 'default', onRetry }: MaintenanceScreenProps) {
  const [loading, setLoading] = React.useState(false);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    setLoading(true);
    window.location.reload();
  };

  const isAdmin = variant === 'admin';

  return (
    <div
      className={cn(
        'relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-10',
        isAdmin
          ? 'bg-transparent'
          : 'bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/90 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900',
        className
      )}
    >
      {!isAdmin && (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.08),transparent)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-300/40 to-transparent dark:via-slate-600/30"
            aria-hidden
          />
        </>
      )}

      <Card
        className={cn(
          'relative z-[1] w-full max-w-lg rounded-2xl backdrop-blur-md',
          isAdmin
            ? 'border border-purple-500/25 bg-slate-900/80 shadow-2xl shadow-purple-950/50 ring-1 ring-white/5'
            : 'border border-slate-200/80 bg-card/95 shadow-2xl shadow-slate-200/40 dark:border-slate-700/80 dark:shadow-black/40'
        )}
      >
        <CardHeader className="space-y-5 pb-2 pt-8 text-center sm:pt-10">
          <MaintenanceIllustration variant={variant} />
          <div className="space-y-2">
            <p
              className={cn(
                'text-[11px] font-semibold uppercase tracking-[0.2em]',
                isAdmin ? 'text-amber-300/95' : 'text-amber-700/90 dark:text-amber-400/90'
              )}
            >
              {MAINTENANCE_MESSAGES.eyebrow}
            </p>
            <CardTitle
              className={cn(
                'text-balance text-2xl font-semibold tracking-tight sm:text-3xl',
                isAdmin ? 'text-slate-50' : 'text-foreground'
              )}
            >
              {MAINTENANCE_MESSAGES.title}
            </CardTitle>
            <CardDescription
              className={cn(
                'text-base leading-relaxed sm:text-[1.05rem]',
                isAdmin ? 'text-slate-300' : 'text-muted-foreground'
              )}
            >
              {MAINTENANCE_MESSAGES.lead}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-2 pt-0 sm:px-8">
          <div
            className={cn(
              'rounded-xl border border-dashed px-4 py-3.5 text-center',
              isAdmin
                ? 'border-purple-400/25 bg-slate-800/40'
                : 'border-slate-200/90 bg-muted/40 dark:border-slate-700/80 dark:bg-muted/25'
            )}
          >
            <p
              className={cn(
                'text-sm leading-relaxed',
                isAdmin ? 'text-slate-400' : 'text-muted-foreground'
              )}
            >
              {MAINTENANCE_MESSAGES.hint}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 px-6 pb-8 pt-4 sm:px-8">
          <LoadingButton
            type="button"
            color="warning"
            className="h-11 w-full text-base font-medium shadow-md sm:min-w-[200px]"
            loading={loading}
            loadingText="Checking…"
            onClick={handleRetry}
          >
            Try again
          </LoadingButton>
          <p
            className={cn(
              'text-center text-xs',
              isAdmin ? 'text-slate-500' : 'text-muted-foreground/80'
            )}
          >
            If the problem continues, check your connection or try again later.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
