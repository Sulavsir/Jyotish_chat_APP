import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transactions History',
  description: 'View your payment history, admin adjustments, and balance usage.',
};

export default function TransactionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
