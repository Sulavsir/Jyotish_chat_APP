
export function isSmsSendEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'production' || process.env.FORCE_SMS_SEND === 'true'
  );
}


export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}


export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
