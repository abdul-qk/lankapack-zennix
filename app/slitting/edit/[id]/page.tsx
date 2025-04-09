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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScanBarcode, Trash, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";

const ReactBarcode = dynamic(() => import('react-barcode'), { ssr: false });

interface CustomerInfo {
    customer_id: number;
    customer_full_name: string;
}

interface ParticularInfo {
    particular_id: number;
    particular_name: string;
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
}

interface SlittingInfo {
    slitting_id: number;
    job_card_id: number;
    added_date: string;
    number_of_roll: number;
    roll_barcode_no: string;
    wastage: string;
    wastage_width: string;
}

interface SlittingRollInfo {
    roll_id: number;
    slitting_barcode: string;
    slitting_id: number;
    slitting_roll_weight: string;
    slitting_roll_width: string;
    add_date: string
    job_card_id: number
}

export default function EditSlittingInfo() {
    const params = useParams();
    const id = params.id;
    const [barcode, setBarcode] = React.useState("");
    const [rollWeight, setRollWeight] = React.useState("");
    const [rollWidth, setRollWidth] = React.useState("");
    const [selectedSlittingId, setSelectedSlittingId] = React.useState<number | null>(null);
    const [wastageWeight, setWastageWeight] = React.useState("");
    const [wastageWidth, setWastageWidth] = React.useState("");

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<JobCardData>();
    const [slittingData, setSlittingData] = React.useState<SlittingInfo[]>();
    const [slittingRollData, setSlittingRollData] = React.useState<SlittingRollInfo[]>();
    const { toast } = useToast();

    React.useEffect(() => {
        if (id) fetchData(Number(id));
    }, [id]);

    const fetchData = async (id: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/slitting/${id}`);
            const data = await response.json();
            if (data) {
                setData(data.data);
                setSlittingData(data.slittingData);
                setSlittingRollData(data.slittingRollData)
            }
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
            const response = await fetch(`/api/slitting/${id}/add-barcode`, {
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

    const handleAddSlittingRoll = async () => {
        if (!selectedSlittingId) {
            toast({
                title: "Error",
                description: "Please select a barcode first",
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

        if (!rollWidth) {
            toast({
                title: "Error",
                description: "Roll width is required",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/slitting/${id}/add-roll`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    slitting_id: selectedSlittingId,
                    slitting_roll_weight: rollWeight,
                    slitting_roll_width: rollWidth,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast({
                    title: "Error",
                    description: data.error || "Failed to add slitting roll",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Success",
                    description: "Slitting roll added successfully",
                });

                // Clear the input fields
                setRollWeight("");
                setRollWidth("");

                // Refresh data
                fetchData(Number(id));
            }
        } catch (error) {
            console.error("Error adding slitting roll:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateWastage = async () => {
        if (!selectedSlittingId) {
            toast({
                title: "Error",
                description: "Please select a barcode first",
                variant: "destructive",
            });
            return;
        }

        if (!wastageWeight) {
            toast({
                title: "Error",
                description: "Wastage weight is required",
                variant: "destructive",
            });
            return;
        }

        if (!wastageWidth) {
            toast({
                title: "Error",
                description: "Wastage width is required",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/slitting/${id}/update-wastage`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    slitting_id: selectedSlittingId,
                    wastage: wastageWeight,
                    wastage_width: wastageWidth,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast({
                    title: "Error",
                    description: data.error || "Failed to update wastage information",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Success",
                    description: "Wastage information updated successfully",
                });

                // Clear the input fields
                setWastageWeight("");
                setWastageWidth("");

                // Refresh data
                fetchData(Number(id));
            }
        } catch (error) {
            console.error("Error updating wastage information:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Add a function to handle selecting a slitting record
    const handleSelectSlitting = (slittingId: number) => {
        // If clicking the same record, deselect it
        if (slittingId === selectedSlittingId) {
            setSelectedSlittingId(null);
            setWastageWeight("");
            setWastageWidth("");
            return;
        }

        setSelectedSlittingId(slittingId);

        // Find the selected slitting record
        const selectedRecord = slittingData?.find(item => item.slitting_id === slittingId);

        // If found, populate the wastage fields with current values
        if (selectedRecord) {
            setWastageWeight(selectedRecord.wastage || "");
            setWastageWidth(selectedRecord.wastage_width || "");
        }
    };

    const handleDeleteRoll = async (rollId: number) => {
        // Confirm deletion with user
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this roll? This action cannot be undone."
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/slitting/${id}/delete-roll`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ roll_id: rollId }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle error responses
                toast({
                    title: "Error",
                    description: data.error || "Failed to delete roll",
                    variant: "destructive",
                });
            } else {
                // Success case
                toast({
                    title: "Success",
                    description: "Roll deleted successfully",
                });

                // Refresh data
                fetchData(Number(id));
            }
        } catch (error) {
            console.error("Error deleting roll:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
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

    const handleDeleteBarcode = async (slittingId: number) => {
        // Confirm deletion with user
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this roll? This action cannot be undone."
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/slitting/${id}/add-barcode`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ slitting_id: slittingId }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle error responses
                toast({
                    title: "Error",
                    description: data.error || "Failed to delete roll",
                    variant: "destructive",
                });
            } else {
                // Success case
                toast({
                    title: "Success",
                    description: "Roll deleted successfully",
                });

                // Refresh data
                fetchData(Number(id));
            }
        } catch (error) {
            console.error("Error deleting roll:", error);
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
                                    <BreadcrumbPage className="text-2xl font-bold">Edit Slitting #{id}</BreadcrumbPage>
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

                    {/* Slitting Information Card */}
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-green-600">
                                Slitting Information
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                {/* <InfoRow label="Roll Type" value={data.slitting_roll_type} /> */}
                                <InfoRow label="Slitting Size" value={data.slitting_size || "Not specified"} />
                                <InfoRow label="Remark" value={data.slitting_remark || "Not specified"} />
                            </CardContent>
                        )}
                    </Card>

                    {/* Printing Information Card */}
                    <Card className="shadow-md col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-purple-600">
                                Slitting Wastage
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                {/* Table with Slitting Data */}
                                {/* Add an input box with label Barcdoe */}
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
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Barcode</TableHead>
                                            {/* <TableHead>Weight</TableHead> */}
                                            <TableHead>Wastage Weight</TableHead>
                                            <TableHead>Wastage Width</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {slittingData && slittingData.map((item, index) => (
                                            <TableRow
                                                key={item.slitting_id}
                                                className={selectedSlittingId === item.slitting_id ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-gray-100"}
                                                onClick={() => handleSelectSlitting(item.slitting_id)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        {selectedSlittingId === item.slitting_id && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                                        )}
                                                        {item.roll_barcode_no}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.wastage}</TableCell>
                                                <TableCell>{item.wastage_width}</TableCell>
                                                <TableCell>
                                                    <Trash2
                                                        className="cursor-pointer"
                                                        color="red"
                                                        size={16}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent row selection when deleting
                                                            handleDeleteBarcode(item.slitting_id);
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        )}
                    </Card>

                    {/* Cutting Information Card */}
                    <Card className="shadow-md col-span-3">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-blue-600">
                                Slitting Roll Info
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                {/* Add Roll and Wastage Forms - Only show if there are slitting records */}
                                {slittingData && slittingData.length > 0 && (
                                    <div className="mb-4 p-4 border rounded-md bg-gray-50">
                                        <div className="mb-2 text-sm font-medium text-gray-700">
                                            {selectedSlittingId
                                                ? `Selected barcode: ${slittingData.find(item => item.slitting_id === selectedSlittingId)?.roll_barcode_no}`
                                                : "Select a barcode from the table above to add information"}
                                        </div>

                                        {/* Roll information form */}
                                        <div className="mb-4">
                                            <h3 className="text-md font-medium text-gray-800 mb-2">Add Roll Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Roll Weight
                                                    </label>
                                                    <input
                                                        value={rollWeight}
                                                        onChange={(e) => setRollWeight(e.target.value)}
                                                        type="text"
                                                        disabled={!selectedSlittingId}
                                                        className="p-2 border border-gray-300 rounded-md w-full"
                                                        placeholder="Enter weight"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Roll Width
                                                    </label>
                                                    <input
                                                        value={rollWidth}
                                                        onChange={(e) => setRollWidth(e.target.value)}
                                                        type="text"
                                                        disabled={!selectedSlittingId}
                                                        className="p-2 border border-gray-300 rounded-md w-full"
                                                        placeholder="Enter width"
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <Button
                                                        onClick={handleAddSlittingRoll}
                                                        disabled={!selectedSlittingId}
                                                        className="w-full"
                                                    >
                                                        Add Roll
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Wastage information form */}
                                        <div>
                                            <h3 className="text-md font-medium text-gray-800 mb-2">Update Wastage Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Wastage Weight
                                                    </label>
                                                    <input
                                                        value={wastageWeight}
                                                        onChange={(e) => setWastageWeight(e.target.value)}
                                                        type="text"
                                                        disabled={!selectedSlittingId}
                                                        className="p-2 border border-gray-300 rounded-md w-full"
                                                        placeholder="Enter wastage weight"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Wastage Width
                                                    </label>
                                                    <input
                                                        value={wastageWidth}
                                                        onChange={(e) => setWastageWidth(e.target.value)}
                                                        type="text"
                                                        disabled={!selectedSlittingId}
                                                        className="p-2 border border-gray-300 rounded-md w-full"
                                                        placeholder="Enter wastage width"
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <Button
                                                        onClick={handleUpdateWastage}
                                                        disabled={!selectedSlittingId}
                                                        className="w-full"
                                                    >
                                                        Update Wastage
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Roll Weight</TableHead>
                                            <TableHead>Roll Width</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {slittingRollData && slittingRollData.map((item, index) => (
                                            <TableRow key={item.roll_id}>
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>{item.slitting_roll_weight}</TableCell>
                                                <TableCell>{item.slitting_roll_width}</TableCell>
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
                                                                        <ReactBarcode value={item.slitting_barcode || "N/A"} />
                                                                    </div>

                                                                    {/* Vertical layout for data */}
                                                                    <div className="w-full">
                                                                        <div className="grid grid-cols-2 gap-2 w-full">

                                                                            <div className="font-semibold bg-gray-100 p-2 rounded-l">Slitting Roll No</div>
                                                                            <div className="p-2 border rounded-r">{item.roll_id}</div>

                                                                            <div className="font-semibold bg-gray-100 p-2 rounded-l">Job Card No</div>
                                                                            <div className="p-2 border rounded-r">{item.job_card_id}</div>

                                                                            <div className="font-semibold bg-gray-100 p-2 rounded-l">Slitting No</div>
                                                                            <div className="p-2 border rounded-r">{item.slitting_id}</div>

                                                                            <div className="font-semibold bg-gray-100 p-2 rounded-l">Roll Weight</div>
                                                                            <div className="p-2 border rounded-r">{item.slitting_roll_weight}</div>

                                                                            <div className="font-semibold bg-gray-100 p-2 rounded-l">Roll Width</div>
                                                                            <div className="p-2 border rounded-r">{item.slitting_roll_width}</div>
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
                                                                handleDeleteRoll(item.roll_id);
                                                            }}
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
