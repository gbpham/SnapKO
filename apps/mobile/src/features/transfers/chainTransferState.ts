export type ChainTransferArea = {
  id: string;
  name: string;
  type: "STORAGE" | "SERVICE";
  branchName?: string | null;
};

export function buildTransferRouteLabel(area: ChainTransferArea): string {
  return area.branchName ? `${area.branchName} · ${area.name}` : area.name;
}

export function selectDefaultDestination(
  areas: ChainTransferArea[],
  sourceAreaId: string | null,
): ChainTransferArea | null {
  return areas.find((area) => area.id !== sourceAreaId) ?? null;
}

export function canSubmitChainTransfer(
  sourceAreaId: string | null,
  destinationAreaId: string | null,
  itemCount: number,
): boolean {
  return Boolean(
    sourceAreaId &&
      destinationAreaId &&
      sourceAreaId !== destinationAreaId &&
      itemCount > 0,
  );
}
