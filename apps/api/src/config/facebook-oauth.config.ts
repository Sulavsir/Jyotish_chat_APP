import { z } from 'zod';

const facebookOAuthEnvSchema = z.object({
  FACEBOOK_APP_ID: z.string().min(1, 'FACEBOOK_APP_ID is required'),
  FACEBOOK_APP_SECRET: z.string().min(1, 'FACEBOOK_APP_SECRET is required'),
  FACEBOOK_REDIRECT_URI: z.string().url('FACEBOOK_REDIRECT_URI must be a valid URL'),
});

export type FacebookOAuthEnv = z.infer<typeof facebookOAuthEnvSchema>;

let _config: FacebookOAuthEnv | null = null;

export function getFacebookOAuthConfig(): FacebookOAuthEnv {
  if (_config) return _config;

  const result = facebookOAuthEnvSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    const messages = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(', ')}`)
      .join('\n');
    throw new Error(`Facebook OAuth configuration error:\n${messages}`);
  }

  _config = result.data;
  return _config;
}
