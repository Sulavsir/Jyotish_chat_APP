import { z } from 'zod';

const appleOAuthEnvSchema = z.object({
  APPLE_CLIENT_IDS: z.string().min(1, 'APPLE_CLIENT_IDS is required (comma-separated client IDs)'),
});

export type AppleOAuthEnv = z.infer<typeof appleOAuthEnvSchema>;

let _config: AppleOAuthEnv | null = null;

export function getAppleOAuthConfig(): AppleOAuthEnv {
  if (_config) return _config;

  const result = appleOAuthEnvSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    const messages = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(', ')}`)
      .join('\n');
    throw new Error(`Apple Sign In configuration error:\n${messages}`);
  }

  _config = result.data;
  return _config;
}

export function getAppleAllowedAudiences(): string[] {
  const raw = getAppleOAuthConfig().APPLE_CLIENT_IDS;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
