import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const desktopRoot = join(__dirname, "../..");
const mainSource = readFileSync(join(desktopRoot, "src/main/index.ts"), "utf8");
const preloadSource = readFileSync(join(desktopRoot, "src/preload/index.ts"), "utf8");
const useInventorySource = readFileSync(
  join(desktopRoot, "src/renderer/hooks/useInventory.ts"),
  "utf8",
);
const recipesSource = readFileSync(
  join(desktopRoot, "src/renderer/pages/Recipes.tsx"),
  "utf8",
);

test("manual sync broadcasts completion to renderer refresh listeners", () => {
  assert.match(mainSource, /webContents\.send\("sync:completed"/);
  assert.match(preloadSource, /onSyncCompleted/);
  assert.match(preloadSource, /ipcRenderer\.on\("sync:completed"/);
});

test("inventory dashboard and recipes reload after sync completes", () => {
  assert.match(useInventorySource, /onSyncCompleted\?\.\(\(\) =>/);
  assert.match(recipesSource, /onSyncCompleted\?\.\(\(\) =>/);
});
