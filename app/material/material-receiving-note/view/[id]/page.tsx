"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Define types
interface SupplierInfo {
    supplier_id: number;
    supplier_name: string;
    supplier_company: string;
    supplier_contact_no: string;
    supplier_email: string;
    supplier_address: string;
}

interface MaterialItem {
    material_item_id: number;
    material_item_reel_no: string;
    material_colour: string;
    material_item_particular: string;
    particular: {
        particular_name: string;
    };
    material_item_variety: string;
    material_item_gsm: string;
    material_item_size: string;
    material_item_net_weight: string;
    material_item_gross_weight: string;
    material_item_barcode: string;
    added_date: string;
    user_id: number;
    material_status: number;
}

interface MaterialInfo {
    material_info_id: number;
    material_supplier: number;
    total_reels: number;
    total_net_weight: number;
    total_gross_weight: number;
    add_date: string;
    user_id: number;
    material_info_status: number;
    supplier: SupplierInfo;
    material_items: MaterialItem[];
}

export default function MaterialReceivingNoteView() {
    const params = useParams();
    const id = params.id;

    const [materialInfo, setMaterialInfo] = useState<MaterialInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchData(Number(id));
    }, [id]);

    const fetchData = async (materialId: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/material/material-receiving-note/view/${materialId}`);
            const data = await response.json();
            setMaterialInfo(data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <Skeleton className="h-16 w-full mb-4" />
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

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
                                    <BreadcrumbPage className="text-2xl font-bold">View Material Receiving Note</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="container mx-auto p-6">
                    {/* Top Card: Material Information */}
                    <Card className="mb-6">
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Material Information</h2>
                        </CardHeader>
                        <CardContent>
                            <p><strong>ID:</strong> {materialInfo?.material_info_id}</p>
                            <p><strong>Total Reels:</strong> {materialInfo?.total_reels}</p>
                            <p><strong>Total Net Weight:</strong> {materialInfo?.total_net_weight} kg</p>
                            <p><strong>Total Gross Weight:</strong> {materialInfo?.total_gross_weight} kg</p>
                            <p><strong>Added Date:</strong> {new Date(materialInfo?.add_date || '').toLocaleDateString()}</p>
                            <p><strong>Status:</strong> {materialInfo?.material_info_status === 1 ? "Active" : "Inactive"}</p>
                            <p><strong>User ID:</strong> {materialInfo?.user_id}</p>
                        </CardContent>
                    </Card>

                    {/* Supplier Card */}
                    <Card className="mb-6">
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Supplier Information</h2>
                        </CardHeader>
                        <CardContent>
                            <p><strong>Supplier Name:</strong> {materialInfo?.supplier.supplier_name}</p>
                            <p><strong>Company:</strong> {materialInfo?.supplier.supplier_company}</p>
                            <p><strong>Contact:</strong> {materialInfo?.supplier.supplier_contact_no}</p>
                            <p><strong>Email:</strong> {materialInfo?.supplier.supplier_email}</p>
                            <p><strong>Address:</strong> {materialInfo?.supplier.supplier_address}</p>
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
                                        <TableHead>ID</TableHead>
                                        <TableHead>Reel No</TableHead>
                                        <TableHead>Colour</TableHead>
                                        <TableHead>Particular</TableHead>
                                        <TableHead>Variety</TableHead>
                                        <TableHead>GSM</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Net Weight</TableHead>
                                        <TableHead>Gross Weight</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {materialInfo?.material_items.map((item) => (
                                        <TableRow key={item.material_item_id}>
                                            <TableCell>{item.material_item_id}</TableCell>
                                            <TableCell>{item.material_item_reel_no}</TableCell>
                                            <TableCell>{item.material_colour}</TableCell>
                                            <TableCell>{item.particular ? item.particular.particular_name : "N/A"}</TableCell>
                                            <TableCell>{item.material_item_variety}</TableCell>
                                            <TableCell>{item.material_item_gsm}</TableCell>
                                            <TableCell>{item.material_item_size}</TableCell>
                                            <TableCell>{item.material_item_net_weight}</TableCell>
                                            <TableCell>{item.material_item_gross_weight}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
