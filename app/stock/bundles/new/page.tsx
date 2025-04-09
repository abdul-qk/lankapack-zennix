"use client";

import * as React from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loading from "@/components/layouts/loading";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Barcode, Info, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import dynamic from "next/dynamic";

const ReactBarcode = dynamic(() => import('react-barcode'), { ssr: false });

interface BarcodeOption {
    cutting_roll_id: number;
    cutting_barcode: string;
}

interface RollData {
    no_of_bags: number;
    bag_type: string;
    slitting_wastage: string;
    print_wastage: string;
    cutting_wastage: string;
}

interface CompleteItem {
    complete_item_id: number;
    bundle_type: string;
    complete_item_weight: string;
    complete_item_bags: string;
    complete_item_barcode: string;
    complete_item_date: string;
}

interface NonCompleteItem {
    non_complete_id: number;
    non_complete_weight: string;
    non_complete_bags: string;
    non_complete_barcode: string;
}

export default function AddBundlePage() {
    const [loading, setLoading] = React.useState(true);
    const [barcodeOptions, setBarcodeOptions] = React.useState<BarcodeOption[]>([]);
    const [selectedBarcode, setSelectedBarcode] = React.useState<string>("");
    const [selectedBarcodeData, setSelectedBarcodeData] = React.useState<BarcodeOption | null>(null);
    const [rollData, setRollData] = React.useState<RollData | null>(null);
    const [isLoadingData, setIsLoadingData] = React.useState(false);

    // Complete bundle states
    const [bundleWeight, setBundleWeight] = React.useState<string>("");
    const [noOfBags, setNoOfBags] = React.useState<string>("");
    const [completeItems, setCompleteItems] = React.useState<CompleteItem[]>([]);
    const [isSubmittingComplete, setIsSubmittingComplete] = React.useState(false);

    // Non-complete bundle states
    const [nonCompleteWeight, setNonCompleteWeight] = React.useState<string>("");
    const [nonCompleteBags, setNonCompleteBags] = React.useState<string>("");
    const [nonCompleteItems, setNonCompleteItems] = React.useState<NonCompleteItem[]>([]);
    const [isSubmittingNonComplete, setIsSubmittingNonComplete] = React.useState(false);

    const { toast } = useToast();

    React.useEffect(() => {
        fetchBarcodes();
    }, []);

    const fetchBarcodes = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/stock/bundle/barcode');
            const data = await response.json();

            if (data && data.barcodes) {
                setBarcodeOptions(data.barcodes);
            }
        } catch (error) {
            console.error("Error fetching barcodes:", error);
            toast({
                title: "Error",
                description: "Failed to fetch barcodes",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchRollData = async (barcode: string) => {
        try {
            setIsLoadingData(true);
            const response = await fetch(`/api/stock/bundle/barcode/${barcode}`);
            const result = await response.json();

            if (result && result.data) {
                setRollData(result.data);
            } else {
                setRollData(null);
                toast({
                    title: "No Data",
                    description: "No data found for this barcode",
                    variant: "default",
                });
            }
        } catch (error) {
            console.error("Error fetching roll data:", error);
            setRollData(null);
            toast({
                title: "Error",
                description: "Failed to fetch roll data",
                variant: "destructive",
            });
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleBarcodeChange = (value: string) => {
        setSelectedBarcode(value);
        if (value) {
            // Find the selected barcode option to get the cutting_roll_id
            const selectedOption = barcodeOptions.find(option => option.cutting_barcode === value);
            setSelectedBarcodeData(selectedOption || null);
            fetchRollData(value);
        } else {
            setSelectedBarcodeData(null);
            setRollData(null);
        }
    };

    const handleSubmitComplete = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedBarcode || !rollData) {
            toast({
                title: "Missing selection",
                description: "Please select a barcode first",
                variant: "destructive",
            });
            return;
        }

        if (!bundleWeight || !noOfBags) {
            toast({
                title: "Missing information",
                description: "Please enter both Bundle Weight and No of Bags",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsSubmittingComplete(true);

            const response = await fetch('/api/stock/bundle/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bundle_type: rollData.bag_type,
                    complete_item_weight: bundleWeight,
                    complete_item_bags: noOfBags,
                    user_id: 1 // Default user ID
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Bundle item added successfully",
                });

                // Add the new item to the existing items
                if (result.item) {
                    setCompleteItems(prevItems => [result.item, ...prevItems]);
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
            setIsSubmittingComplete(false);
        }
    };

    const handleDeleteComplete = async (id: number) => {
        try {
            const response = await fetch(`/api/stock/bundle/complete/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Item deleted successfully",
                });

                // Remove the item from state
                setCompleteItems(prevItems => prevItems.filter(item => item.complete_item_id !== id));
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

    const handleSubmitNonComplete = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedBarcode || !rollData) {
            toast({
                title: "Missing selection",
                description: "Please select a barcode first",
                variant: "destructive",
            });
            return;
        }

        if (!nonCompleteWeight || !nonCompleteBags) {
            toast({
                title: "Missing information",
                description: "Please enter both Bundle Weight and No of Bags",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsSubmittingNonComplete(true);

            const response = await fetch('/api/stock/bundle/non-complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    non_complete_info: 1, // Default user ID
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

                // Add the new item to the existing items
                if (result.item) {
                    setNonCompleteItems(prevItems => [result.item, ...prevItems]);
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
            setIsSubmittingNonComplete(false);
        }
    };

    const handleDeleteNonComplete = async (id: number) => {
        try {
            const response = await fetch(`/api/stock/bundle/non-complete/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Non-complete item deleted successfully",
                });

                // Remove the item from state
                setNonCompleteItems(prevItems => prevItems.filter(item => item.non_complete_id !== id));
            } else {
                const result = await response.json();
                throw new Error(result.message || "Failed to delete non-complete item");
            }
        } catch (error) {
            console.error("Error deleting non-complete item:", error);
            toast({
                title: "Error",
                description: String(error),
                variant: "destructive",
            });
        }
    };

    const InfoBox = ({ label, value }: { label: string; value: string | number }) => (
        <div className="mb-4">
            <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
            <div className="text-lg font-semibold">{value || "-"}</div>
        </div>
    );

    const calculateTotals = () => {
        // Calculate total weight and bags from complete items
        const completeWeight = completeItems.reduce((total, item) =>
            total + parseFloat(item.complete_item_weight || "0"), 0);
        const completeBags = completeItems.reduce((total, item) =>
            total + parseInt(item.complete_item_bags || "0", 10), 0);

        // Calculate total weight and bags from non-complete items
        const nonCompleteWeight = nonCompleteItems.reduce((total, item) =>
            total + parseFloat(item.non_complete_weight || "0"), 0);
        const nonCompleteBags = nonCompleteItems.reduce((total, item) =>
            total + parseInt(item.non_complete_bags || "0", 10), 0);

        // Return the totals
        return {
            totalWeight: completeWeight + nonCompleteWeight,
            totalBags: completeBags + nonCompleteBags,
            completeWeight,
            completeBags,
            nonCompleteWeight,
            nonCompleteBags
        };
    };

    const handleCompleteBundleSubmit = async () => {
        if (!rollData || completeItems.length === 0) {
            toast({
                title: "Missing data",
                description: "Please add at least one complete item before finalizing the bundle",
                variant: "destructive",
            });
            return;
        }

        try {
            const totals = calculateTotals();

            // Calculate the average: (weight/bags) * 1000
            const average = totals.totalBags > 0
                ? ((totals.totalWeight / totals.totalBags) * 1000).toFixed(2)
                : "0";

            // Calculate wastage bags: 1000/average * cutting_wastage
            const wastage_weight = rollData.cutting_wastage || "0";
            const wastage_bags = average !== "0"
                ? ((1000 / parseFloat(average)) * parseFloat(wastage_weight)).toFixed(2)
                : "0";

            // Use the cutting_roll_id from the selected barcode
            const barcode = selectedBarcodeData?.cutting_roll_id || 0;

            const bundleData = {
                bundle_barcode: barcode,
                bundle_type: rollData.bag_type,
                bundle_qty: totals.totalBags,
                bundle_info_weight: totals.totalWeight.toString(),
                bundle_info_bags: totals.totalBags.toString(),
                bundle_info_average: average,
                bundle_slitt_wastage: rollData.slitting_wastage || "0",
                bundle_print_wastage: rollData.print_wastage || "0",
                bundle_cutting_wastage: rollData.cutting_wastage || "0",
                bundle_info_wastage_bags: wastage_bags,
                bundle_info_wastage_weight: wastage_weight,
                user_id: 1, // Default user ID
                bundle_info_status: 1 // Active status
            };

            // Get all item IDs to update later
            const completeItemIds = completeItems.map(item => item.complete_item_id);
            const nonCompleteItemIds = nonCompleteItems.map(item => item.non_complete_id);

            const response = await fetch('/api/stock/bundle/finalize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bundleData,
                    completeItemIds,
                    nonCompleteItemIds
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Bundle has been finalized successfully",
                });

                // Reset form and data
                setSelectedBarcode("");
                setRollData(null);
                setBundleWeight("");
                setNoOfBags("");
                setCompleteItems([]);
                setNonCompleteWeight("");
                setNonCompleteBags("");
                setNonCompleteItems([]);
            } else {
                throw new Error(result.message || "Failed to finalize bundle");
            }
        } catch (error) {
            console.error("Error finalizing bundle:", error);
            toast({
                title: "Error",
                description: String(error),
                variant: "destructive",
            });
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
                                    <BreadcrumbPage className="text-2xl font-bold">Add Bundle</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="p-6">
                    <Card className="shadow-md mb-6">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-600">
                                Select Cutting Roll Barcode
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-6">
                                <Label htmlFor="barcode-select" className="mb-2 block">Cutting Roll Barcode</Label>
                                <Select value={selectedBarcode} onValueChange={handleBarcodeChange}>
                                    <SelectTrigger id="barcode-select" className="w-full">
                                        <SelectValue placeholder="Select a barcode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {barcodeOptions.length > 0 ? (
                                            barcodeOptions.map((option) => (
                                                <SelectItem key={option.cutting_roll_id} value={option.cutting_barcode}>
                                                    {option.cutting_barcode}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-options" disabled>
                                                No barcodes available
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {isLoadingData ? (
                        <div className="flex justify-center py-12">
                            <Loading />
                        </div>
                    ) : rollData ? (
                        <Card className="shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-blue-600 flex items-center">
                                    <Info className="mr-2 h-5 w-5" />
                                    Roll Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InfoBox label="Bag Type" value={rollData.bag_type} />
                                <InfoBox label="Number of Bags" value={rollData.no_of_bags} />
                                <InfoBox label="Slitting Wastage" value={rollData.slitting_wastage} />
                                <InfoBox label="Printing Wastage" value={rollData.print_wastage} />
                                <InfoBox label="Cutting Wastage" value={rollData.cutting_wastage} />
                            </CardContent>
                        </Card>
                    ) : selectedBarcode ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>No data available for the selected barcode</p>
                        </div>
                    ) : null}

                    {selectedBarcode && rollData && (
                        <>
                            <Card className="shadow-md mt-6">
                                <CardHeader className="bg-slate-800 text-white">
                                    <CardTitle className="text-lg font-semibold">
                                        Complete Bundle
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <form onSubmit={handleSubmitComplete}>
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
                                            disabled={isSubmittingComplete}
                                        >
                                            {isSubmittingComplete ? "Adding..." : "Add"}
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
                                                                    onClick={() => handleDeleteComplete(item.complete_item_id)}
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

                            {/* Non-Complete Bundle Card */}
                            <Card className="shadow-md mt-6">
                                <CardHeader className="bg-amber-700 text-white">
                                    <CardTitle className="text-lg font-semibold">
                                        Non-Complete Bundle
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <form onSubmit={handleSubmitNonComplete}>
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
                                            disabled={isSubmittingNonComplete}
                                        >
                                            {isSubmittingNonComplete ? "Adding..." : "Add"}
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
                                                                    onClick={() => handleDeleteNonComplete(item.non_complete_id)}
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

                            {/* Finalize Bundle Button */}
                            {(completeItems.length > 0 || nonCompleteItems.length > 0) && (
                                <div className="mt-6 flex justify-center">
                                    <Button
                                        onClick={handleCompleteBundleSubmit}
                                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
                                    >
                                        Finalize Bundle
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}