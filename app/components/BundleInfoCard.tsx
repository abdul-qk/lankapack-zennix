
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
    return (
        <Card className="shadow-md mb-6">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-600">
                    Bundle Information
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <Label htmlFor="barcode-select" className="mb-2 block">Cutting Roll Barcode</Label>
                    <Select disabled value={selectedBarcode} onValueChange={onBarcodeChange}>
                        <SelectTrigger id="barcode-select" className="w-full">
                            <SelectValue placeholder="Select a barcode" />
                        </SelectTrigger>
                        <SelectContent>
                            {barcodeOptions.length > 0 ? (
                                barcodeOptions.map((option) => (
                                    <SelectItem key={option.cutting_roll_id} value={option.cutting_barcode}>
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
                    <InfoBox label="Bundle Type" value={bundleData.bundle_type} />
                    <InfoBox label="Number of Bags" value={bundleData.bundle_info_bags} />
                    {rollData && (
                        <>
                            <InfoBox label="Printing Wastage" value={rollData.print_wastage} />
                            <InfoBox label="Slitting Wastage" value={rollData.slitting_wastage} />
                            <InfoBox label="Cutting Wastage" value={rollData.cutting_wastage} />
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default BundleInfoCard;