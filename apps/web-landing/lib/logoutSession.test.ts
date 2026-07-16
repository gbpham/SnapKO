import assert from "node:assert/strict";
import test from "node:test";
import { logoutEverywhere } from "./logoutSession";

test("clears the backend session before signing out Supabase", async () => {
  const calls: string[] = [];

  await logoutEverywhere({
    logoutBackend: async () => {
      calls.push("backend");
    },
    signOutSupabase: async () => {
      calls.push("supabase");
      return { error: null };
    },
  });

  assert.deepEqual(calls, ["backend", "supabase"]);
});

test("still signs out Supabase when backend logout is unavailable", async () => {
  let didSignOutSupabase = false;
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    await logoutEverywhere({
      logoutBackend: async () => {
        throw new Error("backend unavailable");
      },
      signOutSupabase: async () => {
        didSignOutSupabase = true;
        return { error: null };
      },
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(didSignOutSupabase, true);
});
