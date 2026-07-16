type LogoutEverywhereInput = {
  logoutBackend: () => Promise<void>;
  signOutSupabase: () => Promise<{ error: { message: string } | null }>;
};

/**
 * Keeps browser authentication stores in sync. A backend failure must not
 * prevent the Supabase session from being ended in the browser.
 */
export async function logoutEverywhere({
  logoutBackend,
  signOutSupabase,
}: LogoutEverywhereInput): Promise<{ error: { message: string } | null }> {
  try {
    await logoutBackend();
  } catch (error) {
    console.warn("Backend logout failed; continuing Supabase sign-out.", error);
  }

  return signOutSupabase();
}
