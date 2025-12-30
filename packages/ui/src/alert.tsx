import * as React from 'react';
import { cn } from './utils';

// Icon components
const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const WarningIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const SuccessIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const ErrorIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const getAlertIcon = (variant: string) => {
  switch (variant) {
    case 'info':
      return <InfoIcon />;
    case 'warning':
      return <WarningIcon />;
    case 'success':
      return <SuccessIcon />;
    case 'destructive':
      return <ErrorIcon />;
    default:
      return null;
  }
};

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'destructive' | 'info' | 'warning' | 'success';
    dismissible?: boolean;
    onDismiss?: () => void;
  }
>(({ className, variant = 'default', dismissible = false, onDismiss, children, ...props }, ref) => {
  const icon = getAlertIcon(variant);

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative w-full rounded-lg border text-sm flex gap-3',
        {
          'bg-background text-foreground': variant === 'default',
          'border-red-500/50 bg-red-500/10 text-red-300': variant === 'destructive',
          'border-blue-500/50 bg-blue-500/10 text-blue-300': variant === 'info',
          'border-yellow-500/50 bg-yellow-500/10 text-yellow-300': variant === 'warning',
          'border-green-500/50 bg-green-500/10 text-green-300': variant === 'success',
        },
        dismissible ? 'pr-10 pl-4 py-3' : 'px-4 py-3',
        className
      )}
      {...props}
    >
      {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-1">{children}</div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            'absolute right-3 top-3 rounded-sm opacity-70 transition-opacity hover:opacity-100',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            {
              'text-red-300 hover:text-red-200 focus:ring-red-500': variant === 'destructive',
              'text-blue-300 hover:text-blue-200 focus:ring-blue-500': variant === 'info',
              'text-yellow-300 hover:text-yellow-200 focus:ring-yellow-500': variant === 'warning',
              'text-green-300 hover:text-green-200 focus:ring-green-500': variant === 'success',
            }
          )}
          aria-label="Close alert"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
});
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  )
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
