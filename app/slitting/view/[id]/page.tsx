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
    job_card_id: number;
    slitting_barcode: string;
    slitting_id: number;
    slitting_roll_weight: string;
    slitting_roll_width: string;
    add_date: string
}

export default function ViewSlittingInfo() {
    const params = useParams();
    const id = params.id;

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
                                    <BreadcrumbPage className="text-2xl font-bold">View Slitting #{id}</BreadcrumbPage>
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
                                        currentProcess="slitting"
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
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-purple-600">
                                Slitting Wastage
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                {/* Table with Slitting Data */}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Barcode</TableHead>
                                            <TableHead>Wastage Weight</TableHead>
                                            <TableHead>Wastage Width</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {slittingData && slittingData.map((item, index) => (
                                            <TableRow>
                                                <TableCell className="font-medium">{item.slitting_id}</TableCell>
                                                <TableCell>{item.roll_barcode_no}</TableCell>
                                                <TableCell>{item.wastage}</TableCell>
                                                <TableCell>{item.wastage_width}</TableCell>
                                            </TableRow>
                                        ))}
                                        {/* Total Row */}
                                        {slittingData && slittingData.length > 0 && (
                                            <TableRow>
                                                <TableCell colSpan={2} className="font-bold">Total</TableCell>
                                                <TableCell className="font-bold">
                                                    {slittingData.reduce((sum, item) => sum + Number(item.wastage || 0), 0)}
                                                </TableCell>
                                                <TableCell className="font-bold">
                                                    {slittingData.reduce((sum, item) => sum + Number(item.wastage_width || 0), 0)}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        )}
                    </Card>

                    {/* Cutting Information Card */}
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-blue-600">
                                Slitting Roll Info
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Roll Weight</TableHead>
                                            <TableHead>Roll Width</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {slittingRollData && slittingRollData.map((item, index) => (
                                            <TableRow>
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>{item.slitting_roll_weight}</TableCell>
                                                <TableCell>{item.slitting_roll_width}</TableCell>
                                                {/* Convert datetime to date locale string */}
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
