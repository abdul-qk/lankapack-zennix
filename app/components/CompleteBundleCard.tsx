// File: /app/stock/bundles/edit/[id]/components/CompleteBundleCard.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Barcode, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import { CompleteItem, RollData } from '../types/bundleTypes';

const ReactBarcode = dynamic(() => import('react-barcode'), { ssr: false });

interface CompleteBundleCardProps {
    bundleId: string;
    rollData: RollData;
    completeItems: CompleteItem[];
    onAddItem: (item: CompleteItem) => void;
    onDeleteItem: (itemId: number) => void;
}

const CompleteBundleCard: React.FC<CompleteBundleCardProps> = ({
    bundleId,
    rollData,
    completeItems,
    onAddItem,
    onDeleteItem
}) => {
    const [bundleWeight, setBundleWeight] = useState<string>("");
    const [noOfBags, setNoOfBags] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const { toast } = useToast();

    const handleDeleteItem = async (id: number) => {
        try {
            const response = await fetch(`/api/stock/bundle/complete/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Item deleted successfully",
                });

                // Update parent component state
                onDeleteItem(id);
            } else {
                const result = await response.json();
                throw new Error(result.message || "Failed to delete item");
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            toast({
                title: "Error",
                description: String(error),
                variant: "destructive",
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!bundleWeight || !noOfBags) {
            toast({
                title: "Missing information",
                description: "Please enter both Bundle Weight and No of Bags",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await fetch('/api/stock/bundle/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bundle_type: rollData.bag_type,
                    complete_item_weight: bundleWeight,
                    complete_item_bags: noOfBags,
                    complete_item_info: bundleId,
                    user_id: 1 // Default user ID
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Bundle item added successfully",
                });

                // Add the new item to the existing items via parent component
                if (result.item) {
                    onAddItem(result.item);
                }

                // Reset form
                setBundleWeight("");
                setNoOfBags("");
            } else {
                throw new Error(result.message || "Failed to add bundle item");
            }
        } catch (error) {
            console.error("Error adding bundle item:", error);
            toast({
                title: "Error",
                description: String(error),
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="shadow-md mt-6">
            <CardHeader className="bg-slate-800 text-white">
                <CardTitle className="text-lg font-semibold">
                    Complete Bundle
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <Label htmlFor="bundle-weight">Bundle Weight</Label>
                            <Input
                                id="bundle-weight"
                                placeholder="Bundle Weight"
                                className="mt-1"
                                value={bundleWeight}
                                onChange={(e) => setBundleWeight(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="no-of-bags">No of Bags</Label>
                            <Input
                                id="no-of-bags"
                                placeholder="No of Bags"
                                className="mt-1"
                                value={noOfBags}
                                onChange={(e) => setNoOfBags(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Adding..." : "Add"}
                    </Button>
                </form>

                {completeItems.length > 0 ? (
                    <div className="mt-6 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">#</TableHead>
                                    <TableHead>Weight</TableHead>
                                    <TableHead>No of Bags</TableHead>
                                    <TableHead>Barcode</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {completeItems.map((item) => (
                                    <TableRow key={item.complete_item_id}>
                                        <TableCell className="font-medium">{item.complete_item_id}</TableCell>
                                        <TableCell>{item.complete_item_weight}</TableCell>
                                        <TableCell>{item.complete_item_bags}</TableCell>
                                        <TableCell>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <Barcode className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Bundle Barcode</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="flex justify-center my-4">
                                                        <ReactBarcode value={item.complete_item_barcode} />
                                                    </div>
                                                    <div className="text-center mt-2 text-sm text-gray-600">
                                                        {item.complete_item_barcode}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                onClick={() => handleDeleteItem(item.complete_item_id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>No items added yet</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CompleteBundleCard;