// File: /app/stock/bundles/edit/[id]/components/CompleteBundleCard.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Barcode, Printer, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

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

    const handleItemSelection = (itemId: number, checked: boolean) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(itemId);
            } else {
                newSet.delete(itemId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedItems(new Set(completeItems.map(item => item.complete_item_id)));
        } else {
            setSelectedItems(new Set());
        }
    };

    const isAllSelected = completeItems.length > 0 && selectedItems.size === completeItems.length;

    const handleBulkPrint = () => {
        if (selectedItems.size === 0) {
            toast({ description: "Please select at least one item to print.", variant: "destructive" });
            return;
        }

        const selectedItemsArray = Array.from(selectedItems);
        const itemsToPrint = completeItems.filter(item => selectedItemsArray.includes(item.complete_item_id));

        if (itemsToPrint.length === 0) {
            toast({ description: "No items found to print.", variant: "destructive" });
            return;
        }

        setTimeout(() => {
            const printContentDiv = document.createElement('div');
            let allBarcodesHTML = '';

            itemsToPrint.forEach((item, index) => {
                let barcodeContainer = document.getElementById(`hidden-barcode-container-${item.complete_item_id}`);
                if (!barcodeContainer) {
                    barcodeContainer = document.getElementById(`barcode-container-${item.complete_item_barcode}`);
                }
                const barcodeSvgElement = barcodeContainer ? barcodeContainer.querySelector('svg') : null;
                
                let barcodeHTML = '<p style="color:red;">Barcode image not found.</p>';
                if (barcodeSvgElement) {
                    const clonedSvg = barcodeSvgElement.cloneNode(true) as SVGElement;
                    clonedSvg.setAttribute('style', 'max-width: 90%; height: auto;');
                    barcodeHTML = clonedSvg.outerHTML;
                }

                const itemHTML = `
                    <div class="page-wrapper">
                        <div class="label-container">
                            <div class="barcode-section">
                                ${barcodeHTML}
                            </div>
                            <hr class="divider"/>
                            <table class="details-table">
                                <tr><td><strong>Bundle ID:</strong></td><td>${item.complete_item_id}</td></tr>
                                <tr><td><strong>Type:</strong></td><td>${item.bundle_type || 'N/A'}</td></tr>
                                <tr><td><strong>Weight:</strong></td><td>${item.complete_item_weight}</td></tr>
                                <tr><td><strong>Bags:</strong></td><td>${item.complete_item_bags}</td></tr>
                            </table>
                        </div>
                    </div>
                `;
                allBarcodesHTML += itemHTML;
            });

            printContentDiv.innerHTML = allBarcodesHTML;

            const printWindow = window.open('', '_blank', 'width=500,height=400');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Print Bundle Labels</title>');
                printWindow.document.write(`
                    <style>
                        @page {
                            size: 4in 3in;
                            margin: 0.15in;
                        }
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        html, body {
                            margin: 0;
                            padding: 0;
                        }
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            font-size: 9pt;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .page-wrapper {
                            width: 3.7in;
                            min-height: 2.7in;
                            max-height: 2.7in;
                            margin: 0;
                            padding: 0;
                            display: block;
                            page-break-after: always;
                            page-break-inside: avoid;
                            overflow: hidden;
                        }
                        .page-wrapper:last-child {
                            page-break-after: auto;
                        }
                        .label-container {
                            width: 100%;
                            min-height: 2.7in;
                            max-height: 2.7in;
                            padding: 8px 10px;
                            border: 1px solid #ccc;
                            text-align: center;
                            display: flex;
                            flex-direction: column;
                            justify-content: space-between;
                            align-items: center;
                            overflow: hidden;
                        }
                        .barcode-section {
                            margin: 3px 0;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            flex-shrink: 0;
                            width: 100%;
                        }
                        .barcode-section svg {
                            max-width: 95%;
                            width: auto;
                            height: auto;
                            max-height: 0.7in;
                        }
                        .barcode-value {
                            font-size: 14pt;
                            color: #555;
                            margin-top: 2px;
                            margin-bottom: 4px;
                            word-break: break-all;
                        }
                        .divider {
                            border: none;
                            border-top: 1px dashed #ddd;
                            margin: 0;
                            width: 100%;
                            flex-shrink: 0;
                        }
                        .details-table {
                            width: 100%;
                            margin-top: 5px;
                            border-collapse: collapse;
                            text-align: left;
                            flex-shrink: 0;
                        }
                        .details-table tr {
                            line-height: 1.2;
                        }
                        .details-table td {
                            padding: 1px 4px;
                            vertical-align: middle;
                            font-size: 14pt;
                        }
                        .details-table td:first-child {
                            font-weight: bold;
                            white-space: nowrap;
                            color: #444;
                            width: 35%;
                        }
                        @media print {
                            body { 
                                font-size: 9pt;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                            .page-wrapper {
                                width: 3.7in;
                                min-height: 2.7in;
                                max-height: 2.7in;
                                margin: 0;
                            }
                            .label-container {
                                border: 1px solid #666;
                                box-shadow: none;
                                min-height: 2.7in;
                                max-height: 2.7in;
                            }
                        }
                    </style>
                `);
                printWindow.document.write('</head><body>');
                printWindow.document.write(printContentDiv.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.onload = () => {
                    printWindow.focus();
                    printWindow.print();
                };
            } else {
                toast({
                    title: "Error",
                    description: "Unable to open print window. Please check pop-up blocker settings.",
                    variant: "destructive",
                });
            }
        }, 100);
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
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <Button
                                onClick={handleBulkPrint}
                                disabled={selectedItems.size === 0}
                                variant="default"
                                className="flex gap-2 items-center"
                            >
                                <Printer className="h-4 w-4" />
                                Bulk Print {selectedItems.size > 0 && `(${selectedItems.size})`}
                            </Button>
                        </div>
                        {/* Hidden barcode containers for bulk printing */}
                        <div className="hidden">
                            {completeItems.map(item => (
                                <div
                                    key={`hidden-barcode-${item.complete_item_id}`}
                                    id={`hidden-barcode-container-${item.complete_item_id}`}
                                    className="flex justify-center my-4"
                                >
                                    <ReactBarcode
                                        value={item.complete_item_barcode || "NO BARCODE"}
                                        width={1.5}
                                        height={40}
                                        margin={5}
                                        background="#ffffff"
                                        lineColor="#000000"
                                        displayValue={true}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={isAllSelected}
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
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
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedItems.has(item.complete_item_id)}
                                                onCheckedChange={(checked) => handleItemSelection(item.complete_item_id, checked === true)}
                                                aria-label={`Select item ${item.complete_item_id}`}
                                            />
                                        </TableCell>
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
                                                                                            font-size: 11px;
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
                            <tfoot className="bg-slate-100">
                                <TableRow>
                                    <TableCell className="font-bold">
                                        {completeItems.length}
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        {completeItems.reduce((total, item) => total + parseFloat(item.complete_item_weight), 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell colSpan={3} className="font-bold">
                                        {completeItems.reduce((total, item) => total + parseInt(item.complete_item_bags), 0)}
                                    </TableCell>
                                </TableRow>
                            </tfoot>
                        </Table>
                        </div>
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