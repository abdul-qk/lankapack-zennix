"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { set } from "date-fns";

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
    material_colour: string;
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

export default function AddMaterialReceivingNotePage() {
    const params = useParams();
    const id = params.id;
    // Add toast
    const { toast } = useToast();

    // const [materialInfo, setMaterialInfo] = useState<MaterialInfo | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [selectedParticularId, setSelectedParticularId] = useState<string | undefined>(undefined);
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
    });
    const [selectedColourId, setSelectedColourId] = useState<string | undefined>(
        // Initialize from formData if available
        formData.material_colour ?
            String(colours.find(c => c.colour_name === formData.material_colour)?.colour_id) :
            undefined
    );

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch(`/api/material/material-receiving-note/add/`);
            const data: APIResponse = await response.json();
            setSuppliers(data.suppliers);
            setParticulars(data.particulars);
            setColours(data.colours);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ description: "Failed fetching data", variant: "destructive" });
        }
    };

    const handleFormChange = (field: keyof MaterialItem, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handle supplier change specifically
    const handleSupplierChange = (value: string) => {
        setSelectedSupplier(value);
        console.log("Selected supplier:", value);
    };

    const handleParticularChange = (value: string) => {
        setSelectedParticularId(value);
        // Find the full object and use your existing handler
        const selectedParticular = particulars.find(p => p.particular_id === Number(value));
        if (selectedParticular) {
            handleFormChange("particular", selectedParticular);
        }
    };

    const handleColourChange = (colourId: string) => {
        setSelectedColourId(colourId);
        const selectedColour = colours.find(colour => colour.colour_id === Number(colourId));
        if (selectedColour) {
            handleFormChange("material_colour", selectedColour.colour_name);
        }
    }

    const handleAddItem = () => {
        if (!formData.material_item_reel_no || !formData.particular || !formData.material_colour || !formData.material_item_variety || !formData.material_item_gsm || !formData.material_item_size || !formData.material_item_net_weight || !formData.material_item_gross_weight) {
            alert("All fields are required.");
            return;
        }

        setItems([...items, { ...formData, material_item_particular: formData.particular.particular_id }]);
        setFormData({
            material_item_id: 0,
            material_item_reel_no: "",
            material_item_particular: 0,
            material_item_variety: "",
            material_item_gsm: "",
            material_item_size: "",
            material_item_net_weight: "",
            material_item_gross_weight: "",
            material_colour: "",
            particular: { particular_id: 0, particular_name: "" },
        });
        setSelectedParticularId("");
        setSelectedColourId("");
    };

    const handleDeleteItem = async (id: number) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this item?");

        if (!confirmDelete) return;

        setItems(items.filter(item => item.material_item_id !== id));
    };


    const handleSave = async () => {
        try {
            const response = await fetch(`/api/material/material-receiving-note/add/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    materialInfo: {
                        material_supplier: selectedSupplier,
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
                                    <BreadcrumbPage className="text-2xl font-bold">Add New Material Receiving Note</BreadcrumbPage>
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
                                value={selectedSupplier}
                                onValueChange={handleSupplierChange}
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
                                    value={selectedParticularId}
                                    onValueChange={handleParticularChange}
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
                                    value={selectedColourId}
                                    onValueChange={handleColourChange}
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
                                                <Button variant="destructive" onClick={() => handleDeleteItem(item.material_item_id)}>
                                                    Delete
                                                </Button>
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
