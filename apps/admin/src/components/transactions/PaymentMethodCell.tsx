import { getPaymentMethodLabel } from '@/constants';

interface PaymentMethodCellProps {
  paymentMethod?: string | null;
}

export function PaymentMethodCell({ paymentMethod }: PaymentMethodCellProps) {
  return <span className="text-slate-200 text-sm">{getPaymentMethodLabel(paymentMethod)}</span>;
}
