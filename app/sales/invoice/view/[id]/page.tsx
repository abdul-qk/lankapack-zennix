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

type InvoiceInfo = {
  bill_info_id: number;
  customer_name: number;
  bill_do: string;
  bill_total: string;
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

type InvoiceItem = {
  bill_item_id: number;
  bill_info_id: number;
  de_number: number;
  bundel_type: number;
  bag_type: string;
  bundel_qty: string;
  item_price: string;
  item_total: string;
  user_id: number;
  del_ind: number;
};

type InvoiceData = {
  invoiceInfo: InvoiceInfo;
  customer: Customer;
  invoiceItems: InvoiceItem[];
  totalAmount: string;
};

export default function InvoiceView() {
  const params = useParams();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/sales/invoice/${params.id}`);
        const result = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error(result.error || "Failed to fetch data");
        }
      } catch (error) {
        console.error("Error fetching invoice details:", error);
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
          <title>Invoice #${data?.invoiceInfo.bill_info_id}</title>
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
          </style>
        </head>
        <body>
          <div class="print-header">
            <img src="/company_logo.png" alt="Logo" style="width: 150px; height: auto; object-fit: contain;" />
            <div>
              <p>No 24, 1st Lane, Model Town Road,</p>
              <p>Katubedda, Moratuwa, Sri Lanka.</p>
              <p>PO BOX 10400</p>
            </div>
            <h1>INVOICE</h1>
          </div>
          
          <div class="customer-info">
            <div>
              <p><strong>Customer:</strong> ${data?.customer.customer_full_name}</p>
              <p><strong>Address:</strong> ${data?.customer.customer_address}</p>
              <p><strong>Contact:</strong> ${data?.customer.customer_mobile || ''}</p>
            </div>
            <div class="text-right">
              <p><strong>Invoice #:</strong> ${data?.invoiceInfo.bill_info_id}</p>
              <p><strong>Date:</strong> ${format(new Date(data?.invoiceInfo.add_date || new Date()), 'dd/MM/yyyy')}</p>
              <p><strong>DO #:</strong> ${data?.invoiceInfo.bill_do}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item #</th>
                <th>Bundle Type</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data?.invoiceItems.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.bundel_type}</td>
                  <td>${item.bundel_qty}</td>
                  <td>${item.item_price}</td>
                  <td>${item.item_total}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4" style="text-align: right;">Total:</td>
                <td>${data?.totalAmount}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="signature-section">
            <div style="border-top: 1px solid #000; padding-top: 10px;">
              <p>Customer Signature</p>
            </div>
            <div style="border-top: 1px solid #000; padding-top: 10px; text-align: right;">
              <p>Authorized Signature</p>
            </div>
          </div>
        </body>
      </html>
    `);

    // Trigger print and close the window after printing
    printWindow.document.close();
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
      // printWindow.close();
    };
  };

  if (loading) {
    return <Loading />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Invoice not found</h1>
        <Button asChild>
          <Link href="/sales/invoice">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>
      </div>
    );
  }

  const { invoiceInfo, customer, invoiceItems, totalAmount } = data;
  const formattedDate = format(new Date(invoiceInfo.add_date), 'dd/MM/yyyy');

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="p-0">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-2xl font-bold">Invoice #{invoiceInfo.bill_info_id}</BreadcrumbPage>
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
                <h1 className="text-xl font-bold mt-4">INVOICE</h1>
              </div>

              {/* Customer and Invoice Info */}
              <div className="customer-info grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p><strong>Customer:</strong> {customer.customer_full_name}</p>
                  <p><strong>Address:</strong> {customer.customer_address}</p>
                  <p><strong>Contact:</strong> {customer.customer_mobile}</p>
                </div>
                <div className="text-right">
                  <p><strong>Invoice #:</strong> {invoiceInfo.bill_info_id}</p>
                  <p><strong>Date:</strong> {formattedDate}</p>
                  <p><strong>DO #:</strong> {invoiceInfo.bill_do}</p>
                </div>
              </div>

              {/* Invoice Items Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item #</TableHead>
                    <TableHead>Bundle Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceItems.map((item, index) => (
                    <TableRow key={item.bill_item_id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.bag_type}</TableCell>
                      <TableCell>{item.bundel_qty}</TableCell>
                      <TableCell className="text-right">{item.item_price}</TableCell>
                      <TableCell className="text-right">{item.item_total}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="total-row">
                    <TableCell colSpan={4} className="text-right font-bold">
                      Total:
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {totalAmount}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Signature Section */}
              <div className="signature-section grid grid-cols-2 gap-4 mt-16">
                <div className="border-t pt-2">
                  <p>Customer Signature</p>
                </div>
                <div className="border-t pt-2 text-right">
                  <p>Authorized Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
