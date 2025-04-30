// File: /app/stock/bundles/edit/[id]/components/CompleteBundleCard.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Barcode, Printer, Trash2 } from "lucide-react";
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

                                                    {/* Vertical layout for data */}
                                                    <div className="w-full">
                                                        <div className="grid grid-cols-2 gap-2 w-full">

                                                            <div className="font-semibold bg-gray-100 p-2 rounded-l">Bundle ID</div>
                                                            <div className="p-2 border rounded-r">{item.complete_item_id}</div>

                                                            <div className="font-semibold bg-gray-100 p-2 rounded-l">Type</div>
                                                            <div className="p-2 border rounded-r">{item.bundle_type}</div>

                                                            <div className="font-semibold bg-gray-100 p-2 rounded-l">Weight</div>
                                                            <div className="p-2 border rounded-r">{item.complete_item_weight}</div>

                                                            <div className="font-semibold bg-gray-100 p-2 rounded-l">Bags</div>
                                                            <div className="p-2 border rounded-r">{item.complete_item_bags}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-center mt-4">
                                                        <Button
                                                            onClick={() => {
                                                                const printContent = document.createElement('div');
                                                                printContent.innerHTML = `
                                                                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                                                                        <div style="text-align: center; margin-bottom: 20px;">
                                                                            <h2>Bundle Barcode</h2>
                                                                            <div style="margin: 20px 0;">
                                                                                ${document.querySelector('[data-testid="react-barcode"]')?.outerHTML || ''}
                                                                            </div>
                                                                            <p style="color: #666;">${item.complete_item_barcode}</p>
                                                                        </div>
                                                                        <div style="margin-top: 20px;">
                                                                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                                                                <div style="background: #f3f4f6; padding: 8px; font-weight: 600;">Bundle ID</div>
                                                                                <div style="border: 1px solid #e5e7eb; padding: 8px;">${item.complete_item_id}</div>
                                                                                <div style="background: #f3f4f6; padding: 8px; font-weight: 600;">Type</div>
                                                                                <div style="border: 1px solid #e5e7eb; padding: 8px;">${item.bundle_type}</div>
                                                                                <div style="background: #f3f4f6; padding: 8px; font-weight: 600;">Weight</div>
                                                                                <div style="border: 1px solid #e5e7eb; padding: 8px;">${item.complete_item_weight}</div>
                                                                                <div style="background: #f3f4f6; padding: 8px; font-weight: 600;">Bags</div>
                                                                                <div style="border: 1px solid #e5e7eb; padding: 8px;">${item.complete_item_bags}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                `;

                                                                const printWindow = window.open('', '_blank');
                                                                if (printWindow) {
                                                                    printWindow.document.write(printContent.innerHTML);
                                                                    printWindow.document.close();
                                                                    printWindow.onload = () => {
                                                                        printWindow.print();
                                                                    };
                                                                } else {
                                                                    toast({
                                                                        title: "Error",
                                                                        description: "Unable to open print window. Please allow pop-ups.",
                                                                        variant: "destructive",
                                                                    });
                                                                }
                                                            }}
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex gap-2 items-center"
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                            Print
                                                        </Button>
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