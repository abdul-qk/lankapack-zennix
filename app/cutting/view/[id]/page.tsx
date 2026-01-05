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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScanBarcode } from "lucide-react";
import dynamic from "next/dynamic";
import ProcessNavigation from "@/app/components/ProcessNavigation";

const ReactBarcode = dynamic(() => import('react-barcode'), { ssr: false });

interface CustomerInfo {
    customer_id: number;
    customer_full_name: string;
}

interface ParticularInfo {
    particular_id: number;
    particular_name: string;
}

interface CuttingBagTypes {
    bag_id: number;
    bag_type: string;
}

interface CuttingTypeInfo {
    cutting_id: number;
    cutting_type: string;
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
    cut_bag_types: CuttingBagTypes;
    cut_types: CuttingTypeInfo;
}

interface CuttingInfo {
    cutting_id: number;
    job_card_id: number;
    added_date: string;
    number_of_roll: number;
    roll_barcode_no: string;
    cutting_weight: string;
    wastage: string;
}

interface CuttingRollInfo {
    cutting_id: number;
    cutting_roll_id: number;
    slitting_barcode: string;
    job_card_id: number;
    no_of_bags: number;
    cutting_wastage: string;
    cutting_roll_weight: string;
    cutting_barcode: string;
    add_date: string
}

export default function ViewCuttingInfo() {
    const params = useParams();
    const id = params.id;

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<JobCardData>();
    const [cuttingData, setCuttingData] = React.useState<CuttingInfo[]>();
    const [cuttingRollData, setCuttingRollData] = React.useState<CuttingRollInfo[]>();
    const { toast } = useToast();

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
                                <div className="mt-6 pt-6 border-t">
                                    <ProcessNavigation
                                        jobCardId={data.job_card_id}
                                        currentProcess="cutting"
                                        currentPageType="view"
                                    />
                                </div>
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
                                Cutting Data
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                {/* Table with Slitting Data */}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>No</TableHead>
                                            <TableHead>Barcode</TableHead>
                                            <TableHead>Weight</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cuttingData && cuttingData.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>{item.roll_barcode_no}</TableCell>
                                                <TableCell>{item.cutting_weight}</TableCell>
                                            </TableRow>
                                        ))}
                                        {/* Total Row */}
                                        {cuttingData && cuttingData.length > 0 && (
                                            <TableRow>
                                                <TableCell colSpan={2} className="font-bold text-right">Total</TableCell>
                                                <TableCell className="font-bold">
                                                    {cuttingData.reduce((sum, item) => sum + Number(item.cutting_weight || 0), 0)}
                                                </TableCell>
                                            </TableRow>
                                        )}
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
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>No of Bags</TableHead>
                                            <TableHead>Weight</TableHead>
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
                                                <TableCell>{new Date(item.add_date).toLocaleString('en-UK', { dateStyle: 'short' })}</TableCell>
                                                <TableCell>
                                                    <Dialog>
                                                        <DialogTrigger>
                                                            <ScanBarcode />
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
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {/* Totals Row */}
                                        {cuttingRollData && cuttingRollData.length > 0 && (
                                            <TableRow>
                                                <TableCell className="font-bold text-right" colSpan={1}>Total</TableCell>
                                                <TableCell className="font-bold">
                                                    {cuttingRollData.reduce((sum, item) => sum + Number(item.no_of_bags || 0), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="font-bold">
                                                    {cuttingRollData.reduce((sum, item) => sum + Number(item.cutting_roll_weight || 0), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="font-bold">
                                                    {cuttingRollData.reduce((sum, item) => sum + Number(item.cutting_wastage || 0), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell colSpan={2}></TableCell>
                                            </TableRow>
                                        )}
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
