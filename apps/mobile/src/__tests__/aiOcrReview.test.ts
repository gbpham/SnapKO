import {
  buildConfirmedPurchaseMetadata,
  canSaveFullStockCount,
} from "../features/inventory/services/aiOcrReview";

describe("canSaveFullStockCount", () => {
  it("blocks saving when the response requires review", () => {
    expect(
      canSaveFullStockCount([{ quantity: 12, needs_review: false }], true),
    ).toBe(false);
  });

  it("blocks saving an unknown quantity instead of treating it as zero", () => {
    expect(
      canSaveFullStockCount([{ quantity: null, needs_review: true }], false),
    ).toBe(false);
  });

  it("blocks saving any row that still needs review", () => {
    expect(
      canSaveFullStockCount([{ quantity: 12, needs_review: true }], false),
    ).toBe(false);
  });

  it("accepts an explicit zero when the row is otherwise verified", () => {
    expect(
      canSaveFullStockCount([{ quantity: 0, needs_review: false }], false),
    ).toBe(true);
  });
});

describe("buildConfirmedPurchaseMetadata", () => {
  it("builds the verified fields consumed by backend costing", () => {
    expect(buildConfirmedPurchaseMetadata(12, "chai", 8_500)).toEqual({
      purchase_price: 102_000,
      purchase_quantity: 12,
      purchase_unit: "chai",
    });
  });

  it("rejects missing or non-positive purchase values", () => {
    expect(() => buildConfirmedPurchaseMetadata(null, "chai", 8_500)).toThrow();
    expect(() => buildConfirmedPurchaseMetadata(12, "", 8_500)).toThrow();
    expect(() => buildConfirmedPurchaseMetadata(12, "chai", 0)).toThrow();
  });
});
