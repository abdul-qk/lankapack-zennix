
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InfoBox from './InfoBox';
import { BarcodeOption, BundleData, RollData } from '../types/bundleTypes';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BundleInfoCardProps {
    bundleData: BundleData;
    rollData: RollData | null;
    selectedBarcode: string;
    barcodeOptions: BarcodeOption[];
    onBarcodeChange: (value: string) => void;
}

const BundleInfoCard: React.FC<BundleInfoCardProps> = ({
    bundleData,
    rollData,
    selectedBarcode,
    barcodeOptions,
    onBarcodeChange }) => {
    const isSheeting = rollData?.source === "sheeting" || !!bundleData.sheeting_roll_id;
    const processWastageLabel = isSheeting ? "Sheeting Wastage" : "Cutting Wastage";
    const processWastageValue = isSheeting
        ? (rollData?.sheeting_wastage || bundleData.bundle_sheeting_wastage || "0")
        : (rollData?.cutting_wastage || "0");

    // Ensure the currently selected barcode appears even if not in the options list
    const options = React.useMemo(() => {
        if (!selectedBarcode) return barcodeOptions;
        const exists = barcodeOptions.some(
            (o) => o.cutting_barcode === selectedBarcode || o.barcode === selectedBarcode
        );
        if (exists) return barcodeOptions;
        return [
            {
                cutting_roll_id: -1,
                cutting_barcode: selectedBarcode,
                barcode: selectedBarcode,
            },
            ...barcodeOptions,
        ];
    }, [barcodeOptions, selectedBarcode]);

    return (
        <Card className="shadow-md mb-6">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-600">
                    Bundle Information
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <Label htmlFor="barcode-select" className="mb-2 block">Roll Barcode</Label>
                    <Select disabled value={selectedBarcode || undefined} onValueChange={onBarcodeChange}>
                        <SelectTrigger id="barcode-select" className="w-full">
                            <SelectValue placeholder="Select a barcode" />
                        </SelectTrigger>
                        <SelectContent>
                            {options.length > 0 ? (
                                options.map((option) => (
                                    <SelectItem
                                        key={`${option.source || "roll"}-${option.cutting_roll_id}-${option.cutting_barcode}`}
                                        value={option.cutting_barcode}
                                    >
                                        {option.cutting_barcode}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="no-options" disabled>
                                    No barcodes available
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoBox label="Bundle ID" value={bundleData.bundle_info_id} />
                    <InfoBox
                        label={isSheeting ? "Sheeting Type" : "Bundle Type"}
                        value={rollData?.bag_type || bundleData.bundle_type}
                    />
                    <InfoBox
                        label={isSheeting ? "Number of Sheets" : "Number of Bags"}
                        value={rollData?.no_of_bags.toString() || '0'}
                    />
                    {rollData && (
                        <>
                            <InfoBox label="Printing Wastage" value={rollData.print_wastage} />
                            <InfoBox label="Slitting Wastage" value={rollData.slitting_wastage} />
                            <InfoBox label={processWastageLabel} value={processWastageValue} />
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default BundleInfoCard;
