"use client";

import React, { useRef } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "next/navigation";
import Loading from "@/components/layouts/loading";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

// Remove Head import if not used elsewhere for print styles
// import Head from "next/head";

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

interface PrintInfo {
    print_size_id: number;
    print_size: string;
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
    print_size: PrintInfo;
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
    const [printSize, setPrintSize] = React.useState('');
    const [cuttingType, setCuttingType] = React.useState<CuttingInfo[]>([]);
    const [colours, setColours] = React.useState<ColorInfo[]>([]);
    const [bagTypes, setBagTypes] = React.useState<BagTypeInfo[]>([]);
    const { toast } = useToast();
    const printRef = useRef<HTMLDivElement>(null);

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

            // Fetch print_size from printSizes based on printing_size
            const selectedPrintSize = printSizes.find(size => size.print_size_id === data.printing_size);
            console.log(selectedPrintSize);
            if (selectedPrintSize) {
                setPrintSize(selectedPrintSize.print_size);
            }
            // Fetch colour names based on printing_color_name
            const colorNames = data.printing_color_name.split(', ');
            const selectedColours = colours.filter(colour => colorNames.includes(colour.colour_name));
            if (selectedColours.length > 0) {
                setColours(selectedColours);
            }
            // Fetch bag type based on cutting_bag_type
            const selectedBagType = bagTypes.find(bag => bag.bag_id === data.cutting_bag_type);
            if (selectedBagType) {
                setBagTypes([selectedBagType]);
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
        <div className="flex justify-between py-2 border-b border-gray-100 last:border-0 info-row">
            <span className="text-sm font-medium text-gray-600">{label}</span>
            <span className="text-sm text-gray-900">{value || "Not specified"}</span>
        </div>
    );

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow pop-ups to print');
            return;
        }

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Job Card #${id}</title>
              <style>
                @page {
                  size: A4;
                  margin: 1cm;
                }
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                }
                .print-header {
                  text-align: center;
                  margin-bottom: 20px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* Adjust as needed */
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .info-card {
                    border: 1px solid #eee;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 16px;
                }
                .info-card-title {
                    font-weight: bold;
                    margin-bottom: 10px;
                    font-size: 1.1em;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 5px;
                }
                .info-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 6px 0;
                  border-bottom: 1px solid #f0f0f0;
                  font-size: 0.9em;
                }
                .info-row:last-child {
                    border-bottom: none;
                }
                .info-label {
                  color: #555;
                }
                .info-value {
                  font-weight: 500;
                }
                .status-block{
                  margin-top: 16px;
                }
                .status-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 10px;
                    margin-top: 15px;
                }
                .status-item {
                    padding: 8px;
                    border-radius: 4px;
                    text-align: center;
                    font-size: 0.9em;
                    border: 1px solid;
                }
                .status-yes {
                    background-color: #e6fffa;
                    border-color: #b7e4d7;
                    color: #2c7a7b;
                }
                .status-no {
                    background-color: #fff5f5;
                    border-color: #fed7d7;
                    color: #c53030;
                }
                /* Add any other specific styles needed for job card print */
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);

        printWindow.document.close();
        printWindow.onload = function () {
            printWindow.focus();
            printWindow.print();
        };
    };

    if (loading) { return <Loading /> }

    // Helper to render InfoRow for printing
    const PrintInfoRow = ({ label, value }: { label: string; value: string | number }) => (
        <div className="info-row">
            <span className="info-label">{label}:</span>
            <span className="info-value">{value || "Not specified"}</span>
        </div>
    );

    return (
        <SidebarProvider>
            <AppSidebar /> {/* Removed no-print, handled by ref */}
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 no-print">
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

                {/* Print Area Wrapper */}
                <div ref={printRef}>
                    {/* Actual Content to Print */}
                    <div className="main-content-area p-6 print:p-0"> {/* Adjust padding for print if needed */}
                        {/* Header for print only - Can be simplified or adjusted */}
                        <div className="print-header hidden print:block">
                            <h1 className="text-2xl font-bold">Job Card #{id}</h1>
                            <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* General Information Card */}
                            <Card className="shadow-md col-span-3">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-600">
                                        General Information
                                    </CardTitle>
                                </CardHeader>
                                {data && (
                                    <CardContent className="info-card-content"> {/* Add class for potential print styling */}
                                        <InfoRow label="Job Card ID" value={data.job_card_id} />
                                        <InfoRow label="Customer ID" value={data.customer.customer_full_name} />
                                        <InfoRow label="Unit Price" value={data.unit_price || "Not specified"} />
                                        <InfoRow label="Add Date" value={formatDate(data.add_date)} />
                                        <InfoRow label="Updated Date" value={formatDate(data.updated_date)} />
                                        <InfoRow label="Delivery Date" value={formatDate(data.delivery_date)} />
                                        <InfoRow label="Paper GSM" value={data.slitting_paper_gsm} />
                                        <InfoRow label="Paper Size" value={data.slitting_paper_size} />
                                        {/* Status Section - Apply print classes */}
                                        <div className="mt-4 status-block">
                                            <div className="text-sm font-bold text-gray-600 mb-2 info-label">Card Status:</div>
                                            <div className="status-grid">
                                                <div className={`status-item ${data.section_list.includes('1') ? 'status-yes' : 'status-no'}`}>
                                                    Slitting: {data.section_list.includes('1') ? 'Yes' : 'No'}
                                                </div>
                                                <div className={`status-item ${data.section_list.includes('2') ? 'status-yes' : 'status-no'}`}>
                                                    Printing: {data.section_list.includes('2') ? 'Yes' : 'No'}
                                                </div>
                                                <div className={`status-item ${data.section_list.includes('3') ? 'status-yes' : 'status-no'}`}>
                                                    Cutting: {data.section_list.includes('3') ? 'Yes' : 'No'}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                            {/* Apply similar structure (PrintInfoRow, print-specific classes) to other cards */}
                            {/* Slitting Information Card */}
                            {data && (
                                <Card className="shadow-md info-card">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold text-green-600 info-card-title">
                                            Slitting Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="info-card-content">
                                        {/* <InfoRow label="Roll Type" value={data.slitting_roll_type} /> */}
                                        <InfoRow label="Slitting" value={data.slitting_size || "Not specified"} />
                                        <InfoRow label="Remark" value={data.slitting_remark || "Not specified"} />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Printing Information Card */}
                            {data && (
                                <Card className="shadow-md info-card">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold text-purple-600 info-card-title">
                                            Printing Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="info-card-content">
                                        <InfoRow label="Cylinder Size" value={data.print_size.print_size || "Not specified"} />
                                        <InfoRow label="Color Type" value={data.printing_color_type + ' Colour(s)' || "Not specified"} />
                                        <InfoRow label="Color Name(s)" value={data.formattedColorNames || data.printing_color_name || "Not specified"} />
                                        <InfoRow label="No. of Bags" value={data.printing_no_of_bag || "Not specified"} />
                                        <InfoRow label="Remark" value={data.printing_remark || "Not specified"} />
                                        <InfoRow label="Block Size" value={data.block_size || "Not specified"} />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Cutting Information Card */}
                            {data && (
                                <Card className="shadow-md info-card">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold text-blue-600 info-card-title">
                                            Cutting Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="info-card-content">
                                        <InfoRow label="Cutting Type" value={cuttingType.find(ct => ct.cutting_id === parseInt(data.cutting_type))?.cutting_type || data.cutting_type || "Not specified"} />
                                        <InfoRow label="No. of Bags" value={data.cuting_no_of_bag || "Not specified"} />
                                        <InfoRow label="Selected Type" value={data.cutting_bags_select ? (data.cutting_bags_select === '1' ? 'Non Printing' : 'Printing') : "Not specified"} />
                                        <InfoRow label="Bag Size" value={bagTypes.find(bt => bt.bag_id === parseInt(data.cutting_bag_type))?.bag_type || data.cutting_bag_type || "Not specified"} />
                                        <InfoRow label="Print Name" value={data.cutting_print_name || "Not specified"} />
                                        <InfoRow label="Fold" value={data.cutting_fold || "Not specified"} />
                                        <InfoRow label="Remark" value={data.cuting_remark || "Not specified"} />
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Add Print Button */}
                        <div className="ml-auto flex items-center justify-end gap-2 pt-8">
                            <Button variant="primary" onClick={handlePrint}>
                                <Printer className="h-4 w-4" />
                                <span>Print Job Card</span>
                            </Button>
                        </div>
                    </div>
                </div> {/* End of Print Area Wrapper */}
            </SidebarInset>
        </SidebarProvider>
    );
}