/**
 * Resolve unit price for a complete-item bundle type.
 * Bag bundles use hps_bag_type; sheet bundles use hps_sheet_type.
 */
export function pickBundlePrice(
  bagPrice: string | null | undefined,
  sheetPrice: string | null | undefined
): number | null {
  const fromBag = bagPrice != null && bagPrice !== "" ? parseFloat(bagPrice) : NaN;
  if (!Number.isNaN(fromBag)) {
    return fromBag;
  }

  const fromSheet =
    sheetPrice != null && sheetPrice !== "" ? parseFloat(sheetPrice) : NaN;
  if (!Number.isNaN(fromSheet)) {
    return fromSheet;
  }

  return null;
}

export type SalesItemKind = "bag" | "sheet";

/** Prefer bag type when both exist; sheets only when bag type is absent. */
export function resolveItemKind(
  hasBagType: boolean,
  hasSheetType: boolean
): SalesItemKind {
  if (hasBagType) return "bag";
  if (hasSheetType) return "sheet";
  return "bag";
}

export function getDoItemColumnLabels(itemKinds: SalesItemKind[]) {
  const allSheets =
    itemKinds.length > 0 && itemKinds.every((kind) => kind === "sheet");

  return {
    typeLabel: allSheets ? "Sheet Type" : "Bag Type",
    qtyLabel: allSheets ? "No of Sheets" : "No of Bags",
    totalQtyLabel: allSheets ? "Total Sheets" : "Total Bags",
  };
}
