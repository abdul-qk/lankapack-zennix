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

interface CustomerInfo {
    customer_id: number;
    customer_full_name: string;
}

interface PaperRollInfo {
    particular_id: number;
    particular_name: string;
}

interface MaterialItem {
    item_gsm: string;
    material_item_size: string;
}

interface PrintSizeInfo {
    print_size_id: number;
    print_size: string;
}

interface CuttingInfo {
    cutting_id: number;
    cutting_type: string;
}

interface ColorInfo {
    colour_id: number;
    colour_name: string;
}

interface BagTypeInfo {
    bag_id: number;
    bag_type: string;
    bags_select: string;
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
}

export default function JobCardTable() {
    const params = useParams();
    const id = params.id;

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<JobCardData>();
    const [paperRolls, setPaperRolls] = React.useState<PaperRollInfo[]>([]);
    const [printSizes, setPrintSizes] = React.useState<PrintSizeInfo[]>([]);
    const [cuttingType, setCuttingType] = React.useState<CuttingInfo[]>([]);
    const [colours, setColours] = React.useState<ColorInfo[]>([]);
    const [bagTypes, setBagTypes] = React.useState<BagTypeInfo[]>([]);
    const { toast } = useToast();

    React.useEffect(() => {
        if (id) fetchData(Number(id));
        fetchBagTypeData();
    }, [id]);

    const fetchData = async (id: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/job/jobcard/view/${id}`);
            const data = await response.json();
            if (data) {
                setData(data);
                setPrintSizes(data.printSizes);
                console.log(data.printSizes);
                setCuttingType(data.cuttingTypes);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBagTypeData = async () => {
        try {
            const response = await fetch(`/api/job/bagtype/`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setBagTypes(data.data);
        } catch (error) {
            console.error("Error fetching bag type data:", error);
            return [];
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
                                    <BreadcrumbPage className="text-2xl font-bold">View Job #{id}</BreadcrumbPage>
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
                                <InfoRow label="Customer ID" value={data.customer.customer_full_name} />
                                <InfoRow label="Unit Price" value={data.unit_price || "Not specified"} />
                                <InfoRow label="Add Date" value={formatDate(data.add_date)} />
                                <InfoRow label="Updated Date" value={formatDate(data.updated_date)} />
                                <InfoRow label="Delivery Date" value={formatDate(data.delivery_date)} />
                                <InfoRow label="Paper GSM" value={data.slitting_paper_gsm} />
                                <InfoRow label="Paper Size" value={data.slitting_paper_size} />
                                <div className="mt-4 p-2 bg-gray-50 rounded-md">
                                    <div className="text-sm font-medium text-gray-600 mb-2">Card Status:</div>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div className={`p-1 rounded ${data.section_list.includes('1') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-center`}>
                                            Slitting: {data.section_list.includes('1') ? 'Yes' : 'No'}
                                        </div>
                                        <div className={`p-1 rounded ${data.section_list.includes('2') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-center`}>
                                            Printing: {data.section_list.includes('2') ? 'Yes' : 'No'}
                                        </div>
                                        <div className={`p-1 rounded ${data.section_list.includes('3') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-center`}>
                                            Cutting: {data.section_list.includes('3') ? 'Yes' : 'No'}
                                        </div>
                                    </div>
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
                                Printing Information
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                <InfoRow
                                    label="Cylinder Size"
                                    value={
                                        printSizes.length > 0 && data.printing_size
                                            ? printSizes.find((size) => size.print_size_id === Number(data.printing_size))?.print_size || "Not specified"
                                            : "Not specified"
                                    }
                                />
                                <InfoRow label="Color Type" value={data.printing_color_type + ' Colour' || "Not specified"} />
                                <InfoRow label="Color Name" value={data.formattedColorNames} />
                                <InfoRow label="Number of Bags" value={data.printing_no_of_bag || "Not specified"} />
                                <InfoRow label="Block Size" value={data.block_size || "Not specified"} />
                                <InfoRow label="Remark" value={data.printing_remark || "Not specified"} />
                            </CardContent>
                        )}
                    </Card>

                    {/* Cutting Information Card */}
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-blue-600">
                                Cutting Information
                            </CardTitle>
                        </CardHeader>
                        {data && (
                            <CardContent>
                                <InfoRow label="Cutting Type" value={
                                    cuttingType.length > 0 && data.cutting_type ? cuttingType.find((type) => type.cutting_id === Number(data.cutting_type))?.cutting_type || "Not specified" : "Not specified"
                                } />
                                {/* <InfoRow label="Bags Select" value={data.cutting_bags_select} /> */}
                                <InfoRow label="Number of Bags" value={data.cuting_no_of_bag} />
                                <InfoRow
                                    label="Bag Size"
                                    value={
                                        bagTypes.length > 0 && data.cutting_bag_type
                                            ? bagTypes.find((size) => size.bag_id === Number(data.cutting_bag_type))?.bag_type || "Not specified"
                                            : "Not specified"
                                    }
                                />
                                {/* If data.cutting_bags_select is 1 then "Printing" else "Non Printing" */}
                                <InfoRow label="Selected Type" value={Number(data.cutting_bags_select) === 1 ? "Printing" : "Non Printing"} />
                                <InfoRow label="Print Name" value={data.cutting_print_name} />
                                <InfoRow label="Fold" value={data.cutting_fold || "Not specified"} />
                                <InfoRow label="Remark" value={data.cuting_remark} />
                            </CardContent>
                        )}
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
