type BackendSessionPolicyInput = {
  supabaseAccessToken: string | null | undefined;
  hasStoredBackendRefreshToken: boolean;
};

/**
 * A backend token is tied to the Supabase user who obtained it. Always renew
 * it when a current Supabase access token is available; a stored refresh token
 * may belong to a different user from an earlier browser session.
 */
export function shouldExchangeBackendSession({
  supabaseAccessToken,
}: BackendSessionPolicyInput): boolean {
  return Boolean(supabaseAccessToken);
}
