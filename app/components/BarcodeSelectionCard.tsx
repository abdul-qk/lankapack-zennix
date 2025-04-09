// File: /app/stock/bundles/edit/[id]/components/BarcodeSelectionCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BarcodeOption } from '../types/bundleTypes';

interface BarcodeSelectionCardProps {
    selectedBarcode: string;
    barcodeOptions: BarcodeOption[];
    onBarcodeChange: (value: string) => void;
}

const BarcodeSelectionCard: React.FC<BarcodeSelectionCardProps> = ({
    selectedBarcode,
    barcodeOptions,
    onBarcodeChange
}) => {
    return (
        <Card className="shadow-md mb-6">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-600">
                    Select Cutting Roll Barcode
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <Label htmlFor="barcode-select" className="mb-2 block">Cutting Roll Barcode</Label>
                    <Select value={selectedBarcode} onValueChange={onBarcodeChange}>
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
            </CardContent>
        </Card>
    );
};

export default BarcodeSelectionCard;