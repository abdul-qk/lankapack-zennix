// File: /app/stock/bundles/edit/[id]/types.ts

export interface BarcodeOption {
  cutting_roll_id: number;
  cutting_barcode: string;
}

export interface RollData {
  no_of_bags: number;
  bag_type: string;
  slitting_wastage: string;
  print_wastage: string;
  cutting_wastage: string;
}

export interface CompleteItem {
  complete_item_id: number;
  bundle_type: string;
  complete_item_weight: string;
  complete_item_bags: string;
  complete_item_barcode: string;
  complete_item_date: string;
}

export interface NonCompleteItem {
  non_complete_id: number;
  non_complete_weight: string;
  non_complete_bags: string;
  non_complete_barcode: string;
}

export interface BundleData {
  bundle_info_id: number;
  bundle_barcode: string;
  bundle_type: string;
  bundle_info_weight: string;
  bundle_info_bags: string;
  bundle_info_average: string;
  bundle_info_wastage_weight: string;
  bundle_info_wastage_bags: string;
  bundle_qty: number;
  bundle_slitt_wastage: string;
  bundle_print_wastage: string;
  bundle_cutting_wastage: string;
  bundle_date?: string;
  bundle_info_status: number;
}

export interface TotalsData {
  totalWeight: number;
  totalBags: number;
  completeWeight: number;
  completeBags: number;
  nonCompleteWeight: number;
  nonCompleteBags: number;
}
