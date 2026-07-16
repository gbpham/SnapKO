# SnapKO Unified Chain / Roles / Mobile Handoff

Updated: 2026-06-15

This is the compact context for the Chain, subscription, role-scope, desktop,
web, and mobile consolidation work. Read this first before continuing related
work. Do not put secrets, tokens, database URLs, service-role keys, or payment
credentials in `.claude`.

## Architecture

- Backend (`BE-SnapKO`) is the only source of truth for subscription state,
  operational state, role permissions, branch scope, PayOS activation, and
  Sales-before-Bar enforcement.
- Web (`SnapKO/apps/web-landing`) owns purchase, renewal, outlet setup,
  outlet increase, and outlet reduction flows.
- Desktop (`SnapKO/apps/desktop`) owns Owner/Manager management and reporting.
- Mobile (`SnapKO/apps/mobile`) owns daily operations only: import, sales,
  stock count, variance, transfers, and rebaseline.
- Mobile has one runtime entry: `apps/mobile/index.ts -> apps/mobile/App.tsx`.
  `apps/mobile/src/app/**` was deleted and `expo-router` was removed from the
  mobile app config/package as a direct dependency.

## Operational States

Business operational states:

- `ACTIVE`
- `READ_ONLY_EXPIRED`
- `WAREHOUSE_REBASELINE_REQUIRED`

Rules:

- FREE/SIMPLE remains writable.
- Expired paid plans (`PRO`, `STANDARD`, `CHAIN`) are read-only.
- Early renewal extends the current expiry and stays `ACTIVE`.
- Late renewal sets `WAREHOUSE_REBASELINE_REQUIRED`.
- Late-renewal rebaseline is a single full Warehouse/Kho Tong count through
  `POST /sync/rebaseline`; `/sync/push` still accepts that compatible payload.
- After rebaseline succeeds, operational state returns to `ACTIVE`.
- After rebaseline, STANDARD and CHAIN still require Sales before Bar stock
  count so shrinkage/loss math remains valid.

Key files:

- `BE-SnapKO/prisma/schema.prisma`
- `BE-SnapKO/src/shared/services/entitlements.service.ts`
- `BE-SnapKO/src/shared/interceptor/chain-write.interceptor.ts`
- `BE-SnapKO/src/shared/cron/chain-lifecycle.cron.ts`
- `BE-SnapKO/src/routes/sync/sync.service.ts`
- `SnapKO/supabase/migrations/20260615000000_operational_state_and_chain_checkout.sql`

## Backend API Contracts

`POST /payments/create-link` supports:

- `purchaseMode: "SUBSCRIPTION" | "OUTLET_INCREASE"`
- `chainConfiguration.outlets: { id?, name, code }[]`

Payment rules:

- PayOS webhook success is the only normal path that applies subscription or
  outlet configuration.
- Failed/cancelled payment does not mutate live branch configuration.
- `OUTLET_INCREASE` is prorated and applied immediately.
- Outlet decrease is paid/scheduled but applied only at term end.
- Kho Tong/Central Warehouse is created automatically, free, and excluded from
  `outletCount`.
- Webhook/manual activation paths are idempotent.

Profile/report contracts:

- `GET /profiles/me` returns `operationalState`, `readOnly`, and branch
  memberships.
- Report APIs accept optional `branchId`.
- Owner defaults to whole-chain aggregate and may filter by branch.
- Manager is always forced to the assigned branch by backend.
- Staff cannot access reports.

Standardized errors:

- `SUBSCRIPTION_READ_ONLY`
- `BRANCH_SCOPE_FORBIDDEN`
- `SALES_REQUIRED_BEFORE_BAR`

## Sales Before Bar

Mobile still has the local guard:

- `SnapKO/apps/mobile/src/features/inventory/services/salesPrerequisite.service.ts`

Backend independently enforces the rule:

- `BE-SnapKO/src/routes/sync/sync.service.ts`

For STANDARD and CHAIN, a Bar stock snapshot is rejected with
`SALES_REQUIRED_BEFORE_BAR` unless the same branch/area has a Sales log newer
than the latest Bar stock snapshot. This includes the first Bar count.

## Branches And Roles

- Owner: all branches, aggregate reports, branch filter, ingredients, recipes,
  model settings, and staff management.
- Manager: exactly one branch membership; can view branch dashboard, inventory,
  reports, and manage Staff in that branch. Business master data is read-only.
- Staff: mobile operations only; desktop login is blocked.
- Invite codes include `branchId`.
- Manager assignment is constrained to one branch.
- Deleting/disabling Staff sets profile status to `INACTIVE` and removes branch
  memberships without deleting historical logs.
- Owner receives operational alerts for all branches.
- Manager receives low-stock/shrinkage alerts only for the assigned branch.
- Staff does not receive management alerts.

Key files:

- `BE-SnapKO/src/shared/services/branch-access.service.ts`
- `BE-SnapKO/src/routes/branches/`
- `BE-SnapKO/src/routes/profiles/`
- `BE-SnapKO/src/routes/reports/`
- `BE-SnapKO/src/shared/services/push-notification.service.ts`

## Web

- Pricing routes Chain purchase/renewal to `/chain/setup`.
- `/chain/setup` reloads saved branch names/codes, validates exact paid outlet
  count, enforces unique codes, and sends `chainConfiguration` to backend.
- Dashboard exposes separate Owner flows:
  - buy/renew subscription
  - add outlet mid-cycle through prorated `OUTLET_INCREASE`
  - reduce outlet for the next cycle
- Web remains a purchase/setup surface, not the mobile operations surface.

Key files:

- `SnapKO/apps/web-landing/app/pricing/page.tsx`
- `SnapKO/apps/web-landing/app/chain/setup/page.tsx`
- `SnapKO/apps/web-landing/app/dashboard/page.tsx`

## Desktop

- Staff is blocked from desktop after login.
- Owner desktop:
  - whole-chain dashboard
  - branch filter
  - ingredients
  - recipes
  - model/settings
  - all-branch staff management
- Manager desktop:
  - assigned-branch dashboard
  - inventory
  - branch reports
  - Staff management for own branch
  - no Owner-only master data writes
- Read-only subscription state disables operational writes and sync writes.

Key files:

- `SnapKO/apps/desktop/src/renderer/main.tsx`
- `SnapKO/apps/desktop/src/renderer/hooks/AuthContext.tsx`
- `SnapKO/apps/desktop/src/renderer/pages/ReportsPage.tsx`
- `SnapKO/apps/desktop/src/main/sync.ts`

## Mobile

- Keep `apps/mobile/index.ts -> apps/mobile/App.tsx` as the only entry.
- Do not reintroduce bottom tabs or `expo-router`.
- `InventoryCaptureScreen` is the canonical screen for import, Sales, stock
  count, Bar/Warehouse flow, and shrinkage calculation.
- `PendingTransfersScreen` is connected directly in `App.tsx`.
- `LowStockModal` now uses callback navigation instead of `router.push`.
- Owner can select branch/area through the current App flow where available.
- Manager/Staff are locked to assigned branch data from backend.
- Chain setup, storage-area configuration, and deep reporting belong to
  web/desktop, not mobile.
- Expired accounts show read-only state.
- `WAREHOUSE_REBASELINE_REQUIRED` allows only Warehouse full-count flow until
  rebaseline completes.

Deleted/removed:

- `SnapKO/apps/mobile/src/app/**`
- route wrappers and camera placeholders under the old Expo Router tree
- direct `expo-router` config/package use in mobile

Note: `pnpm-lock.yaml` can still contain transitive/optional peer metadata for
`expo-router` through Expo packages until dependencies are fully refreshed.
Static app/config imports are gone.

Key files:

- `SnapKO/apps/mobile/App.tsx`
- `SnapKO/apps/mobile/index.ts`
- `SnapKO/apps/mobile/app.json`
- `SnapKO/apps/mobile/package.json`
- `SnapKO/apps/mobile/src/screens/InventoryCaptureScreen.tsx`
- `SnapKO/apps/mobile/src/screens/PendingTransfersScreen.tsx`
- `SnapKO/apps/mobile/src/contexts/AuthContext.tsx`

## Verification Completed

Backend:

```powershell
pnpm exec prisma validate
pnpm exec jest --runInBand        # 26 suites, 141 tests
pnpm run build
```

Web:

```powershell
pnpm --filter web-landing build
```

Desktop:

```powershell
pnpm --filter desktop typecheck
pnpm --filter desktop build
```

Mobile:

```powershell
pnpm --filter mobile exec tsc --noEmit
pnpm --filter mobile exec jest --runInBand   # 20 suites, 106 tests
pnpm --filter mobile exec expo export --platform android --output-dir dist-export
```

Static checks:

- `apps/mobile/src/app` is absent.
- `apps/mobile/app.json`, `apps/mobile/package.json`, `apps/mobile/index.ts`,
  `apps/mobile/App.tsx`, and `apps/mobile/src/**` have no direct
  `expo-router` import/config.
- Android export uses `apps/mobile/index.ts` and no longer reports an Expo
  Router root.
- `git diff --check` passed for `BE-SnapKO` and `SnapKO` aside from line-ending
  warnings.

## External Work Not Done In This Workspace

- Remote database migration still needs to be applied where the running backend
  is deployed.
- Emulator smoke testing for seeded FREE, STANDARD, CHAIN active, expired, and
  late-renewal accounts was not completed because those seeded states were not
  available locally.
- Production runtime environment variables and PayOS credentials are not stored
  in `.claude` and must stay out of the repo.

## Worktree Safety

- Both `SnapKO` and `BE-SnapKO` already contain many uncommitted changes.
- Do not run `git reset --hard`, `git checkout --`, or broad cleanup commands.
- Do not delete legacy hooks/components/services unless import graph and feature
  equivalence have been checked.
- Do not remove `syncQueue` just because it looks old; verify active imports and
  offline sync behavior first.
- Treat `.claude/`, `.runtime/`, `.backups/`, and env files as local context
  unless the user explicitly asks to commit or move them.
