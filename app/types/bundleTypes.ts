// File: /app/stock/bundles/edit/[id]/types.ts

export interface BarcodeOption {
  cutting_roll_id: number;
  cutting_barcode: string;
  roll_id?: number;
  barcode?: string;
  source?: "cutting" | "sheeting";
  sheeting_roll_id?: number;
  sheeting_barcode?: string;
}

export interface RollData {
  no_of_bags: number;
  bag_type: string;
  slitting_wastage: string;
  print_wastage: string;
  cutting_wastage: string;
  sheeting_wastage?: string;
  source?: "cutting" | "sheeting";
  roll_id?: number;
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
  bundle_type: string;
  non_complete_weight: string;
  non_complete_bags: string;
  non_complete_barcode: string;
}

export interface BundleData {
  bundle_info_id: number;
  bundle_barcode: string | number | null;
  sheeting_roll_id?: number | null;
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
  bundle_sheeting_wastage?: string;
  bundle_date?: string;
  bundle_info_status: number;
  cutting_roll?: {
    cutting_roll_id: number;
    cutting_barcode: string | null;
  } | null;
  sheeting_roll?: {
    sheeting_roll_id: number;
    sheeting_barcode: string | null;
  } | null;
}

export interface TotalsData {
  totalWeight: number;
  totalBags: number;
  completeWeight: number;
  completeBags: number;
  nonCompleteWeight: number;
  nonCompleteBags: number;
}
