// File: /app/stock/bundles/edit/[id]/components/RollInfoCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import InfoBox from './InfoBox';
import Loading from "@/components/layouts/loading";
import { RollData } from '../types/bundleTypes';

interface RollInfoCardProps {
    isLoading: boolean;
    rollData: RollData | null;
    selectedBarcode: string;
}

const RollInfoCard: React.FC<RollInfoCardProps> = ({ isLoading, rollData, selectedBarcode }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loading />
            </div>
        );
    }

    if (!rollData && selectedBarcode) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p>No data available for the selected barcode</p>
            </div>
        );
    }

    if (!rollData) {
        return null;
    }

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-blue-600 flex items-center">
                    <Info className="mr-2 h-5 w-5" />
                    Roll Information
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoBox label="Bag Type" value={rollData.bag_type} />
                <InfoBox label="Number of Bags" value={rollData.no_of_bags} />
                <InfoBox label="Slitting Wastage" value={rollData.slitting_wastage} />
                <InfoBox label="Printing Wastage" value={rollData.print_wastage} />
                <InfoBox label="Cutting Wastage" value={rollData.cutting_wastage} />
            </CardContent>
        </Card>
    );
};

export default RollInfoCard;