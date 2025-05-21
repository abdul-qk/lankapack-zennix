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
import { ScanBarcode, Trash2, Trash2Icon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

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
    cut_types: CutType;
    cut_bag_types: CuttingBagType;
}

interface CuttingBagType {
    bag_id: number;
    bags_select: number;
    bag_type: string;
    bag_price: string;
}

interface CutType {
    cutting_id: number;
    cutting_type: string;
}

interface CuttingInfo {
    cutting_id: number;
    job_card_id: number;
    roll_barcode_no: string;
    cutting_weight: string;
    number_of_roll: number;
    wastage: string;
    wastage_width: string;
    added_date: string;
    update_date: string;
    net_weight: string;
}

interface CuttingRollInfo {
    cutting_roll_id: number;
    job_card_id: number;
    cutting_id: number;
    cutting_roll_weight: string;
    no_of_bags: number;
    cutting_wastage: string;
    cutting_barcode: string;
    add_date: string;
    user_id: number;
    del_ind: number;
}

export default function ViewSlittingInfo() {
    const params = useParams();
    const id = params.id;

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<JobCardData>();
    const [cuttingData, setCuttingData] = React.useState<CuttingInfo[]>();
    const [cuttingRollData, setCuttingRollData] = React.useState<CuttingRollInfo[]>();
    const { toast } = useToast();

    const [newBarcode, setNewBarcode] = React.useState("");
    const [selectedBarcode, setSelectedBarcode] = React.useState<string>("");
    const [newWeight, setNewWeight] = React.useState("");
    const [selectedCuttingId, setSelectedCuttingId] = React.useState<number | null>(null);
    const [bagWeight, setBagWeight] = React.useState("");
    const [noOfBags, setNoOfBags] = React.useState("");
    const [wasteWeight, setWasteWeight] = React.useState("");

    React.useEffect(() => {
        if (id) fetchData(Number(id));
    }, [id]);

    const fetchData = async (id: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/cutting/${id}`);
            const data = await response.json();
            if (data) {
                setData(data.data);
                setCuttingData(data.cuttingData);
                setCuttingRollData(data.cuttingRollData)
            }
        } catch (error) {
            console.error("Error fetching data:", error);
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

    const handleAddBarcode = async (e: any) => {
        e.preventDefault();

        try {
            const response = await fetch(`/api/cutting/add-barcode`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jobCardId: Number(id),
                    barcode: newBarcode,
                    weight: newWeight,
                    userId: 1, // Replace with actual user ID from your auth system
                }),
            });

            const result = await response.json();

            if (response.ok) {
                // Clear form inputs
                setNewBarcode("");
                setNewWeight("");

                // Refresh the data
                fetchData(Number(id));

                toast({
                    title: "Barcode added",
                    description: "The barcode has been added successfully.",
                    variant: "default",
                });
            } else {
                // Handle specific error cases
                if (response.status === 404) {
                    toast({
                        title: "Invalid Barcode",
                        description: "This barcode does not exist in stock or is not available.",
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Error adding barcode",
                        description: result.error || "An error occurred while adding the barcode.",
                        variant: "destructive",
                    });
                }
            }
        } catch (error) {
            console.error("Error adding barcode:", error);
            toast({
                title: "Error adding barcode",
                description: "An error occurred while adding the barcode.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteBarcode = (cuttingId: number) => {
        return async () => {
            try {
                const response = await fetch(`/api/cutting/delete-barcode/${cuttingId}`, {
                    method: "DELETE",
                });
                if (response.ok) {
                    toast({
                        title: "Barcode deleted",
                        description: "The barcode has been deleted successfully.",
                        variant: "default",
                    })
                }
            } catch (error) {
                console.error("Error deleting barcode:", error);
                toast({
                    title: "Error deleting barcode",
                    description: "An error occurred while deleting the barcode.",
                    variant: "destructive",
                })
            }
        }
    }

    const handleSelectCutting = (cuttingId: number, barcode: string) => {
        // If clicking the same record, deselect it
        if (cuttingId === selectedCuttingId) {
            setSelectedCuttingId(null);
            setBagWeight("");
            setNoOfBags("");
            setWasteWeight("");
            return;
        }

        setSelectedCuttingId(cuttingId);
        setSelectedBarcode(barcode);
        // Reset form fields when selecting a new cutting
        setBagWeight("");
        setNoOfBags("");
        setWasteWeight("");
    };

    // Add this handler function for adding a cutting roll
    const handleAddCuttingRoll = async () => {
        if (!selectedCuttingId) {
            toast({
                title: "Error",
                description: "Please select a barcode first",
                variant: "destructive",
            });
            return;
        }

        if (!bagWeight) {
            toast({
                title: "Error",
                description: "Bag weight is required",
                variant: "destructive",
            });
            return;
        }

        if (!noOfBags) {
            toast({
                title: "Error",
                description: "Number of bags is required",
                variant: "destructive",
            });
            return;
        }

        if (!wasteWeight) {
            toast({
                title: "Error",
                description: "Waste weight is required",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/cutting/${id}/add-roll`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cutting_id: selectedCuttingId,
                    cutting_roll_weight: bagWeight,
                    no_of_bags: parseInt(noOfBags),
                    cutting_wastage: wasteWeight,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast({
                    title: "Error",
                    description: data.error || "Failed to add cutting roll",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Success",
                    description: "Cutting roll added successfully",
                });

                // Clear the input fields
                setBagWeight("");
                setNoOfBags("");
                setWasteWeight("");

                // Refresh data
                fetchData(Number(id));
            }
        } catch (error) {
            console.error("Error adding cutting roll:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/cutting/${id}/complete`, {
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
                    description: "Slitting process marked as completed",
                });
                fetchData(Number(id));
                // Go to slitting page
                window.location.href = `/cutting`;
            }
        } catch (error) {
            console.error("Error completing slitting:", error);
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
                                    <BreadcrumbPage className="text-2xl font-bold">Edit Cutting #{id}</BreadcrumbPage>
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
                                Cutting Information
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                {/* <InfoRow label="Roll Type" value={data.slitting_roll_type} /> */}
                                <InfoRow label="Cutting Type" value={data.cut_types.cutting_type || "Not specified"} />
                                <InfoRow label="Number Of Bags" value={data.cuting_no_of_bag || "Not specified"} />
                                <InfoRow label="Bag Type" value={data.cut_bag_types.bag_type || "Not specified"} />
                                <InfoRow label="Print Name" value={data.cutting_print_name || "Not specified"} />
                                <InfoRow label="Fold" value={data.cutting_fold || "Not specified"} />
                            </CardContent>
                        )}
                    </Card>

                    {/* Printing Information Card */}
                    <Card className="shadow-md col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-purple-600">
                                Cutting Barcode
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                {/* Add New Barcode Form */}
                                <form onSubmit={handleAddBarcode} className="mb-6 grid grid-cols-12 gap-4">
                                    <div className="col-span-5">
                                        <label htmlFor="barcode" className="text-sm font-medium text-gray-700 mb-1 block">
                                            Barcode
                                        </label>
                                        <input
                                            id="barcode"
                                            type="text"
                                            value={newBarcode}
                                            onChange={(e) => setNewBarcode(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                            placeholder="Enter barcode"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-5">
                                        <label htmlFor="weight" className="text-sm font-medium text-gray-700 mb-1 block">
                                            Weight
                                        </label>
                                        <input
                                            id="weight"
                                            type="text"
                                            value={newWeight}
                                            onChange={(e) => setNewWeight(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                            placeholder="Enter weight"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-end">
                                        <button
                                            type="submit"
                                            disabled={!newBarcode || !newWeight}
                                            className="w-full bg-black text-white py-2 px-4 rounded-md shadow-sm"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </form>
                                {/* Table with Cutting Data */}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Barcode</TableHead>
                                            <TableHead>Weight</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cuttingData && cuttingData.map((item, index) => (
                                            <TableRow
                                                key={item.cutting_id}
                                                className={selectedCuttingId === item.cutting_id ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-gray-100"}
                                                onClick={() => handleSelectCutting(item.cutting_id, item.roll_barcode_no)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        {selectedCuttingId === item.cutting_id && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                                        )}
                                                        {item.roll_barcode_no}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.net_weight}</TableCell>
                                                <TableCell>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Trash2 size={20} color="red" className="cursor-pointer" onClick={(e) => e.stopPropagation()} />
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Barcode</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete this barcode? This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteBarcode(item.cutting_id);
                                                                    }}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
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
                                Cutting Roll Info
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                {/* Add Roll Form - Only show if there are cutting records */}
                                {cuttingData && cuttingData.length > 0 && (
                                    <div className="mb-4 p-4 border rounded-md bg-gray-50">
                                        <div className="mb-2 text-sm font-medium text-gray-700">
                                            {selectedCuttingId
                                                ? `Selected barcode: ${cuttingData.find(item => item.cutting_id === selectedCuttingId)?.roll_barcode_no}`
                                                : "Select a barcode from the table above to add information"}
                                        </div>

                                        {/* Roll information form */}
                                        <div className="mb-4">
                                            <h3 className="text-md font-medium text-gray-800 mb-2">Add Cutting Roll Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Bag Weight
                                                    </label>
                                                    <input
                                                        value={bagWeight}
                                                        onChange={(e) => setBagWeight(e.target.value)}
                                                        type="text"
                                                        disabled={!selectedCuttingId}
                                                        className="p-2 border border-gray-300 rounded-md w-full"
                                                        placeholder="Enter bag weight"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        No of Bags
                                                    </label>
                                                    <input
                                                        value={noOfBags}
                                                        onChange={(e) => setNoOfBags(e.target.value)}
                                                        type="number"
                                                        disabled={!selectedCuttingId}
                                                        className="p-2 border border-gray-300 rounded-md w-full"
                                                        placeholder="Enter number of bags"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Waste Weight
                                                    </label>
                                                    <input
                                                        value={wasteWeight}
                                                        onChange={(e) => setWasteWeight(e.target.value)}
                                                        type="text"
                                                        disabled={!selectedCuttingId}
                                                        className="p-2 border border-gray-300 rounded-md w-full"
                                                        placeholder="Enter waste weight"
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <Button
                                                        onClick={handleAddCuttingRoll}
                                                        disabled={!selectedCuttingId}
                                                        className="w-full"
                                                    >
                                                        Add Roll
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
                                            <TableHead>No of Bags</TableHead>
                                            <TableHead>Bag Weight</TableHead>
                                            <TableHead>Wastage</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cuttingRollData && cuttingRollData.map((item, index) => (
                                            <TableRow>
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>{item.no_of_bags}</TableCell>
                                                <TableCell>{item.cutting_roll_weight}</TableCell>
                                                <TableCell>{item.cutting_wastage}</TableCell>
                                                {/* Convert datetime to date locale string */}
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
                                                                        <ReactBarcode value={item.cutting_barcode || "N/A"} />
                                                                    </div>

                                                                    {/* Vertical layout for data */}
                                                                    <div className="w-full">
                                                                        <div className="grid grid-cols-2 gap-2 w-full">

                                                                            <div className="font-semibold bg-gray-100 p-2 rounded-l">Cutting Roll No</div>
                                                                            <div className="p-2 border rounded-r">{item.cutting_roll_id}</div>

                                                                            <div className="font-semibold bg-gray-100 p-2 rounded-l">Job Card No</div>
                                                                            <div className="p-2 border rounded-r">{item.job_card_id}</div>

                                                                            <div className="font-semibold bg-gray-100 p-2 rounded-l">Cutting No</div>
                                                                            <div className="p-2 border rounded-r">{item.cutting_id}</div>

                                                                            <div className="font-semibold bg-gray-100 p-2 rounded-l">Cutting Roll Weight</div>
                                                                            <div className="p-2 border rounded-r">{item.cutting_roll_weight}</div>

                                                                            <div className="font-semibold bg-gray-100 p-2 rounded-l">Cutting Roll Wastage</div>
                                                                            <div className="p-2 border rounded-r">{item.cutting_wastage}</div>
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
                                                                // handleDeleteRoll(item.roll_id);
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
}
