"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Loading from "@/components/layouts/loading";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type SalesInfo = {
    sales_info_id: number;
    customer_name: number;
    customer_address: string;
    customer_contact: string;
    sales_no_bags: string;
    add_date: string;
    user_id: number;
    del_ind: number;
};

type Customer = {
    customer_id: number;
    customer_full_name: string;
    customer_address: string;
    customer_mobile: string | null;
};

type SalesItem = {
    sales_item_id: number;
    sales_info_id: number;
    complete_item_id: number;
    barcode_no: string;
    bundle_type: string;
    n_weight: number;
    no_of_bags: number;
    item_price: string;
    item_total: string;
    user_id: number;
    del_ind: number;
};

type SalesData = {
    salesInfo: SalesInfo;
    customer: Customer;
    salesItems: SalesItem[];
    totalAmount: string;
};

export default function DOView() {
    const params = useParams();
    const [data, setData] = useState<SalesData | null>(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/sales/do/${params.id}`);
                const result = await response.json();

                if (result.success && result.data) {
                    setData(result.data);
                } else {
                    throw new Error(result.error || "Failed to fetch data");
                }
            } catch (error) {
                console.error("Error fetching sales details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow pop-ups to print');
            return;
        }

        // Add necessary styles and content to the new window
        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Order #${data?.salesInfo.sales_info_id}</title>
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
            .customer-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .text-right {
              text-align: right;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .total-row {
              font-weight: bold;
            }
            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-top: 60px;
            }
            .signature-line {
              border-top: 1px solid #000;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

        // Wait for content to load then print
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 1000); // 1 second delay
    };

    if (loading) {
        return <Loading />;
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Return not found</h1>
                    <Button asChild>
                        <Link href="/sales/return">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Returns
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const { salesInfo, customer, salesItems, totalAmount } = data;
    const formattedDate = salesInfo.add_date
        ? format(new Date(salesInfo.add_date), "dd/MM/yyyy")
        : "N/A";

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
                                    <BreadcrumbPage className="text-2xl font-bold">View DO #{salesInfo.sales_info_id}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="container mx-auto p-4">
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex justify-end mb-4">
                            <Button onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                            </Button>
                        </div>

                        <div ref={printRef} className="a4-page">
                            {/* Header with Logo and Address */}
                            <div className="print-header text-center mb-8">
                                <div className="flex justify-center mb-2">
                                    <Image src="/company_logo.png" alt="Logo" style={{ width: '150px', height: 'auto', objectFit: 'contain' }} width={150} height={0} />
                                </div>
                                <div className="text-sm">
                                    <p>No 24, 1st Lane, Model Town Road,</p>
                                    <p>Katubedda, Moratuwa, Sri Lanka.</p>
                                    <p>PO BOX 10400</p>
                                </div>
                                <h1 className="text-xl font-bold mt-4">DELIVERY ORDER</h1>
                            </div>

                            {/* Customer and Return Info */}
                            <div className="customer-info grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p><strong>Customer:</strong> {customer.customer_full_name}</p>
                                    <p><strong>Address:</strong> {customer.customer_address}</p>
                                    <p><strong>Contact:</strong> {customer.customer_mobile || salesInfo.customer_contact}</p>
                                </div>
                                <div className="text-right">
                                    <p><strong>DO No:</strong> {salesInfo.sales_info_id}</p>
                                    <p><strong>Date:</strong> {formattedDate}</p>
                                    <p><strong>Total Bags:</strong> {salesInfo.sales_no_bags}</p>
                                </div>
                            </div>

                            {/* Return Items Table */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Barcode No</TableHead>
                                        <TableHead>Bag Type</TableHead>
                                        <TableHead className="text-right">N/Weight</TableHead>
                                        <TableHead className="text-right">No of Bags</TableHead>
                                        <TableHead className="text-right">Item Price</TableHead>
                                        <TableHead className="text-right">Item Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {salesItems.map((item) => (
                                        <TableRow key={item.sales_item_id}>
                                            <TableCell>{item.barcode_no}</TableCell>
                                            <TableCell>{item.bundle_type}</TableCell>
                                            <TableCell className="text-right">{item.n_weight.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{item.no_of_bags}</TableCell>
                                            <TableCell className="text-right">{item.item_price}</TableCell>
                                            <TableCell className="text-right">{item.item_total}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="total-row">
                                        <TableCell colSpan={4} className="text-right">Total:</TableCell>
                                        <TableCell colSpan={2} className="text-right">{totalAmount}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>

                            {/* Signature Section */}
                            <div className="signature-section grid grid-cols-2 gap-4 mt-16">
                                <div className="border-t pt-2">
                                    <p>Vehicle No</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
