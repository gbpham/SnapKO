export interface ReviewableStockItem {
  quantity: number | null;
  needs_review: boolean;
}

/**
 * Full-count saves replace the current count, so an unreadable value must never
 * be allowed to silently become a real zero in the database.
 */
export function canSaveFullStockCount(
  items: ReviewableStockItem[],
  reviewRequired: boolean,
): boolean {
  return (
    !reviewRequired &&
    items.length > 0 &&
    items.every((item) => item.quantity !== null && !item.needs_review)
  );
}

export interface ConfirmedPurchaseMetadata {
  purchase_price: number;
  purchase_quantity: number;
  purchase_unit: string;
}

export function buildConfirmedPurchaseMetadata(
  quantity: number | null,
  unit: string,
  unitCost: number | null,
): ConfirmedPurchaseMetadata {
  if (
    quantity === null ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    unitCost === null ||
    !Number.isFinite(unitCost) ||
    unitCost <= 0 ||
    !unit.trim()
  ) {
    throw new Error("Thông tin giá mua chưa được xác nhận đầy đủ.");
  }

  return {
    purchase_price: quantity * unitCost,
    purchase_quantity: quantity,
    purchase_unit: unit.trim(),
  };
}
