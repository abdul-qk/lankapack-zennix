"use client";

import * as React from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Loading from "@/components/layouts/loading";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

// Import custom components
import BundleInfoCard from "../../../../components/BundleInfoCard";
import BarcodeSelectionCard from "../../../..//components/BarcodeSelectionCard";
import RollInfoCard from "../../../..//components/RollInfoCard";
import CompleteBundleCard from "../../../../components/CompleteBundleCard";
import NonCompleteBundleCard from "../../../../components/NonCompleteBundleCard";
import BundleSummaryCard from "../../../../components/BundleSummaryCard";

// Import types
import {
    BarcodeOption,
    RollData,
    CompleteItem,
    NonCompleteItem,
    BundleData
} from "../../../../types/bundleTypes";

export default function EditBundlePage() {
    const router = useRouter();
    const params = useParams();
    const bundleId = params.id as string;

    // Main loading states
    const [loading, setLoading] = React.useState(true);
    const [isLoadingData, setIsLoadingData] = React.useState(false);
    const [isUpdating, setIsUpdating] = React.useState(false);

    // Data states
    const [bundleData, setBundleData] = React.useState<BundleData | null>(null);
    const [barcodeOptions, setBarcodeOptions] = React.useState<BarcodeOption[]>([]);
    const [selectedBarcode, setSelectedBarcode] = React.useState<string>("");
    const [selectedBarcodeData, setSelectedBarcodeData] = React.useState<BarcodeOption | null>(null);
    const [rollData, setRollData] = React.useState<RollData | null>(null);

    // Items states
    const [completeItems, setCompleteItems] = React.useState<CompleteItem[]>([]);
    const [nonCompleteItems, setNonCompleteItems] = React.useState<NonCompleteItem[]>([]);

    const { toast } = useToast();

    // Initialize data on component mount
    React.useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                await Promise.all([
                    fetchBundleData(),
                    fetchBarcodes()
                ]);
            } catch (error) {
                console.error("Error loading initial data:", error);
                toast({
                    title: "Error",
                    description: "Failed to load page data",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        if (bundleId) {
            loadInitialData();
        }
    }, [bundleId]);

    // Fetch bundle data
    const fetchBundleData = async () => {
        try {
            const response = await fetch(`/api/stock/bundle/${bundleId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch bundle data');
            }
            
            const data = await response.json();
            console.log(data);

            if (data && data.bundle) {
                setBundleData(data.bundle);

                // Set barcode from bundle data
                setSelectedBarcode(data.bundle.cutting_roll.cutting_barcode);

                // Find matching barcode option and set selected data
                const barcode = data.bundle.bundle_barcode;
                await fetchRollData(barcode);

                // Fetch associated items
                await fetchCompleteItems();
                await fetchNonCompleteItems();
            }
        } catch (error) {
            console.error("Error fetching bundle data:", error);
            toast({
                title: "Error",
                description: "Failed to fetch bundle data",
                variant: "destructive",
            });
        }
    };

    // Fetch complete items
    const fetchCompleteItems = async () => {
        try {
            const response = await fetch(`/api/stock/bundle/complete/${bundleId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch complete items');
            }

            const data = await response.json();

            if (data && data.items) {
                setCompleteItems(data.items);
            }
        } catch (error) {
            console.error("Error fetching complete items:", error);
            toast({
                title: "Error",
                description: "Failed to fetch complete items",
                variant: "destructive",
            });
        }
    };

    // Fetch non-complete items
    const fetchNonCompleteItems = async () => {
        try {
            const response = await fetch(`/api/stock/bundle/non-complete/${bundleId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch non-complete items');
            }

            const data = await response.json();

            if (data && data.items) {
                setNonCompleteItems(data.items);
            }
        } catch (error) {
            console.error("Error fetching non-complete items:", error);
            toast({
                title: "Error",
                description: "Failed to fetch non-complete items",
                variant: "destructive",
            });
        }
    };

    // Fetch all available barcodes
    const fetchBarcodes = async () => {
        try {
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
        }
    };

    // Fetch roll data for selected barcode
    const fetchRollData = async (barcode: string) => {
        try {
            setIsLoadingData(true);
            const response = await fetch(`/api/stock/bundle/cutting_roll/${barcode}`);
            const result = await response.json();

            if (result && result.data) {
                setRollData(result.data);

                // Find and set the selected barcode data
                const selectedOption = barcodeOptions.find(option => option.cutting_barcode === barcode);
                if (selectedOption) {
                    setSelectedBarcodeData(selectedOption);
                }
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

    // Fetch roll data for changed barcode
    const fetchNewRollData = async (barcode: string) => {
        try {
            setIsLoadingData(true);
            const response = await fetch(`/api/stock/bundle/roll_data/${barcode}`);
            const result = await response.json();

            if (result && result.data) {
                setRollData(result.data);

                // Find and set the selected barcode data
                const selectedOption = barcodeOptions.find(option => option.cutting_barcode === barcode);
                if (selectedOption) {
                    setSelectedBarcodeData(selectedOption);
                }
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

    // Handle barcode selection change
    const handleBarcodeChange = (value: string) => {
        setSelectedBarcode(value);
        console.log(value);
        if (value) {
            const selectedOption = barcodeOptions.find(option => option.cutting_barcode === value);
            console.log("Selected option:", selectedOption);
            setSelectedBarcodeData(selectedOption || null);
            fetchNewRollData(value);
        } else {
            setSelectedBarcodeData(null);
            setRollData(null);
        }
    };

    // Calculate totals for complete and non-complete items
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

    // Update bundle with current data
    const handleUpdateBundle = async () => {
        if (!rollData || !bundleData) {
            toast({
                title: "Missing data",
                description: "Cannot update bundle without required data",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsUpdating(true);
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

            // Create updated bundle data
            const updatedBundleData = {
                bundle_info_id: parseInt(bundleId),
                bundle_barcode: selectedBarcodeData?.cutting_roll_id.toString() || bundleData.bundle_barcode,
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
                bundle_info_status: bundleData.bundle_info_status // Keep existing status
            };

            // Get all item IDs
            const completeItemIds = completeItems.map(item => item.complete_item_id);
            const nonCompleteItemIds = nonCompleteItems.map(item => item.non_complete_id);

            const response = await fetch('/api/stock/bundle/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bundleData: updatedBundleData,
                    completeItemIds,
                    nonCompleteItemIds
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Bundle has been updated successfully",
                });

                // Update the bundle data state
                setBundleData(updatedBundleData);

                // Redirect to bundle list after successful update
                setTimeout(() => {
                    router.push('/stock/bundles');
                }, 1500);
            } else {
                throw new Error(result.message || "Failed to update bundle");
            }
        } catch (error) {
            console.error("Error updating bundle:", error);
            toast({
                title: "Error",
                description: String(error),
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle adding a complete item
    const handleAddCompleteItem = (newItem: CompleteItem) => {
        setCompleteItems(prevItems => [newItem, ...prevItems]);
    };

    // Handle deleting a complete item
    const handleDeleteCompleteItem = (itemId: number) => {
        setCompleteItems(prevItems => prevItems.filter(item => item.complete_item_id !== itemId));
    };

    // Handle adding a non-complete item
    const handleAddNonCompleteItem = (newItem: NonCompleteItem) => {
        setNonCompleteItems(prevItems => [newItem, ...prevItems]);
    };

    // Handle deleting a non-complete item
    const handleDeleteNonCompleteItem = (itemId: number) => {
        setNonCompleteItems(prevItems => prevItems.filter(item => item.non_complete_id !== itemId));
    };

    // Show loading spinner while data is being fetched
    if (loading) {
        return <Loading />;
    }

    // Show error message if bundle data could not be loaded
    if (!bundleData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="text-xl text-red-600 mb-4">Bundle not found</div>
                <Button
                    onClick={() => router.push('/stock/bundles')}
                    className="flex items-center"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Bundles
                </Button>
            </div>
        );
    }

    const totals = calculateTotals();

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
                                    <BreadcrumbPage className="text-2xl font-bold">Edit Bundle #{bundleId}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="p-6">
                    {/* Bundle Information Card */}
                    <BundleInfoCard
                        bundleData={bundleData}
                        rollData={rollData}
                        selectedBarcode={selectedBarcode}
                        barcodeOptions={barcodeOptions}
                        onBarcodeChange={handleBarcodeChange}
                    />

                    {/* Roll Information Card */}
                    {/* <RollInfoCard
                        isLoading={isLoadingData}
                        rollData={rollData}
                        selectedBarcode={selectedBarcode}
                    /> */}

                    {selectedBarcode && rollData && (
                        <>
                            {/* Complete Bundle Section */}
                            <CompleteBundleCard
                                bundleId={bundleId}
                                rollData={rollData}
                                completeItems={completeItems}
                                onAddItem={handleAddCompleteItem}
                                onDeleteItem={handleDeleteCompleteItem}
                            />

                            {/* Non-Complete Bundle Card */}
                            <NonCompleteBundleCard
                                bundleId={bundleId}
                                rollData={rollData}
                                bundleType={bundleData.bundle_type}
                                nonCompleteItems={nonCompleteItems}
                                onAddItem={handleAddNonCompleteItem}
                                onDeleteItem={handleDeleteNonCompleteItem}
                            />

                            {/* Bundle Summary */}
                            {/* <BundleSummaryCard
                                totals={totals}
                                onUpdateBundle={handleUpdateBundle}
                                isUpdating={isUpdating}
                                showUpdateButton={completeItems.length > 0 || nonCompleteItems.length > 0}
                            /> */}

                            {/* Navigation */}
                            {/* <div className="mt-6 flex justify-end">
                                <Button
                                    onClick={() => router.push('/stock/bundles')}
                                    variant="outline"
                                    className="mr-2"
                                >
                                    Back to Bundles
                                </Button>
                            </div> */}
                        </>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}