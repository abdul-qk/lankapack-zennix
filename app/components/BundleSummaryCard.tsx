// File: /app/stock/bundles/edit/[id]/components/BundleSummaryCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InfoBox from './InfoBox';
import { TotalsData } from '../types/bundleTypes';

interface BundleSummaryCardProps {
    totals: TotalsData;
    onUpdateBundle: () => Promise<void>;
    isUpdating: boolean;
    showUpdateButton: boolean;
}

const BundleSummaryCard: React.FC<BundleSummaryCardProps> = ({
    totals,
    onUpdateBundle,
    isUpdating,
    showUpdateButton
}) => {
    return (
        <>
            <Card className="shadow-md mt-6">
                <CardHeader className="bg-blue-800 text-white">
                    <CardTitle className="text-lg font-semibold">
                        Bundle Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InfoBox
                            label="Total Weight"
                            value={`${totals.totalWeight.toFixed(2)}`}
                        />
                        <InfoBox
                            label="Total Bags"
                            value={totals.totalBags}
                        />
                        <InfoBox
                            label="Average Weight per Bag"
                            value={`${totals.totalBags > 0
                                ? ((totals.totalWeight / totals.totalBags) * 1000).toFixed(2)
                                : "0.00"} g`}
                        />
                        <InfoBox
                            label="Complete Items Weight"
                            value={`${totals.completeWeight.toFixed(2)}`}
                        />
                        <InfoBox
                            label="Complete Items Bags"
                            value={totals.completeBags}
                        />
                        <InfoBox
                            label="Non-Complete Items Weight"
                            value={`${totals.nonCompleteWeight.toFixed(2)}`}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Update Bundle Button */}
            {showUpdateButton && (
                <div className="mt-6 flex justify-center">
                    <Button
                        onClick={onUpdateBundle}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
                        disabled={isUpdating}
                    >
                        {isUpdating ? "Updating..." : "Update Bundle"}
                    </Button>
                </div>
            )}
        </>
    );
};

export default BundleSummaryCard;