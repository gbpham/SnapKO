import assert from "node:assert/strict";
import test from "node:test";
import { shouldExchangeBackendSession } from "./backendSessionPolicy";

test("exchanges the current Supabase session even when an older backend refresh token exists", () => {
  const shouldExchange = shouldExchangeBackendSession({
    supabaseAccessToken: "owner-session-token",
    hasStoredBackendRefreshToken: true,
  });

  assert.equal(shouldExchange, true);
});

test("does not exchange when Supabase has no access token", () => {
  const shouldExchange = shouldExchangeBackendSession({
    supabaseAccessToken: null,
    hasStoredBackendRefreshToken: true,
  });

  assert.equal(shouldExchange, false);
});
