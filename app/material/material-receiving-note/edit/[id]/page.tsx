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
    material_item_particular: number;
    particular?: Particular;
    material_item_variety: string;
    material_item_gsm: string;
    material_item_size: string;
    material_item_net_weight: string;
    material_item_gross_weight: string;
    material_colour: string | undefined;
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
            const data: APIResponse = await response.json();
            setMaterialInfo(data.materialInfo);
            setSuppliers(data.suppliers);
            setParticulars(data.particulars);
            setColours(data.colours);
            setItems(data.materialInfo.material_items);
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Failed to fetch data");
        }
    };

    const handleFormChange = (field: keyof MaterialItem, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handle supplier change specifically
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

    const handleColourChange = (colourId: string) => {
        const selectedColour = colours.find(colour => colour.colour_id === Number(colourId));
        if (selectedColour) {
            handleFormChange("material_colour", selectedColour.colour_name);
        }
    };

    const handleAddItem = async () => {
        if (!formData.material_item_reel_no || !formData.particular || !formData.material_colour || !formData.material_item_variety || !formData.material_item_gsm || !formData.material_item_size || !formData.material_item_net_weight || !formData.material_item_gross_weight) {
            toast({ description: "All item fields are required.", variant: "destructive" });
            return;
        }

        try {
            const itemToAdd = {
                ...formData,
                material_item_particular: formData.particular.particular_id,
                material_info_id: materialInfo?.material_info_id,
            };

            const response = await fetch(`/api/material/material-receiving-note/add-item`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ item: itemToAdd }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add item");
            }

            const savedItem: MaterialItem = await response.json();

            // Add the saved item (with barcode) to the local state
            setItems([...items, savedItem]);

            // Fetch updated items from the server
            window.location.reload(); // Refresh the page
            fetchData(Number(id));

            // Reset form and dropdowns
            // setFormData({
            //     material_item_id: 0,
            //     material_item_reel_no: "",
            //     material_item_particular: 0,
            //     material_item_variety: "",
            //     material_item_gsm: "",
            //     material_item_size: "",
            //     material_item_net_weight: "",
            //     material_item_gross_weight: "",
            //     material_colour: undefined,
            //     material_item_barcode: "",
            //     particular: { particular_id: 0, particular_name: "" },
            // });

            toast({ description: "Item added successfully!" });

        } catch (error: any) {
            console.error("Error adding item:", error);
            toast({ description: error.message || "Failed to add item", variant: "destructive" });
        }
    };

    const handleDeleteItem = async (id: number) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this item?");

        if (!confirmDelete) return;

        try {
            const response = await fetch(`/api/material/material-receiving-note/item/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                throw new Error("Failed to delete data");
            } else {
                setItems(items.filter(item => item.material_item_id !== id));
            }

            alert("Data deleted successfully!");
        } catch (error) {
            console.error("Error deleting data:", error);
            alert("Failed to delete data");
        }
    };


    const handleSave = async () => {
        try {
            const response = await fetch(`/api/material/material-receiving-note/edit/${materialInfo?.material_info_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    materialInfo: {
                        material_supplier: materialInfo?.supplier.supplier_id,
                        material_items: items.map(item => ({
                            ...item,
                            particular: item.particular?.particular_id,
                        })),
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save data");
            }

            alert("Data saved successfully!");
        } catch (error) {
            console.error("Error saving data:", error);
            alert("Failed to save data");
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 items-center gap-2">
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

                <div className="container mx-auto p-6">
                    <Card className="mb-6">
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Material Information</h2>
                        </CardHeader>
                        <CardContent>
                            <Select
                                onValueChange={handleSupplierChange}
                                defaultValue={materialInfo?.supplier.supplier_name}
                            >
                                <SelectTrigger>
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

                            {/* Form Fields */}
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <Input
                                    placeholder="Reel No"
                                    value={formData.material_item_reel_no}
                                    onChange={(e: any) => handleFormChange("material_item_reel_no", e.target.value)}
                                />
                                <Select
                                    name="particular"
                                    onValueChange={(value: any) => handleFormChange("particular", particulars.find(p => p.particular_id === Number(value))!)}
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

                                {/* Additional fields */}
                                <Input
                                    placeholder="Variety"
                                    value={formData.material_item_variety}
                                    onChange={(e: any) => handleFormChange("material_item_variety", e.target.value)}
                                />
                                <Input
                                    placeholder="GSM"
                                    value={formData.material_item_gsm}
                                    onChange={(e: any) => handleFormChange("material_item_gsm", e.target.value)}
                                />
                                <Input
                                    placeholder="Size"
                                    value={formData.material_item_size}
                                    onChange={(e: any) => handleFormChange("material_item_size", e.target.value)}
                                />
                                <Input
                                    placeholder="Net Weight"
                                    value={formData.material_item_net_weight}
                                    onChange={(e: any) => handleFormChange("material_item_net_weight", e.target.value)}
                                />
                                <Input
                                    placeholder="Gross Weight"
                                    value={formData.material_item_gross_weight}
                                    onChange={(e: any) => handleFormChange("material_item_gross_weight", e.target.value)}
                                />
                                <Select
                                    name="colour"
                                    onValueChange={handleColourChange}
                                    defaultValue={formData.material_colour}
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

                    {/* Material Items Table */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Material Items</h2>
                        </CardHeader>
                        <CardContent>
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
                                            <TableCell>{item.particular?.particular_name}</TableCell>
                                            <TableCell>{item.material_item_variety}</TableCell>
                                            <TableCell>{item.material_item_gsm}</TableCell>
                                            <TableCell>{item.material_item_size}</TableCell>
                                            <TableCell>{item.material_item_net_weight}</TableCell>
                                            <TableCell>{item.material_item_gross_weight}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 items-center">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <Barcode className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Material Barcode</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="flex justify-center my-4">
                                                                <ReactBarcode value={item.material_item_barcode || 'Generating...'} />
                                                            </div>

                                                            {/* Vertical layout for data */}
                                                            <div className="w-full">
                                                                <div className="grid grid-cols-2 gap-2 w-full">

                                                                    <div className="font-semibold bg-gray-100 p-2 rounded-l">Reel No</div>
                                                                    <div className="p-2 border rounded-r">{item.material_item_reel_no}</div>

                                                                    <div className="font-semibold bg-gray-100 p-2 rounded-l">Net Weight</div>
                                                                    <div className="p-2 border rounded-r">{item.material_item_net_weight}</div>

                                                                    <div className="font-semibold bg-gray-100 p-2 rounded-l">GSM</div>
                                                                    <div className="p-2 border rounded-r">{item.material_item_gsm}</div>

                                                                    <div className="font-semibold bg-gray-100 p-2 rounded-l">Size</div>
                                                                    <div className="p-2 border rounded-r">{item.material_item_size}</div>

                                                                    <div className="font-semibold bg-gray-100 p-2 rounded-l">Colour</div>
                                                                    <div className="p-2 border rounded-r">{item.material_colour}</div>
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
                                                                            <p style="color: #666;">${item.material_item_barcode}</p>
                                                                        </div>
                                                                        <div style="margin-top: 20px;">
                                                                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                                                                <div style="background: #f3f4f6; padding: 8px; font-weight: 600;">Reel No</div>
                                                                                <div style="border: 1px solid #e5e7eb; padding: 8px;">${item.material_item_id}</div>
                                                                                <div style="background: #f3f4f6; padding: 8px; font-weight: 600;">New Weight</div>
                                                                                <div style="border: 1px solid #e5e7eb; padding: 8px;">${item.material_item_net_weight}</div>
                                                                                <div style="background: #f3f4f6; padding: 8px; font-weight: 600;">GSM</div>
                                                                                <div style="border: 1px solid #e5e7eb; padding: 8px;">${item.material_item_gsm}</div>
                                                                                <div style="background: #f3f4f6; padding: 8px; font-weight: 600;">Size</div>
                                                                                <div style="border: 1px solid #e5e7eb; padding: 8px;">${item.material_item_size}</div>
                                                                                <div style="background: #f3f4f6; padding: 8px; font-weight: 600;">Colour</div>
                                                                                <div style="border: 1px solid #e5e7eb; padding: 8px;">${item.material_colour}</div>
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
                                                    <Button variant="ghost" size="sm">
                                                        <Trash2 color="red" className="h-4 w-4 cursor-pointer" onClick={() => handleDeleteItem(item.material_item_id)} />
                                                    </Button>
                                                </div>
                                                {/* <Button variant="destructive" onClick={() => handleDeleteItem(item.material_item_id)}>
                                                    Delete
                                                </Button> */}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Button className="mt-6" onClick={handleSave}>
                        Save Changes
                    </Button>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
