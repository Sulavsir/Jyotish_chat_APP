import { z } from 'zod';

const googleOAuthEnvSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  GOOGLE_REDIRECT_URI: z.string().url('GOOGLE_REDIRECT_URI must be a valid URL'),
});

export type GoogleOAuthEnv = z.infer<typeof googleOAuthEnvSchema>;

let _config: GoogleOAuthEnv | null = null;

export function getGoogleOAuthConfig(): GoogleOAuthEnv {
  if (_config) return _config;

  const result = googleOAuthEnvSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    const messages = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(', ')}`)
      .join('\n');
    throw new Error(`Google OAuth configuration error:\n${messages}`);
  }

  _config = result.data;
  return _config;
}
