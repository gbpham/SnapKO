import {
  buildTransferRouteLabel,
  canSubmitChainTransfer,
  selectDefaultDestination,
} from "../features/transfers/chainTransferState";

import { readFileSync } from "node:fs";
import { join } from "node:path";
const areas = [
  { id: "hub", name: "Kho tổng", type: "STORAGE" as const, branchName: "Kho trung tâm" },
  { id: "a-bar", name: "Bar", type: "SERVICE" as const, branchName: "Quán A" },
];

describe("Chain transfer selection", () => {
  it("requires different source and destination with at least one item", () => {
    expect(canSubmitChainTransfer("hub", "hub", 1)).toBe(false);
    expect(canSubmitChainTransfer("hub", "a-bar", 0)).toBe(false);
    expect(canSubmitChainTransfer("hub", "a-bar", 1)).toBe(true);
  });

  it("labels areas with outlet context and defaults away from source", () => {
    expect(buildTransferRouteLabel(areas[0])).toBe("Kho trung tâm · Kho tổng");
    expect(selectDefaultDestination(areas, "hub")?.id).toBe("a-bar");
  });
});

  it("uses safe-area headers and creates a real pending transfer", () => {
    const root = join(__dirname, "..");
    const pendingScreen = readFileSync(
      join(root, "screens/PendingTransfersScreen.tsx"),
      "utf8",
    );
    const transferScreen = readFileSync(
      join(root, "screens/ChainTransferScreen.tsx"),
      "utf8",
    );
    const dashboard = readFileSync(
      join(root, "screens/DashboardScreen.tsx"),
      "utf8",
    );

    expect(pendingScreen).toContain("useSafeAreaInsets");
    expect(transferScreen).toContain("useSafeAreaInsets");
    expect(transferScreen).toContain('api.post("/inventory/transfer"');
    expect(dashboard).toContain('"Chuyển kho / quán"');
  });
