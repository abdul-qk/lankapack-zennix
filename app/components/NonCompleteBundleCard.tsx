// File: /app/stock/bundles/edit/[id]/components/NonCompleteBundleCard.tsx

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
import { NonCompleteItem, RollData } from '../types/bundleTypes';

const ReactBarcode = dynamic(() => import('react-barcode'), { ssr: false });

interface NonCompleteBundleCardProps {
    bundleId: string;
    rollData: RollData;
    nonCompleteItems: NonCompleteItem[];
    onAddItem: (item: NonCompleteItem) => void;
    onDeleteItem: (itemId: number) => void;
}

const NonCompleteBundleCard: React.FC<NonCompleteBundleCardProps> = ({
    bundleId,
    rollData,
    nonCompleteItems,
    onAddItem,
    onDeleteItem
}) => {
    const [nonCompleteWeight, setNonCompleteWeight] = useState<string>("");
    const [nonCompleteBags, setNonCompleteBags] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const { toast } = useToast();

    const handleDeleteItem = async (id: number) => {
        try {
            const response = await fetch(`/api/stock/bundle/non-complete/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Non-complete item deleted successfully",
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

        if (!nonCompleteWeight || !nonCompleteBags) {
            toast({
                title: "Missing information",
                description: "Please enter both Bundle Weight and No of Bags",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await fetch('/api/stock/bundle/non-complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    non_complete_info: parseInt(bundleId),
                    non_complete_weight: nonCompleteWeight,
                    non_complete_bags: nonCompleteBags,
                    user_id: 1, // Default user ID
                    del_ind: 1
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Non-complete bundle item added successfully",
                });

                // Add the new item to the existing items via parent component
                if (result.item) {
                    onAddItem(result.item);
                }

                // Reset form
                setNonCompleteWeight("");
                setNonCompleteBags("");
            } else {
                throw new Error(result.message || "Failed to add non-complete bundle item");
            }
        } catch (error) {
            console.error("Error adding non-complete bundle item:", error);
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
            <CardHeader className="bg-amber-700 text-white">
                <CardTitle className="text-lg font-semibold">
                    Non-Complete Bundle
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <Label htmlFor="non-complete-weight">Bundle Weight</Label>
                            <Input
                                id="non-complete-weight"
                                placeholder="Bundle Weight"
                                className="mt-1"
                                value={nonCompleteWeight}
                                onChange={(e) => setNonCompleteWeight(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="non-complete-bags">No of Bags</Label>
                            <Input
                                id="non-complete-bags"
                                placeholder="No of Bags"
                                className="mt-1"
                                value={nonCompleteBags}
                                onChange={(e) => setNonCompleteBags(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        className="bg-amber-600 hover:bg-amber-700"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Adding..." : "Add"}
                    </Button>
                </form>

                {nonCompleteItems.length > 0 ? (
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
                                {nonCompleteItems.map((item) => (
                                    <TableRow key={item.non_complete_id}>
                                        <TableCell className="font-medium">{item.non_complete_id}</TableCell>
                                        <TableCell>{item.non_complete_weight}</TableCell>
                                        <TableCell>{item.non_complete_bags}</TableCell>
                                        <TableCell>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <Barcode className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Non-Complete Bundle Barcode</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="flex justify-center my-4">
                                                        <ReactBarcode value={item.non_complete_barcode} />
                                                    </div>
                                                    <div className="text-center mt-2 text-sm text-gray-600">
                                                        {item.non_complete_barcode}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                onClick={() => handleDeleteItem(item.non_complete_id)}
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
                        <p>No non-complete items added yet</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default NonCompleteBundleCard;