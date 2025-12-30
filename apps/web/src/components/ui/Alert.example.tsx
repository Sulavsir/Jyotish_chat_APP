/**
 * Alert Component Usage Examples
 * 
 * The Alert component from @jyotish/ui supports dismissible functionality
 * that can be used anywhere in the app.
 */

'use client';

import { useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@jyotish/ui';

// ============================================
// Example 1: Basic Alert (Not Dismissible)
// ============================================
export function BasicAlertExample() {
  return (
    <Alert variant="info">
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>This is a basic alert without dismiss functionality.</AlertDescription>
    </Alert>
  );
}

// ============================================
// Example 2: Dismissible Alert
// ============================================
export function DismissibleAlertExample() {
  const [showAlert, setShowAlert] = useState(true);

  if (!showAlert) return null;

  return (
    <Alert variant="info" dismissible onDismiss={() => setShowAlert(false)}>
      <AlertTitle>Dismissible Alert</AlertTitle>
      <AlertDescription>
        Click the X button to dismiss this alert. It will disappear until the page reloads.
      </AlertDescription>
    </Alert>
  );
}

// ============================================
// Example 3: All Alert Variants
// ============================================
export function AllVariantsExample() {
  const [alerts, setAlerts] = useState({
    info: true,
    warning: true,
    success: true,
    destructive: true,
  });

  const dismissAlert = (type: keyof typeof alerts) => {
    setAlerts((prev) => ({ ...prev, [type]: false }));
  };

  return (
    <div className="space-y-4">
      {alerts.info && (
        <Alert variant="info" dismissible onDismiss={() => dismissAlert('info')}>
          <AlertTitle>ℹ️ Info Alert</AlertTitle>
          <AlertDescription>This is an informational message.</AlertDescription>
        </Alert>
      )}

      {alerts.warning && (
        <Alert variant="warning" dismissible onDismiss={() => dismissAlert('warning')}>
          <AlertTitle>⚠️ Warning Alert</AlertTitle>
          <AlertDescription>This is a warning message.</AlertDescription>
        </Alert>
      )}

      {alerts.success && (
        <Alert variant="success" dismissible onDismiss={() => dismissAlert('success')}>
          <AlertTitle>✓ Success Alert</AlertTitle>
          <AlertDescription>Operation completed successfully!</AlertDescription>
        </Alert>
      )}

      {alerts.destructive && (
        <Alert variant="destructive" dismissible onDismiss={() => dismissAlert('destructive')}>
          <AlertTitle>✕ Error Alert</AlertTitle>
          <AlertDescription>An error occurred. Please try again.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ============================================
// Example 4: Conditional Alert with LocalStorage Persistence
// ============================================
export function PersistentDismissAlertExample() {
  const ALERT_KEY = 'alert-dismissed-welcome';
  
  const [showAlert, setShowAlert] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ALERT_KEY) !== 'true';
    }
    return true;
  });

  const handleDismiss = () => {
    setShowAlert(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ALERT_KEY, 'true');
    }
  };

  if (!showAlert) return null;

  return (
    <Alert variant="success" dismissible onDismiss={handleDismiss}>
      <AlertTitle>Welcome!</AlertTitle>
      <AlertDescription>
        This alert will stay dismissed even after page reload (stored in localStorage).
      </AlertDescription>
    </Alert>
  );
}

// ============================================
// Example 5: Alert with Action Button
// ============================================
export function AlertWithActionExample() {
  const [showAlert, setShowAlert] = useState(true);

  const handleAction = () => {
    console.log('Action clicked!');
    // Perform action
  };

  if (!showAlert) return null;

  return (
    <Alert variant="warning" dismissible onDismiss={() => setShowAlert(false)}>
      <AlertTitle>Action Required</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>Your subscription is about to expire.</p>
        <button
          onClick={handleAction}
          className="underline font-medium hover:text-yellow-100 transition-colors"
        >
          Renew now
        </button>
      </AlertDescription>
    </Alert>
  );
}

// ============================================
// Example 6: Multiple Dismissible Alerts
// ============================================
export function MultipleAlertsExample() {
  const [showProfileAlert, setShowProfileAlert] = useState(true);
  const [showPasswordAlert, setShowPasswordAlert] = useState(true);
  const [showVerificationAlert, setShowVerificationAlert] = useState(true);

  return (
    <div className="space-y-4">
      {showProfileAlert && (
        <Alert variant="info" dismissible onDismiss={() => setShowProfileAlert(false)}>
          <AlertTitle>Complete Your Profile</AlertTitle>
          <AlertDescription>Please complete your profile to access all features.</AlertDescription>
        </Alert>
      )}

      {showPasswordAlert && (
        <Alert variant="warning" dismissible onDismiss={() => setShowPasswordAlert(false)}>
          <AlertTitle>Set a Password</AlertTitle>
          <AlertDescription>Set a password to enable password-based login.</AlertDescription>
        </Alert>
      )}

      {showVerificationAlert && (
        <Alert variant="success" dismissible onDismiss={() => setShowVerificationAlert(false)}>
          <AlertTitle>Email Verified</AlertTitle>
          <AlertDescription>Your email has been successfully verified!</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ============================================
// HOW TO USE IN YOUR PAGES
// ============================================
/*

1. Import the Alert components:
   import { Alert, AlertTitle, AlertDescription } from '@jyotish/ui';

2. Add state to manage visibility:
   const [showAlert, setShowAlert] = useState(true);

3. Use the Alert with dismissible prop:
   <Alert variant="info" dismissible onDismiss={() => setShowAlert(false)}>
     <AlertTitle>Title</AlertTitle>
     <AlertDescription>Message</AlertDescription>
   </Alert>

4. Conditionally render based on state:
   {showAlert && (
     <Alert ...>...</Alert>
   )}

PROPS:
- variant: 'default' | 'destructive' | 'info' | 'warning' | 'success'
- dismissible: boolean (adds X button)
- onDismiss: () => void (callback when dismissed)
- className: string (additional Tailwind classes)

BEHAVIOR:
- Default: Alert reappears on page reload
- With localStorage: Alert stays dismissed permanently
- State resets: Use local state for temporary dismissal

*/

