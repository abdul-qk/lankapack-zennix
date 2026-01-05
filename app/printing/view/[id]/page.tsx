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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScanBarcode } from "lucide-react";
import dynamic from "next/dynamic";
import ProcessNavigation from "@/app/components/ProcessNavigation";

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
    printing_no_of_bag: string;
    printing_remark: string;
    block_size: string;
    formattedColorNames: string;
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

export default function ViewSlittingInfo() {
    const params = useParams();
    const id = params.id;

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<JobCardData>();
    const [printingData, setPrintingData] = React.useState<PrintingInfo[]>();
    const [printingPackData, setPrintingPackData] = React.useState<PrintingPackInfo[]>();
    const [colorNames, setColorNames] = React.useState<string[]>([]);

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
                                    <BreadcrumbPage className="text-2xl font-bold">View Printing #{id}</BreadcrumbPage>
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
                                        currentProcess="printing"
                                        currentPageType="view"
                                    />
                                </div>
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
                                {/* <InfoRow label="Roll Type" value={data.slitting_roll_type} /> */}
                                <InfoRow label="Cylinder Size" value={data.print_size.print_size || "Not specified"} />
                                <InfoRow label="Numbar Of Bags" value={data.printing_no_of_bag || "Not specified"} />
                                <InfoRow label="Color type" value={data.printing_color_type + " Colour(s)" || "Not specified"} />
                                {/* <InfoRow label="Color" value={colorNames.map((color) => color.split(" ")[0]).join(", ") || "Not specified"} /> */}
                                <InfoRow label="Color" value={data.formattedColorNames} />
                                <InfoRow label="Block Size" value={data.block_size || "Not specified"} />
                                <InfoRow label="Remark" value={data.printing_remark || "Not specified"} />
                            </CardContent>
                        )}
                    </Card>

                    {/* Printing Information Card */}
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-purple-600">
                                Printing Balance
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                {/* Table with Printing Data */}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Barcode</TableHead>
                                            <TableHead>Balance Weight</TableHead>
                                            <TableHead>Balance Width</TableHead>
                                            <TableHead>Printing Wastage</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {printingData && printingData.map((item, index) => (
                                            <TableRow>
                                                <TableCell>{item.print_barcode_no}</TableCell>
                                                <TableCell>{item.balance_weight}</TableCell>
                                                <TableCell>{item.balance_width}</TableCell>
                                                <TableCell className="text-right">{item.print_wastage}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        )}
                    </Card>

                    {/* Printing Pack Information Card */}
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-blue-600">
                                Printing Pack Information
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Weight</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {printingPackData && printingPackData.map((item, index) => (
                                            <TableRow>
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>{item.print_pack_weight}</TableCell>
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