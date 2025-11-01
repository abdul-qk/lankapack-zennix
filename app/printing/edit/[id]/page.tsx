"use client";

import * as React from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "next/navigation";
import Loading from "@/components/layouts/loading";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScanBarcode, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

interface CustomerInfo {
    customer_id: number;
    customer_full_name: string;
}

interface ParticularInfo {
    particular_id: number;
    particular_name: string;
}

interface PrintSizeInfo {
    print_size: string;
    print_size_id: number;
}

interface JobCardData {
    job_card_id: number;
    customer_id: number;
    section_list: string;
    unit_price: string;
    slitting_roll_type: string;
    slitting_paper_gsm: string;
    slitting_paper_size: number;
    slitting_size: string;
    slitting_remark: string;
    printing_size: string;
    printing_color_type: string;
    printing_color_name: string;
    formattedColorNames: string;
    printing_no_of_bag: string;
    printing_remark: string;
    block_size: string;
    cutting_type: string;
    cutting_bags_select: string;
    cutting_bag_type: string;
    cutting_print_name: string;
    cuting_no_of_bag: string;
    cuting_remark: string;
    cutting_fold: string;
    add_date: string;
    updated_date: string;
    delivery_date: string;
    user_id: number;
    card_slitting: number;
    card_printting: number;
    card_cutting: number;
    del_ind: number;
    customer: CustomerInfo;
    particular: ParticularInfo;
    print_size: PrintSizeInfo;
}

interface PrintingInfo {
    print_id: number;
    job_card_id: number;
    added_date: string;
    balance_weight: number;
    balance_width: string;
    print_wastage: string;
    print_barcode_no: string;
    net_weight: string;
}

interface PrintingPackInfo {
    pack_id: number;
    job_card_id: number;
    print_id: number;
    print_pack_weight: string;
    add_date: string;
    print_barcode: string;
}

const ReactBarcode = dynamic(() => import('react-barcode'), { ssr: false });

export default function EditPrintingInfo() {
    const params = useParams();
    const id = params?.id;

    const [loading, setLoading] = React.useState(true);
    const [barcode, setBarcode] = React.useState("");
    const [selectedBarcode, setSelectedBarcode] = React.useState<string>("");
    const [data, setData] = React.useState<JobCardData>();
    const [printingData, setPrintingData] = React.useState<PrintingInfo[]>();
    const [printingPackData, setPrintingPackData] = React.useState<PrintingPackInfo[]>();
    const [colorNames, setColorNames] = React.useState<string[]>([]);
    const { toast } = useToast();

    // Selection and form state
    const [selectedPrintId, setSelectedPrintId] = React.useState<number | null>(null);
    const [rollWeight, setRollWeight] = React.useState("");
    const [balanceWeight, setBalanceWeight] = React.useState("");
    const [balanceWidth, setBalanceWidth] = React.useState("");
    const [printWastage, setPrintWastage] = React.useState("");

    React.useEffect(() => {
        if (id) fetchData(Number(id));
    }, [id]);

    const fetchData = async (id: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/printing/${id}`);
            const data = await response.json();
            if (data) {
                setData(data);
                setPrintingData(data.printingData);
                setPrintingPackData(data.printingPackData)
            }

            var color_names = data.data.printing_color_name.split(',');
            console.log(color_names);
            for (let i = 0; i < color_names.length; i++) {
                if (color_names[i] == '' || color_names[i] != 0) {
                    fetchColorData(color_names[i]);
                    console.log(color_names[i]);
                }
            }

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchColorData = async (id: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/job/color/${id}`);
            const data = await response.json();
            if (data || data.data != null) {
                // Append colorNames to the array
                colorNames.push(data.data.colour_name);
            }
            console.log(colorNames);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBarcode = async () => {
        if (!barcode) {
            toast({
                title: "Error",
                description: "Please enter a barcode",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/printing/${id}/add-barcode`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ roll_barcode_no: barcode }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle different error types based on status codes
                if (response.status === 404) {
                    toast({
                        title: "Error",
                        description: "Barcode not found in stock or unavailable",
                        variant: "destructive",
                    });
                } else if (response.status === 400) {
                    toast({
                        title: "Error",
                        description: data.error || "Invalid barcode format",
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Error",
                        description: data.error || "Failed to add barcode",
                        variant: "destructive",
                    });
                }
            } else {
                // Success case
                toast({
                    title: "Success",
                    description: "Roll added successfully",
                });

                // Refresh data
                fetchData(Number(id));

                // Clear the barcode input
                setBarcode("");
            }
        } catch (error) {
            console.error("Error adding roll:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBarcode = async (printId: number) => {
        // Confirm deletion with user
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this print record? This action cannot be undone."
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/printing/${id}/add-barcode`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ print_id: printId }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle error responses
                toast({
                    title: "Error",
                    description: data.error || "Failed to delete print record",
                    variant: "destructive",
                });
            } else {
                // Success case
                toast({
                    title: "Success",
                    description: "Print record deleted successfully",
                });

                // Refresh data
                fetchData(Number(id));

                // Clear selection if the deleted item was selected
                if (selectedPrintId === printId) {
                    setSelectedPrintId(null);
                    clearFormFields();
                }
            }
        } catch (error) {
            console.error("Error deleting print record:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePrintPack = async (packId: number) => {
        // Confirm deletion with user
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this print pack record? This action cannot be undone."
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/printing/${id}/delete-pack`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ pack_id: packId }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle error responses
                toast({
                    title: "Error",
                    description: data.error || "Failed to delete print pack record",
                    variant: "destructive",
                });
            } else {
                // Success case
                toast({
                    title: "Success",
                    description: "Print pack record deleted successfully",
                });

                // Refresh data
                fetchData(Number(id));
            }
        } catch (error) {
            console.error("Error deleting print pack record:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to handle selecting a print record
    const handleSelectPrint = (printId: number, barcode: string) => {
        // If clicking the same record, deselect it
        if (printId === selectedPrintId) {
            setSelectedPrintId(null);
            clearFormFields();
            return;
        }

        setSelectedPrintId(printId);
        setSelectedBarcode(barcode);

        // Find the selected print record
        const selectedRecord = printingData?.find(item => item.print_id === printId);

        // If found, populate the form fields with current values
        if (selectedRecord) {
            setBalanceWeight(selectedRecord.balance_weight?.toString() || "");
            setBalanceWidth(selectedRecord.balance_width || "");
            setPrintWastage(selectedRecord.print_wastage || "");
        }
    };

    // Function to add print pack
    const handleAddPrintPack = async () => {
        if (!selectedPrintId) {
            toast({
                title: "Error",
                description: "Please select a print record first",
                variant: "destructive",
            });
            return;
        }

        if (!rollWeight) {
            toast({
                title: "Error",
                description: "Roll weight is required",
                variant: "destructive",
            });
            return;
        }

        // Validate that rollWeight contains only numbers
        if (!/^\d*\.?\d*$/.test(rollWeight)) {
            toast({
                title: "Error",
                description: "Roll weight must be a number",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/printing/${id}/add-pack`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    print_id: selectedPrintId,
                    print_pack_weight: rollWeight,
                    selectedBarcode: selectedBarcode
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast({
                    title: "Error",
                    description: data.error || "Failed to add print pack",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Success",
                    description: "Print pack added successfully",
                });

                // Clear the form field
                setRollWeight("");

                // Refresh data
                fetchData(Number(id));
            }
        } catch (error) {
            console.error("Error adding print pack:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to update print record and add print wastage
    const handleUpdatePrintWastage = async () => {
        if (!selectedPrintId) {
            toast({
                title: "Error",
                description: "Please select a print record first",
                variant: "destructive",
            });
            return;
        }

        if (!balanceWeight || !balanceWidth || !printWastage) {
            toast({
                title: "Error",
                description: "All fields are required",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/printing/${id}/update-wastage`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    print_id: selectedPrintId,
                    balance_weight: balanceWeight,
                    balance_width: balanceWidth,
                    print_wastage: printWastage
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast({
                    title: "Error",
                    description: data.error || "Failed to update print record and add wastage",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Success",
                    description: "Print record updated and wastage added successfully",
                });

                // Clear the form fields
                setBalanceWeight("");
                setBalanceWidth("");
                setPrintWastage("");

                // Refresh data
                fetchData(Number(id));
            }
        } catch (error) {
            console.error("Error updating print record and adding wastage:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper function to clear form fields
    const clearFormFields = () => {
        setRollWeight("");
        setBalanceWeight("");
        setBalanceWidth("");
        setPrintWastage("");
    };

    const formatDate = (dateString: string) => {
        if (dateString === "0000-00-00") return "Not Set";
        if (!dateString) return "Not Available";
        return new Date(dateString).toLocaleDateString();
    };

    const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
        <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm font-medium text-gray-600">{label}</span>
            <span className="text-sm text-gray-900">{value || "Not specified"}</span>
        </div>
    );

    const handleComplete = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/printing/${id}/complete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                toast({
                    title: "Error",
                    description: data.error || "Failed to mark as completed",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Success",
                    description: "Printing process marked as completed",
                });
                fetchData(Number(id));
                // Go to printing page
                window.location.href = `/printing`;
            }
        } catch (error) {
            console.error("Error completing printing:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) { return <Loading /> }

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
                                    <BreadcrumbPage className="text-2xl font-bold">Edit Printing #{id}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">

                    {/* General Information Card */}
                    <Card className="shadow-md col-span-3">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-600">
                                General Information
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                <InfoRow label="Job Card ID" value={data.job_card_id} />
                                <InfoRow label="Customer" value={data.customer.customer_full_name} />
                                <InfoRow label="Roll Type" value={data.particular.particular_name} />
                                <InfoRow label="Unit Price" value={data.unit_price || "Not specified"} />
                                <InfoRow label="Add Date" value={formatDate(data.add_date)} />
                                <InfoRow label="Updated Date" value={formatDate(data.updated_date)} />
                                <InfoRow label="Delivery Date" value={formatDate(data.delivery_date)} />
                                <InfoRow label="Paper GSM" value={data.slitting_paper_gsm} />
                                <InfoRow label="Paper Size" value={data.slitting_paper_size} />
                            </CardContent>
                        )}
                    </Card>

                    {/* Printing Card */}
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-green-600">
                                Printing Information
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                <InfoRow label="Cylinder Size" value={data.print_size.print_size || "Not specified"} />
                                <InfoRow label="Numbar Of Bags" value={data.printing_no_of_bag || "Not specified"} />
                                <InfoRow label="Color type" value={data.printing_color_type + " Colour(s)" || "Not specified"} />
                                <InfoRow label="Color" value={data.formattedColorNames || "Not specified"} />
                                <InfoRow label="Block Size" value={data.block_size || "Not specified"} />
                                <InfoRow label="Remark" value={data.printing_remark || "Not specified"} />
                            </CardContent>
                        )}
                    </Card>

                    {/* Printing Balance Card */}
                    <Card className="shadow-md col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-purple-600">
                                Printing Balance
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Barcode
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={barcode}
                                            onChange={(e) => setBarcode(e.target.value)}
                                            type="text"
                                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                                        />
                                        <Button onClick={handleAddBarcode}>Add</Button>
                                    </div>
                                </div>
                                {/* Table with Printing Data */}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Barcode</TableHead>
                                            <TableHead>Weight</TableHead>
                                            <TableHead>Balance Weight</TableHead>
                                            <TableHead>Balance Width</TableHead>
                                            <TableHead>Printing Wastage</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {printingData && printingData.map((item, index) => (
                                            <TableRow
                                                key={item.print_id}
                                                className={selectedPrintId === item.print_id ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-gray-100"}
                                                onClick={() => handleSelectPrint(item.print_id, item.print_barcode_no)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        {selectedPrintId === item.print_id && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                                        )}
                                                        {item.print_barcode_no}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.net_weight}</TableCell>
                                                <TableCell>{item.balance_weight}</TableCell>
                                                <TableCell>{item.balance_width}</TableCell>
                                                <TableCell>{item.print_wastage}</TableCell>
                                                <TableCell>
                                                    <Trash2
                                                        className="cursor-pointer"
                                                        color="red"
                                                        size={16}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent row selection when deleting
                                                            handleDeleteBarcode(item.print_id);
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell className="font-semibold">Total</TableCell>
                                            <TableCell className="font-semibold">
                                                {printingData?.reduce((sum, item) => sum + (parseFloat(item.net_weight) || 0), 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {printingData?.reduce((sum, item) => sum + (Number(item.balance_weight) || 0), 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {printingData?.reduce((sum, item) => sum + (parseFloat(item.balance_width) || 0), 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {printingData?.reduce((sum, item) => sum + (parseFloat(item.print_wastage) || 0), 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </CardContent>
                        )}
                    </Card>

                    {/* Printing Pack Information Card */}
                    <Card className="shadow-md col-span-3">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-blue-600">
                                Printing Pack Information
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                {/* Add input forms only if a print record is selected */}
                                {printingData && printingData.length > 0 && (
                                    <div className="mb-4 p-4 border rounded-md bg-gray-50">
                                        <div className="mb-2 text-sm font-medium text-gray-700">
                                            {selectedPrintId
                                                ? `Selected barcode: ${printingData.find(item => item.print_id === selectedPrintId)?.print_barcode_no}`
                                                : "Select a barcode from the table above to add information"}
                                        </div>

                                        {/* Roll Weight form */}
                                        <div className="mb-4">
                                            <h3 className="text-md font-medium text-gray-800 mb-2">Add Roll Weight</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Roll Weight
                                                    </label>
                                                    <input
                                                        value={rollWeight}
                                                        onChange={(e) => setRollWeight(e.target.value)}
                                                        type="text"
                                                        disabled={!selectedPrintId}
                                                        className="p-2 border border-gray-300 rounded-md w-full"
                                                        placeholder="Enter roll weight"
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <Button
                                                        onClick={handleAddPrintPack}
                                                        disabled={!selectedPrintId}
                                                        className="w-full"
                                                    >
                                                        Add Roll Weight
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Print Wastage form */}
                                        <div>
                                            <h3 className="text-md font-medium text-gray-800 mb-2">Update Print Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Balance Weight
                                                    </label>
                                                    <input
                                                        value={balanceWeight}
                                                        onChange={(e) => setBalanceWeight(e.target.value)}
                                                        type="text"
                                                        disabled={!selectedPrintId}
                                                        className="p-2 border border-gray-300 rounded-md w-full"
                                                        placeholder="Enter balance weight"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Balance Width
                                                    </label>
                                                    <input
                                                        value={balanceWidth}
                                                        onChange={(e) => setBalanceWidth(e.target.value)}
                                                        type="text"
                                                        disabled={!selectedPrintId}
                                                        className="p-2 border border-gray-300 rounded-md w-full"
                                                        placeholder="Enter balance width"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Print Wastage
                                                    </label>
                                                    <input
                                                        value={printWastage}
                                                        onChange={(e) => setPrintWastage(e.target.value)}
                                                        type="text"
                                                        disabled={!selectedPrintId}
                                                        className="p-2 border border-gray-300 rounded-md w-full"
                                                        placeholder="Enter print wastage"
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <Button
                                                        onClick={handleUpdatePrintWastage}
                                                        disabled={!selectedPrintId}
                                                        className="w-full"
                                                    >
                                                        Update Print Info
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Weight</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {printingPackData && printingPackData.map((item, index) => (
                                                <TableRow key={item.pack_id}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>{item.print_pack_weight}</TableCell>
                                                    <TableCell>{new Date(item.add_date).toLocaleString('en-UK', { dateStyle: 'short' })}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-4 items-center">
                                                            <Dialog>
                                                                <DialogTrigger>
                                                                    <ScanBarcode size={20} />
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogTitle>Barcode</DialogTitle>
                                                                    <hr />
                                                                    <DialogHeader className="flex flex-col items-center space-y-4">
                                                                        {/* Barcode at the top */}
                                                                        <div className="w-full flex justify-center my-4">
                                                                            <ReactBarcode value={item.print_barcode || "N/A"} />
                                                                        </div>

                                                                        {/* Vertical layout for data */}
                                                                        <div className="w-full">
                                                                            <div className="grid grid-cols-2 gap-2 w-full">

                                                                                <div className="font-semibold bg-gray-100 p-2 rounded-l">Printting Pack No</div>
                                                                                <div className="p-2 border rounded-r">{item.pack_id}</div>

                                                                                <div className="font-semibold bg-gray-100 p-2 rounded-l">Job Card No</div>
                                                                                <div className="p-2 border rounded-r">{item.job_card_id}</div>

                                                                                <div className="font-semibold bg-gray-100 p-2 rounded-l">Printing No</div>
                                                                                <div className="p-2 border rounded-r">{item.print_id}</div>

                                                                                <div className="font-semibold bg-gray-100 p-2 rounded-l">Printing Pack Weight</div>
                                                                                <div className="p-2 border rounded-r">{item.print_pack_weight}</div>
                                                                            </div>
                                                                        </div>
                                                                    </DialogHeader>
                                                                </DialogContent>
                                                            </Dialog>
                                                            <Trash2
                                                                className="cursor-pointer"
                                                                color="red"
                                                                size={20}
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevent row selection when deleting
                                                                    handleDeletePrintPack(item.pack_id);
                                                                }}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow>
                                                <TableCell className="font-semibold">Total</TableCell>
                                                <TableCell className="font-semibold">
                                                    {printingPackData?.reduce((sum, item) => sum + (parseFloat(item.print_pack_weight) || 0), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell colSpan={3}></TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                    <div className="fixed bottom-6 right-6">
                        <Button
                            onClick={handleComplete}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={data?.card_slitting === 1}
                        >
                            {data?.card_slitting === 1 ? "Completed" : "Complete"}
                        </Button>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};