"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Barcode, Printer, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useToast } from "@/hooks/use-toast";

const ReactBarcode = dynamic(() => import('react-barcode'), { ssr: false });

// Define types
interface Supplier {
    supplier_id: number;
    supplier_name: string;
}

interface Particular {
    particular_id: number;
    particular_name: string;
}

interface Colour {
    colour_id: number;
    colour_name: string;
}

interface MaterialItem {
    material_item_id: number;
    material_item_reel_no: string;
    material_item_particular: number; // This is an ID
    particular?: Particular; // This is the resolved object
    material_item_variety: string;
    material_item_gsm: string;
    material_item_size: string;
    material_item_net_weight: string;
    material_item_gross_weight: string;
    material_colour: string | undefined; // Should match a colour_name or be derived from colour_id
    material_item_barcode: string;
}

interface MaterialInfo {
    material_info_id: number;
    supplier: Supplier;
    material_items: MaterialItem[];
}

interface APIResponse {
    materialInfo: MaterialInfo;
    suppliers: Supplier[];
    particulars: Particular[];
    colours: Colour[];
}

export default function EditMaterialReceivingNotePage() {
    const params = useParams();
    const id = params.id;

    const { toast } = useToast();
    const router = useRouter();

    const [materialInfo, setMaterialInfo] = useState<MaterialInfo | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [particulars, setParticulars] = useState<Particular[]>([]);
    const [colours, setColours] = useState<Colour[]>([]);
    const [items, setItems] = useState<MaterialItem[]>([]);
    const [formData, setFormData] = useState<MaterialItem>({
        material_item_id: 0,
        material_item_reel_no: "",
        material_item_particular: 0,
        particular: { particular_id: 0, particular_name: "" },
        material_item_variety: "",
        material_item_gsm: "",
        material_item_size: "",
        material_item_net_weight: "",
        material_item_gross_weight: "",
        material_colour: "",
        material_item_barcode: "",
    });

    useEffect(() => {
        if (id) fetchData(Number(id));
    }, [id]);

    const fetchData = async (materialId: number) => {
        try {
            const response = await fetch(`/api/material/material-receiving-note/edit/${materialId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: APIResponse = await response.json();
            setMaterialInfo(data.materialInfo);
            setSuppliers(data.suppliers);
            setParticulars(data.particulars);
            setColours(data.colours);
            // Ensure items have the particular object resolved if BE sends only ID
            const resolvedItems = data.materialInfo.material_items.map(item => ({
                ...item,
                particular: data.particulars.find(p => p.particular_id === item.material_item_particular) || item.particular
            }));
            setItems(resolvedItems);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ description: "Failed to fetch data. Please try again.", variant: "destructive" });
        }
    };

    const handleFormChange = (field: keyof MaterialItem, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSupplierChange = (value: string) => {
        if (materialInfo) {
            const selectedSupplier = suppliers.find(supplier => supplier.supplier_id === Number(value));
            if (selectedSupplier) {
                setMaterialInfo({
                    ...materialInfo,
                    supplier: selectedSupplier
                });
            }
        }
    };

    const handleAddItem = async () => {
        if (!formData.material_item_reel_no || !formData.particular?.particular_id || !formData.material_colour || !formData.material_item_variety || !formData.material_item_gsm || !formData.material_item_size || !formData.material_item_net_weight || !formData.material_item_gross_weight) {
            toast({ description: "All item fields are required.", variant: "destructive" });
            return;
        }

        try {
            const itemToAdd = {
                ...formData,
                material_item_particular: formData.particular.particular_id, // Send ID
                material_info_id: materialInfo?.material_info_id,
            };
            // Remove the particular object before sending, if your API expects only the ID
            const { particular, ...itemPayload } = itemToAdd;


            const response = await fetch(`/api/material/material-receiving-note/add-item`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ item: itemPayload }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add item");
            }

            const savedItem: MaterialItem = await response.json();

            const resolvedSavedItem = {
                ...savedItem,
                particular: particulars.find(p => p.particular_id === savedItem.material_item_particular)
            };

            setItems([...items, resolvedSavedItem]);

            setFormData({
                material_item_id: 0,
                material_item_reel_no: "",
                material_item_particular: 0,
                particular: { particular_id: 0, particular_name: "" },
                material_item_variety: "",
                material_item_gsm: "",
                material_item_size: "",
                material_item_net_weight: "",
                material_item_gross_weight: "",
                material_colour: "",
                material_item_barcode: "",
            });

            toast({ description: "Item added successfully!" });

        } catch (error: any) {
            console.error("Error adding item:", error);
            toast({ description: error.message || "Failed to add item", variant: "destructive" });
        }
    };

    const handleDeleteItem = async (itemId: number) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this item?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`/api/material/material-receiving-note/item/${itemId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to delete item");
            }

            setItems(items.filter(item => item.material_item_id !== itemId));
            toast({ description: "Item deleted successfully!" });

        } catch (error: any) {
            console.error("Error deleting item:", error);
            toast({ description: error.message || "Failed to delete item", variant: "destructive" });
        }
    };


    const handleSave = async () => {
        if (!materialInfo) {
            toast({ description: "Material information not loaded.", variant: "destructive" });
            return;
        }
        try {
            const payload = {
                material_info_id: materialInfo.material_info_id,
                material_supplier: materialInfo.supplier.supplier_id,
                material_items: items.map(item => {
                    const { particular, ...restOfItem } = item;
                    return {
                        ...restOfItem,
                        material_item_particular: item.particular?.particular_id || item.material_item_particular,
                    };
                }),
            };

            const response = await fetch(`/api/material/material-receiving-note/edit/${materialInfo.material_info_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ materialInfo: payload }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to save data");
            }

            toast({ description: "Data saved successfully!" });
            fetchData(Number(id));

        } catch (error: any) {
            console.error("Error saving data:", error);
            toast({ description: error.message || "Failed to save data", variant: "destructive" });
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 items-center gap-2 sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-2xl font-bold">Edit Material Receiving Note</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <main className="p-6">
                    <Card className="mb-6">
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Material Information</h2>
                        </CardHeader>
                        <CardContent>
                            <Select
                                onValueChange={handleSupplierChange}
                                value={materialInfo?.supplier.supplier_id ? String(materialInfo.supplier.supplier_id) : ""}
                            >
                                <SelectTrigger className="mb-4">
                                    <SelectValue placeholder="Select a supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(supplier => (
                                        <SelectItem key={supplier.supplier_id} value={String(supplier.supplier_id)}>
                                            {supplier.supplier_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 border p-4 rounded-md">
                                <Input
                                    placeholder="Reel No"
                                    value={formData.material_item_reel_no}
                                    onChange={(e) => handleFormChange("material_item_reel_no", e.target.value)}
                                />
                                <Select
                                    value={formData.particular?.particular_id ? String(formData.particular.particular_id) : ""}
                                    onValueChange={(value) => {
                                        const selectedParticular = particulars.find(p => p.particular_id === Number(value));
                                        if (selectedParticular) {
                                            handleFormChange("particular", selectedParticular);
                                            handleFormChange("material_item_particular", selectedParticular.particular_id);
                                        } else {
                                            handleFormChange("particular", { particular_id: 0, particular_name: "" });
                                            handleFormChange("material_item_particular", 0);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a particular" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {particulars.map(particular => (
                                            <SelectItem key={particular.particular_id} value={String(particular.particular_id)}>
                                                {particular.particular_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="Variety"
                                    value={formData.material_item_variety}
                                    onChange={(e) => handleFormChange("material_item_variety", e.target.value)}
                                />
                                <Input
                                    placeholder="GSM"
                                    value={formData.material_item_gsm}
                                    onChange={(e) => handleFormChange("material_item_gsm", e.target.value)}
                                />
                                <Input
                                    placeholder="Size"
                                    value={formData.material_item_size}
                                    onChange={(e) => handleFormChange("material_item_size", e.target.value)}
                                />
                                <Input
                                    placeholder="Net Weight"
                                    value={formData.material_item_net_weight}
                                    onChange={(e) => handleFormChange("material_item_net_weight", e.target.value)}
                                    type="number"
                                />
                                <Input
                                    placeholder="Gross Weight"
                                    value={formData.material_item_gross_weight}
                                    onChange={(e) => handleFormChange("material_item_gross_weight", e.target.value)}
                                    type="number"
                                />
                                <Select
                                    value={formData.material_colour ? String(colours.find(c => c.colour_name === formData.material_colour)?.colour_id) : ""}
                                    onValueChange={(value) => {
                                        const selectedColourObject = colours.find(c => c.colour_id === Number(value));
                                        if (selectedColourObject) {
                                            handleFormChange("material_colour", selectedColourObject.colour_name);
                                        } else {
                                            handleFormChange("material_colour", "");
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a colour" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {colours.map(colour => (
                                            <SelectItem key={colour.colour_id} value={String(colour.colour_id)}>
                                                {colour.colour_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button className="mt-4" onClick={handleAddItem}>
                                Add Item
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Material Items</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Reel No</TableHead>
                                            <TableHead>Colour</TableHead>
                                            <TableHead>Particular</TableHead>
                                            <TableHead>Variety</TableHead>
                                            <TableHead>Gsm</TableHead>
                                            <TableHead>Size</TableHead>
                                            <TableHead>Net Weight</TableHead>
                                            <TableHead>Gross Weight</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map(item => (
                                            <TableRow key={item.material_item_id}>
                                                <TableCell>{item.material_item_reel_no}</TableCell>
                                                <TableCell>{item.material_colour}</TableCell>
                                                <TableCell>{item.particular?.particular_name || 'N/A'}</TableCell>
                                                <TableCell>{item.material_item_variety}</TableCell>
                                                <TableCell>{item.material_item_gsm}</TableCell>
                                                <TableCell>{item.material_item_size}</TableCell>
                                                <TableCell>{item.material_item_net_weight}</TableCell>
                                                <TableCell>{item.material_item_gross_weight}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 items-center">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <Barcode className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-md">
                                                                <DialogHeader>
                                                                    <DialogTitle>Material Barcode</DialogTitle>
                                                                </DialogHeader>
                                                                <div
                                                                    className="flex justify-center my-4"
                                                                    id={`barcode-container-${item.material_item_id}`}
                                                                >
                                                                    <ReactBarcode
                                                                        value={item.material_item_barcode || "NO BARCODE"}
                                                                        width={1.5} // Adjusted for potentially smaller print areas
                                                                        height={40} // Adjusted for potentially smaller print areas
                                                                        margin={5}
                                                                        background="#ffffff"
                                                                        lineColor="#000000"
                                                                        displayValue={true}
                                                                    />
                                                                </div>
                                                                <div className="w-full space-y-2">
                                                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                                                                        <div className="font-semibold bg-gray-100 p-2 rounded-l-md">Reel No</div>
                                                                        <div className="p-2 border rounded-r-md break-all">{item.material_item_reel_no}</div>

                                                                        <div className="font-semibold bg-gray-100 p-2 rounded-l-md">Net Weight</div>
                                                                        <div className="p-2 border rounded-r-md">{item.material_item_net_weight}</div>

                                                                        <div className="font-semibold bg-gray-100 p-2 rounded-l-md">GSM</div>
                                                                        <div className="p-2 border rounded-r-md">{item.material_item_gsm}</div>

                                                                        <div className="font-semibold bg-gray-100 p-2 rounded-l-md">Size</div>
                                                                        <div className="p-2 border rounded-r-md">{item.material_item_size}</div>

                                                                        <div className="font-semibold bg-gray-100 p-2 rounded-l-md">Colour</div>
                                                                        <div className="p-2 border rounded-r-md">{item.material_colour}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-center mt-6">
                                                                    <Button
                                                                        onClick={() => {
                                                                            const barcodeContainer = document.getElementById(`barcode-container-${item.material_item_id}`);
                                                                            const barcodeSvgElement = barcodeContainer ? barcodeContainer.querySelector('svg') : null;
                                                                            // Ensure the SVG is scaled down if it's too large for the print area
                                                                            if (barcodeSvgElement) {
                                                                                barcodeSvgElement.style.maxWidth = "90%"; // Max width within its container
                                                                                barcodeSvgElement.style.height = "auto";
                                                                            }
                                                                            const barcodeHTML = barcodeSvgElement ? barcodeSvgElement.outerHTML : '<p style="color:red;">Barcode image not found.</p>';

                                                                            const printContentDiv = document.createElement('div');
                                                                            // MODIFICATION: Beautified item details and layout for print
                                                                            printContentDiv.innerHTML = `
                                                                                <div class="label-container">
                                                                                    <div class="barcode-section">
                                                                                        ${barcodeHTML}
                                                                                    </div>
                                                                                    <hr class="divider"/>
                                                                                    <table class="details-table">
                                                                                        <tr><td><strong>Reel No:</strong></td><td>${item.material_item_reel_no}</td></tr>
                                                                                        <tr><td><strong>Net Wt:</strong></td><td>${item.material_item_net_weight}</td></tr>
                                                                                        <tr><td><strong>GSM:</strong></td><td>${item.material_item_gsm}</td></tr>
                                                                                        <tr><td><strong>Size:</strong></td><td>${item.material_item_size}</td></tr>
                                                                                        <tr><td><strong>Colour:</strong></td><td>${item.material_colour}</td></tr>
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
                                                                                            size: 4in 3in; /* Attempt to set physical size */
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
                                                                                            font-size: 9pt; /* Smaller base font for small label */
                                                                                        }
                                                                                        .label-container {
                                                                                            width: 100%;
                                                                                            max-width: 3.7in; /* Max width considering margins */
                                                                                            padding: 10px;
                                                                                            border: 1px solid #ccc;
                                                                                            box-shadow: 0 0 5px rgba(0,0,0,0.1);
                                                                                            text-align: center;
                                                                                            box-sizing: border-box;
                                                                                        }
                                                                                        .label-title {
                                                                                            font-size: 11pt;
                                                                                            font-weight: bold;
                                                                                            margin-top: 0;
                                                                                            margin-bottom: 8px;
                                                                                            color: #333;
                                                                                        }
                                                                                        .barcode-section {
                                                                                            margin: 5px 0;
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
                                                                                        }
                                                                                        .details-table td:first-child {
                                                                                            font-weight: bold;
                                                                                            white-space: nowrap;
                                                                                            color: #444;
                                                                                            width: 30%; /* Adjust label column width */
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
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(item.material_item_id)}>
                                                            <Trash2 color="red" className="h-4 w-4 cursor-pointer" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {items.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No items added yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleSave}>
                            Save Changes
                        </Button>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
