import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        outline: 'border-2 bg-transparent',
        ghost:
          'bg-transparent border-0 shadow-none hover:bg-transparent [&]:!text-white [&]:!bg-none [&]:!bg-transparent [&]:!shadow-none',
        link: 'underline-offset-4 hover:underline bg-transparent border-0 shadow-none px-0',
      },
      color: {
        primary:
          'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white hover:from-purple-500 hover:via-pink-500 hover:to-red-500 shadow-[0_0_40px_rgba(220,20,60,0.6)] hover:shadow-[0_0_60px_rgba(220,20,60,0.8)]',
        secondary:
          'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 shadow-lg hover:shadow-xl',
        success:
          'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 shadow-lg hover:shadow-xl',
        danger:
          'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-lg hover:shadow-xl',
        warning:
          'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500 shadow-lg hover:shadow-xl',
        info: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 shadow-lg hover:shadow-xl',
        neutral: 'bg-gray-700 text-white hover:bg-gray-600 shadow-md hover:shadow-lg',
        none: '', // No color styling - for ghost variant
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    compoundVariants: [
      // Outline variants with colors
      {
        variant: 'outline',
        color: 'primary',
        className:
          'border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400',
      },
      {
        variant: 'outline',
        color: 'secondary',
        className: 'border-pink-500/50 text-pink-300 hover:bg-pink-500/10 hover:border-pink-400',
      },
      {
        variant: 'outline',
        color: 'success',
        className:
          'border-green-500/50 text-green-300 hover:bg-green-500/10 hover:border-green-400',
      },
      {
        variant: 'outline',
        color: 'danger',
        className: 'border-red-500/50 text-red-300 hover:bg-red-500/10 hover:border-red-400',
      },
      {
        variant: 'outline',
        color: 'warning',
        className:
          'border-orange-500/50 text-orange-300 hover:bg-orange-500/10 hover:border-orange-400',
      },
      {
        variant: 'outline',
        color: 'info',
        className: 'border-blue-500/50 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400',
      },
      {
        variant: 'outline',
        color: 'neutral',
        className: 'border-white/40 text-white hover:bg-white/10 hover:border-white/60',
      },
      // Ghost variants - completely override all background styles
      {
        variant: 'ghost',
        color: 'primary',
        className:
          'text-purple-300 hover:text-purple-200 !bg-none !from-transparent !via-transparent !to-transparent hover:!from-transparent hover:!via-transparent hover:!to-transparent',
      },
      {
        variant: 'ghost',
        color: 'secondary',
        className:
          'text-pink-300 hover:text-pink-200 !bg-none !from-transparent !via-transparent !to-transparent hover:!from-transparent hover:!via-transparent hover:!to-transparent',
      },
      {
        variant: 'ghost',
        color: 'success',
        className:
          'text-green-300 hover:text-green-200 !bg-none !from-transparent !via-transparent !to-transparent hover:!from-transparent hover:!via-transparent hover:!to-transparent',
      },
      {
        variant: 'ghost',
        color: 'danger',
        className:
          'text-red-300 hover:text-red-200 !bg-none !from-transparent !via-transparent !to-transparent hover:!from-transparent hover:!via-transparent hover:!to-transparent',
      },
      {
        variant: 'ghost',
        color: 'warning',
        className:
          'text-orange-300 hover:text-orange-200 !bg-none !from-transparent !via-transparent !to-transparent hover:!from-transparent hover:!via-transparent hover:!to-transparent',
      },
      {
        variant: 'ghost',
        color: 'info',
        className:
          'text-blue-300 hover:text-blue-200 !bg-none !from-transparent !via-transparent !to-transparent hover:!from-transparent hover:!via-transparent hover:!to-transparent',
      },
      {
        variant: 'ghost',
        color: 'neutral',
        className:
          'text-gray-300 hover:text-gray-200 !bg-none !from-transparent !via-transparent !to-transparent hover:!from-transparent hover:!via-transparent hover:!to-transparent',
      },
      {
        variant: 'ghost',
        color: 'none',
        className:
          '!bg-none !from-transparent !via-transparent !to-transparent hover:!from-transparent hover:!via-transparent hover:!to-transparent',
      },
      // Link variants with colors
      {
        variant: 'link',
        color: 'primary',
        className: 'text-purple-400 hover:text-purple-300',
      },
      {
        variant: 'link',
        color: 'secondary',
        className: 'text-pink-400 hover:text-pink-300',
      },
      {
        variant: 'link',
        color: 'success',
        className: 'text-green-400 hover:text-green-300',
      },
      {
        variant: 'link',
        color: 'danger',
        className: 'text-red-400 hover:text-red-300',
      },
      {
        variant: 'link',
        color: 'warning',
        className: 'text-orange-400 hover:text-orange-300',
      },
      {
        variant: 'link',
        color: 'info',
        className: 'text-blue-400 hover:text-blue-300',
      },
      {
        variant: 'link',
        color: 'neutral',
        className: 'text-gray-400 hover:text-gray-300',
      },
    ],
    defaultVariants: {
      variant: 'default',
      color: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, color, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, color, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
