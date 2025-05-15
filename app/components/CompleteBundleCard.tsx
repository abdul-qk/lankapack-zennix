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
                                                        <div
                                                            className="flex justify-center my-4"
                                                            id={`barcode-container-${item.complete_item_barcode}`}
                                                        >
                                                            <ReactBarcode
                                                                value={item.complete_item_barcode || "NO BARCODE"}
                                                                width={1.5} // Adjusted for potentially smaller print areas
                                                                height={30} // Adjusted for potentially smaller print areas
                                                                margin={3}
                                                                background="#ffffff"
                                                                lineColor="#000000"
                                                                displayValue={true}
                                                            />
                                                        </div>
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
                                                                const barcodeContainer = document.getElementById(`barcode-container-${item.complete_item_barcode}`);
                                                                const barcodeSvgElement = barcodeContainer ? barcodeContainer.querySelector('svg') : null;
                                                                // Ensure the SVG is scaled down if it's too large for the print area
                                                                if (barcodeSvgElement) {
                                                                    barcodeSvgElement.style.maxWidth = "90%"; // Max width within its container
                                                                    barcodeSvgElement.style.height = "auto";
                                                                }
                                                                const barcodeHTML = barcodeSvgElement ? barcodeSvgElement.outerHTML : '<p style="color:red;">Barcode image not found.</p>';

                                                                const printContent = document.createElement('div');
                                                                printContent.innerHTML = `
                                                                    <div class="label-container">
                                                                        <div class="barcode-section">
                                                                            ${barcodeHTML}
                                                                        </div>
                                                                        <hr class="divider"/>
                                                                        <table class="details-table">
                                                                            <tr><td><strong>Bundle ID:</strong></td><td>${item.complete_item_id}</td></tr>
                                                                            <tr><td><strong>Type:</strong></td><td>${item.bundle_type}</td></tr>
                                                                            <tr><td><strong>Weight:</strong></td><td>${item.complete_item_weight}</td></tr>
                                                                            <tr><td><strong>Bags:</strong></td><td>${item.complete_item_bags}</td></tr>
                                                                        </table>
                                                                    </div>
                                                                `;

                                                                const printWindow = window.open('', '_blank', 'width=500,height=400'); // Adjusted window size for preview
                                                                if (printWindow) {
                                                                    printWindow.document.write('<html><head><title>Print Material Label</title>');
                                                                    // MODIFICATION: Added @page rule for 4x3 inch size and beautified styles
                                                                    printWindow.document.write(`
                                                                                    <style>
                                                                                        @page {
                                                                                            size: 3in 2in; /* Attempt to set physical size */
                                                                                            margin: 0.15in; /* Minimal margin */
                                                                                        }
                                                                                        body { 
                                                                                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                                                                            margin: 0; 
                                                                                            padding: 0;
                                                                                            width: 100%; 
                                                                                            height: 100%;
                                                                                            display: flex;
                                                                                            flex-direction: column;
                                                                                            align-items: center;
                                                                                            justify-content: center; /* Center content on the small page */
                                                                                            box-sizing: border-box;
                                                                                            font-size: 9pt !important; /* Smaller base font for small label */
                                                                                        }
                                                                                        .label-container {
                                                                                            width: 100%;
                                                                                            max-width: 3in; /* Max width considering margins */
                                                                                            max-height: 2in; /* Max height considering margins */
                                                                                            padding: 10px;
                                                                                            border: 1px solid #ccc;
                                                                                            box-shadow: 0 0 5px rgba(0,0,0,0.1);
                                                                                            text-align: center;
                                                                                            box-sizing: border-box;
                                                                                        }
                                                                                        .label-title {
                                                                                            font-size: 9pt !important;
                                                                                            font-weight: normal;
                                                                                            margin-top: 0;
                                                                                            margin-bottom: 8px;
                                                                                            color: #333;
                                                                                        }
                                                                                        .barcode-section {
                                                                                            margin: 0;
                                                                                            display: inline-block; /* To center the SVG */
                                                                                        }
                                                                                        .barcode-section svg {
                                                                                            max-width: 100%; /* Ensure SVG scales down */
                                                                                            height: auto;    /* Maintain aspect ratio */
                                                                                            max-height: 1in; /* Limit barcode height */
                                                                                        }
                                                                                        .barcode-value {
                                                                                            font-size: 8pt;
                                                                                            color: #555;
                                                                                            margin-top: 2px;
                                                                                            margin-bottom: 8px;
                                                                                            word-break: break-all;
                                                                                        }
                                                                                        .divider {
                                                                                            border: none;
                                                                                            border-top: 1px dashed #ddd;
                                                                                            margin: 8px 0;
                                                                                        }
                                                                                        .details-table {
                                                                                            width: 100%;
                                                                                            margin-top: 8px;
                                                                                            border-collapse: collapse;
                                                                                            text-align: left;
                                                                                        }
                                                                                        .details-table td {
                                                                                            padding: 3px 5px;
                                                                                            vertical-align: top;
                                                                                            font-size: 10px;
                                                                                        }
                                                                                        .details-table td:first-child {
                                                                                            font-weight: bold;
                                                                                            white-space: nowrap;
                                                                                            color: #444;
                                                                                            width: 30%; /* Adjust label column width */
                                                                                            font-size: 11px;
                                                                                        }
                                                                                        @media print {
                                                                                            body { 
                                                                                                font-size: 9pt; /* Ensure font size is appropriate for print */
                                                                                                -webkit-print-color-adjust: exact; /* For Chrome/Safari to print backgrounds */
                                                                                                print-color-adjust: exact; /* Standard */
                                                                                            }
                                                                                            .label-container {
                                                                                                border: 1px solid #666; /* Make border more visible on print */
                                                                                                box-shadow: none; /* Remove shadow for print */
                                                                                            }
                                                                                        }
                                                                                    </style>
                                                                                `);
                                                                    printWindow.document.write('</head><body>');
                                                                    printWindow.document.write(printContent.innerHTML);
                                                                    printWindow.document.write('</body></html>');
                                                                    printWindow.document.close();
                                                                    printWindow.onload = () => {
                                                                        printWindow.focus();
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