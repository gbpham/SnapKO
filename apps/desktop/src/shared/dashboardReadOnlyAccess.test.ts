import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const desktopRoot = join(__dirname, "../..");
const dashboardSource = readFileSync(
  join(desktopRoot, "src/renderer/pages/Dashboard.tsx"),
  "utf8",
);
const settingsSource = readFileSync(
  join(desktopRoot, "src/renderer/pages/SettingsPage.tsx"),
  "utf8",
);

test("read-only owners can still open ingredient and recipe workspaces", () => {
  assert.doesNotMatch(
    dashboardSource,
    /activeTab === "ingredients" && isOwner && !readOnly/,
  );
  assert.doesNotMatch(
    dashboardSource,
    /activeTab === "recipes" && isOwner && !readOnly/,
  );
});

test("upgrade actions open the live SnapKO pricing page", () => {
  assert.match(dashboardSource, /https:\/\/snapko\.io\.vn\/pricing/);
  assert.match(settingsSource, /https:\/\/snapko\.io\.vn\/pricing/);
  assert.doesNotMatch(dashboardSource, /app\.snapko\.vn\/pricing/);
  assert.doesNotMatch(settingsSource, /app\.snapko\.vn\/pricing/);
});
