'use client';

/**
 * Icons for payment method selector: GetPay (card), Fonepay (card), Fonepay (QR).
 * Styled to resemble the respective payment providers.
 */

interface IconProps {
  className?: string;
  size?: number;
}

/** GetPay – card / digital wallet style (horizontal card with stripe) */
export function GetPayIcon({ className = 'text-purple-600', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="2"
        y="11"
        width="20"
        height="3"
        rx="0.5"
        fill="currentColor"
        opacity="0.4"
      />
    </svg>
  );
}

/** Fonepay (Card) – phone / card reader device outline */
export function FonepayCardIcon({ className = 'text-amber-600', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect
        x="5"
        y="2"
        width="14"
        height="20"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="8"
        y="5"
        width="8"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

/** Fonepay (QR) – QR code grid pattern */
export function FonepayQRIcon({ className = 'text-green-600', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Top-left block */}
      <rect x="2" y="2" width="6" height="6" rx="0.5" fill="currentColor" />
      <rect x="4" y="4" width="2" height="2" fill="white" />
      {/* Top-right block */}
      <rect x="16" y="2" width="6" height="6" rx="0.5" fill="currentColor" />
      <rect x="18" y="4" width="2" height="2" fill="white" />
      {/* Bottom-left block */}
      <rect x="2" y="16" width="6" height="6" rx="0.5" fill="currentColor" />
      <rect x="4" y="18" width="2" height="2" fill="white" />
      {/* Bottom-right pattern (finder + modules) */}
      <rect x="16" y="16" width="6" height="6" rx="0.5" fill="currentColor" />
      <rect x="18" y="18" width="2" height="2" fill="white" />
      <rect x="12" y="12" width="2" height="2" fill="currentColor" />
      <rect x="12" y="16" width="2" height="2" fill="currentColor" />
      <rect x="16" y="12" width="2" height="2" fill="currentColor" />
    </svg>
  );
}
