/**
 * GetPay Step 05: After 3DS - script on failure page.
 * When in iframe, open fail URL in new tab (same as success) then try top redirect.
 */
const GETPAY_AFTER_3DS_SCRIPT = `
if (window.top !== window.self) {
  var url = window.self.location.href;
  window.open(url, '_blank');
  try { window.top.location = url; } catch (e) {}
}
`;

export default function PaymentFailLayout({
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
