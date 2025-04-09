"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/layouts/loading";
import { Trash } from "lucide-react";
import Link from "next/link";

type Customer = {
    customer_id: number;
    customer_full_name: string;
};

type SalesItem = {
    id: string;
    sales_item_id?: number; // Added for existing items
    barcode: string;
    bagType: string;
    weight: number;
    bags: number;
    price: number;
    total: number;
    complete_item_id?: number;
};

type DoDetails = {
    sales_info_id: number;
    customer_name: number;
    customer_address: string;
    customer_contact: string;
    sales_no_bags: string;
    add_date: string;
    items: {
        sales_item_id: number;
        barcode_no: string;
        bundle_type: string;
        n_weight: number;
        no_of_bags: number;
        item_price: string;
        item_total: string;
        complete_item_id: number;
    }[];
};

export default function EditDoPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>("");
    const [barcode, setBarcode] = useState<string>("");
    const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
    const [validatingBarcode, setValidatingBarcode] = useState(false);
    const [deliveryOrderDetails, setDeliveryOrderDetails] = useState<DoDetails | null>(null);

    // Fetch DO details and customers on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch customers
                const customersResponse = await fetch("/api/sales/do/new");
                const customersResult = await customersResponse.json();

                if (!customersResult.success) {
                    throw new Error(customersResult.error || "Failed to fetch customers");
                }

                setCustomers(customersResult.data);

                // Fetch DO details
                const doResponse = await fetch(`/api/sales/do/${params.id}`);
                const doJson = await doResponse.json();
                const doResult = doJson.data;

                // The API returns a different structure than what we expected
                // It returns salesInfo, customer, salesItems directly without a success wrapper
                if (!doResult.salesInfo || !doResult.salesItems) {
                    throw new Error("Failed to fetch delivery order details");
                }

                // Adapt the response to our expected format
                const salesInfo = doResult.salesInfo;
                setDeliveryOrderDetails({
                    ...salesInfo,
                    items: doResult.salesItems
                });
                setSelectedCustomer(salesInfo.customer_name.toString());

                // Convert items to the format expected by our state
                const items: SalesItem[] = doResult.salesItems.map((item: any) => ({
                    id: item.sales_item_id.toString(),
                    sales_item_id: item.sales_item_id,
                    barcode: item.barcode_no,
                    bagType: item.bundle_type,
                    weight: item.n_weight,
                    bags: item.no_of_bags,
                    price: parseFloat(item.item_price),
                    total: parseFloat(item.item_total),
                    complete_item_id: item.complete_item_id
                }));

                setSalesItems(items);
            } catch (error) {
                console.error("Error fetching data:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to load data"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.id, toast]);

    // Calculate total
    const totalItems = salesItems.reduce((sum, item) => sum + item.total, 0);
    const totalBags = salesItems.reduce((sum, item) => sum + item.bags, 0);

    // Validate barcode and add item
    const handleAddItem = async () => {
        // Validate inputs
        if (!selectedCustomer) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please select a customer first"
            });
            return;
        }

        if (!barcode) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please enter a barcode"
            });
            return;
        }

        setValidatingBarcode(true);

        try {
            // Validate barcode
            const response = await fetch(`/api/sales/do/validate-barcode?barcode=${barcode}`);
            const result = await response.json();

            if (!result.success) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Invalid barcode"
                });
                return;
            }

            const itemData = result.data;

            if (typeof itemData.price !== 'number' || itemData.price <= 0) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Price not found or invalid for this item."
                });
                setValidatingBarcode(false);
                return;
            }

            const priceValue = itemData.price;
            const total = priceValue * itemData.weight;

            // Add item to the list
            const newItem: SalesItem = {
                id: Date.now().toString(),
                barcode: barcode,
                bagType: itemData.bundle_type,
                weight: itemData.weight,
                bags: itemData.bags,
                price: priceValue,
                total: total,
                complete_item_id: itemData.complete_item_id
            };

            setSalesItems([...salesItems, newItem]);

            // Clear inputs for next item
            setBarcode("");

            toast({
                title: "Success",
                description: "Item added to delivery order"
            });
        } catch (error) {
            console.error("Error validating barcode:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to validate barcode"
            });
        } finally {
            setValidatingBarcode(false);
        }
    };

    // Remove item from the list
    const handleRemoveItem = (id: string) => {
        setSalesItems(salesItems.filter(item => item.id !== id));
    };

    // Update the delivery order
    const handleUpdateDo = async () => {
        if (!selectedCustomer) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please select a customer"
            });
            return;
        }

        if (salesItems.length === 0) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please add at least one item"
            });
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(`/api/sales/do/${params.id}/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customerId: parseInt(selectedCustomer),
                    items: salesItems,
                    totalBags: totalBags
                }),
            });

            const result = await response.json();

            if (result.success || result.salesInfo) {
                toast({
                    title: "Success",
                    description: "Delivery order updated successfully"
                });

                // Redirect to the view page
                router.push(`/sales/do/view/${params.id}`);
            } else {
                throw new Error(result.error || "Failed to update delivery order");
            }
        } catch (error) {
            console.error("Error updating delivery order:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update delivery order"
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Enter key press in barcode field
    const handleBarcodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem();
        }
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-2xl font-bold">Edit Delivery Order #{params.id}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="container mx-auto p-4">
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        {/* Customer Selection */}
                        <div className="mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Customer Name</label>
                                    <Select
                                        value={selectedCustomer}
                                        onValueChange={setSelectedCustomer}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Please Select Customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map((customer) => (
                                                <SelectItem
                                                    key={customer.customer_id}
                                                    value={customer.customer_id.toString()}
                                                >
                                                    {customer.customer_full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Item Entry Form */}
                        <div className="mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Barcode</label>
                                    <Input
                                        value={barcode}
                                        onChange={(e) => setBarcode(e.target.value)}
                                        onKeyPress={handleBarcodeKeyPress}
                                        placeholder="Scan or enter barcode"
                                        disabled={validatingBarcode || submitting}
                                    />
                                </div>
                                <div>
                                    <Button
                                        onClick={handleAddItem}
                                        disabled={validatingBarcode || submitting}
                                        className="w-full md:w-auto"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">#</TableHead>
                                    <TableHead>Barcode No</TableHead>
                                    <TableHead>Bag Type</TableHead>
                                    <TableHead className="text-right">N/Weight</TableHead>
                                    <TableHead className="text-right">No of Bags</TableHead>
                                    <TableHead className="text-right">Item Price</TableHead>
                                    <TableHead className="text-right">Item Total</TableHead>
                                    <TableHead className="w-[50px]">#</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {salesItems.length > 0 ? (
                                    <>
                                        {salesItems.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{item.barcode}</TableCell>
                                                <TableCell>{item.bagType}</TableCell>
                                                <TableCell className="text-right">{item.weight.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">{item.bags}</TableCell>
                                                <TableCell className="text-right">{item.price.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">{item.total.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        disabled={submitting}
                                                    >
                                                        <Trash color="#ff0000" className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-right font-bold">
                                                Total
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {totalBags}
                                            </TableCell>
                                            <TableCell></TableCell>
                                            <TableCell className="text-right font-bold">
                                                {totalItems.toFixed(2)}
                                            </TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </>
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            No items added yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4 mt-6">
                            <Button variant="outline" asChild>
                                <Link href={`/sales/do/view/${params.id}`}>Cancel</Link>
                            </Button>
                            <Button
                                onClick={handleUpdateDo}
                                disabled={salesItems.length === 0 || submitting}
                            >
                                {submitting ? "Updating..." : "Update Delivery Order"}
                            </Button>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}