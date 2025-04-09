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
import { Printer, ScanBarcode } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const ReactBarcode = dynamic(() => import('react-barcode'), { ssr: false });

interface CuttingRollInfo {
    cutting_roll_id: number;
    job_card_id: number;
    cutting_id: number;
    cutting_roll_weight: string;
    no_of_bags: number;
    cutting_wastage: string;
    cutting_barcode: string;
    add_date: string;
}

interface BundleInfo {
    bundle_info_id: number;
    bundle_barcode: number;
    bundle_type: string;
    bundle_info_weight: string;
    bundle_info_bags: string;
    bundle_info_average: string;
    bundle_info_wastage_weight: string;
    bundle_info_wastage_bags: string;
    bundle_qty: number;
    bundle_slitt_wastage: string;
    bundle_print_wastage: string;
    bundle_cutting_wastage: string;
    bundle_date: string;
    user_id: number;
    bundle_info_status: number;
    cutting_roll: CuttingRollInfo;
}

export default function ViewBundleInfo() {
    const params = useParams();
    const id = params.id;

    const [loading, setLoading] = React.useState(true);
    const [bundleData, setBundleData] = React.useState<BundleInfo>();
    const { toast } = useToast();
    const bundleInfoRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (id) fetchData(Number(id));
    }, [id]);

    const fetchData = async (id: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/stock/bundle/view/${id}`);
            const data = await response.json();
            if (data) {
                setBundleData(data.data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({
                title: "Error",
                description: "Failed to fetch bundle information",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "Not Available";
        if (dateString === "0000-00-00") return "Not Set";
        return new Date(dateString).toLocaleDateString();
    };

    const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
        <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm font-medium text-gray-600">{label}</span>
            <span className="text-sm text-gray-900">{value || "Not specified"}</span>
        </div>
    );

    const handlePrint = () => {
        if (bundleInfoRef.current) {
            const printWindow = window.open('', '_blank');

            if (!printWindow) {
                toast({
                    title: "Error",
                    description: "Pop-up blocked. Please allow pop-ups to print the bundle information.",
                    variant: "destructive",
                });
                return;
            }

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Bundle Information #${id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                        .info-row:last-child { border-bottom: none; }
                        .label { font-weight: 600; color: #555; }
                        .value { color: #333; }
                        .card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
                        .card-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Bundle Information #${id}</h1>
                        <p>Printed on ${new Date().toLocaleString()}</p>
                    </div>
                    <div class="card">
                        <div class="card-title">Bundle Information</div>
                        ${bundleData ? `
                            <div class="info-row"><span class="label">Bundle ID:</span><span class="value">${bundleData.bundle_info_id}</span></div>
                            <div class="info-row"><span class="label">Bag Type:</span><span class="value">${bundleData.bundle_type || 'Not specified'}</span></div>
                            <div class="info-row"><span class="label">Total Weight (Kg):</span><span class="value">${bundleData.bundle_info_weight || 'Not specified'}</span></div>
                            <div class="info-row"><span class="label">Total No. of Bags:</span><span class="value">${bundleData.bundle_info_bags || 'Not specified'}</span></div>
                            <div class="info-row"><span class="label">Average Weight of 1000 Bags:</span><span class="value">${bundleData.bundle_info_average || 'Not specified'}</span></div>
                            <div class="info-row"><span class="label">Slitting Wastage:</span><span class="value">${bundleData.bundle_slitt_wastage || 'Not specified'}</span></div>
                            <div class="info-row"><span class="label">Printing Wastage:</span><span class="value">${bundleData.bundle_print_wastage || 'Not specified'}</span></div>
                            <div class="info-row"><span class="label">Cutting Wastage:</span><span class="value">${bundleData.bundle_cutting_wastage || 'Not specified'}</span></div>
                            <div class="info-row"><span class="label">Wastage Bags Weight:</span><span class="value">${bundleData.bundle_info_wastage_weight || 'Not specified'}</span></div>
                            <div class="info-row"><span class="label">No of Wastage Bags:</span><span class="value">${bundleData.bundle_info_wastage_bags || 'Not specified'}</span></div>
                            <div class="info-row"><span class="label">Bundle Date:</span><span class="value">${formatDate(bundleData.bundle_date)}</span></div>
                        ` : 'No data available'}
                    </div>
                </body>
                </html>
            `;

            printWindow.document.write(printContent);
            printWindow.document.close();

            // Only set onload if the window exists
            printWindow.onload = function () {
                printWindow.print();
            };
        } else {
            toast({
                title: "Error",
                description: "Cannot print bundle information",
                variant: "destructive",
            });
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
                                    <BreadcrumbPage className="text-2xl font-bold">View Bundle #{id}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">

                    {/* Bundle Information Card */}
                    <Card className="shadow-md col-span-3" ref={bundleInfoRef}>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-600">
                                Bundle Information
                            </CardTitle>
                        </CardHeader>
                        {bundleData && (
                            <CardContent>
                                <InfoRow label="Bundle ID" value={bundleData.bundle_info_id} />
                                <InfoRow label="Bag Type" value={bundleData.bundle_type} />
                                <InfoRow label="Total Weight (Kg)" value={bundleData.bundle_info_weight} />
                                <InfoRow label="Total No. of Bags" value={bundleData.bundle_info_bags} />
                                <InfoRow label="Average Weight of 1000 Bags" value={bundleData.bundle_info_average} />
                                <InfoRow label="Slitting Wastage" value={bundleData.bundle_slitt_wastage} />
                                <InfoRow label="Printing Wastage" value={bundleData.bundle_print_wastage} />
                                <InfoRow label="Cutting Wastage" value={bundleData.bundle_cutting_wastage} />
                                <InfoRow label="Wastage Bags Weight" value={bundleData.bundle_info_wastage_weight} />
                                <InfoRow label="No of Wastage Bags" value={bundleData.bundle_info_wastage_bags} />
                                <InfoRow label="Bundle Date" value={formatDate(bundleData.bundle_date)} />
                            </CardContent>
                        )}
                    </Card>

                    {/* Print Button */}
                    <div className="col-span-3 flex justify-center mt-4">
                        <Button
                            variant="default"
                            size="lg"
                            onClick={handlePrint}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Printer className="mr-2 h-5 w-5" />
                            Print Bundle Information
                        </Button>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}