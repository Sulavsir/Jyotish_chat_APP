'use client';

import { LoadingScreenWithBackground } from '@/components/ui';
import { useOAuthProfileComplete } from '@/hooks/use-oauth-profile-complete';

export default function FacebookCallbackPage() {
  const { isLoading } = useOAuthProfileComplete({
    provider: 'facebook',
    successMessage: 'Signed in with Facebook successfully',
  });

  return <LoadingScreenWithBackground message={isLoading ? 'Completing sign in...' : 'Redirecting...'} />;
}
