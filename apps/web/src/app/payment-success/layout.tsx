/**
 * GetPay Step 05: "After 3DS Page - Add Script to Success and Failure Page"
 * When GetPay redirects here after OTP (Cardinal challenge), we may be in an iframe.
 * Opening the same URL in a new tab ensures the success page loads and verify can run
 * even when the browser blocks top-frame redirect (blocked:other). Then we try to
 * redirect the top window as well.
 */
const GETPAY_AFTER_3DS_SCRIPT = `
if (window.top !== window.self) {
  var url = window.self.location.href;
  window.open(url, '_blank');
  try { window.top.location = url; } catch (e) {}
}
`;

export default function PaymentSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: GETPAY_AFTER_3DS_SCRIPT }} />
      {children}
    </>
  );
}
