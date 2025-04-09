"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/layouts/loading";
import { Trash } from "lucide-react";
import Link from "next/link";

type Customer = {
  customer_id: number;
  customer_full_name: string;
};

type ReturnItem = {
  id: string;
  barcode: string;
  bagType: string;
  weight: number;
  bags: number;
  price: number;
  total: number;
  complete_item_id?: number;
};

type PageProps = {
  params: {
    id: string;
  };
};

export default function EditReturnPage({ params }: PageProps) {
  const returnId = params.id;
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [barcode, setBarcode] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [validatingBarcode, setValidatingBarcode] = useState(false);
  const [returnLoaded, setReturnLoaded] = useState(false);

  // Fetch customers and return data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch customers
        const customersResponse = await fetch("/api/sales/return/new");
        const customersResult = await customersResponse.json();

        if (customersResult.success && customersResult.data) {
          setCustomers(customersResult.data);
        } else {
          throw new Error(customersResult.error || "Failed to fetch customers");
        }

        // Fetch return data
        const returnResponse = await fetch(`/api/sales/return/${returnId}`);
        const returnResult = await returnResponse.json();

        if (returnResult.success && returnResult.data) {
          const { returnInfo, customer, returnItems } = returnResult.data;

          // Set selected customer
          setSelectedCustomer(customer.customer_id.toString());

          // Transform return items to match our component's format
          const formattedItems: ReturnItem[] = returnItems.map((item: any) => ({
            id: item.return_item_id.toString(),
            barcode: item.barcode_no,
            bagType: item.bundle_type,
            weight: parseFloat(item.n_weight),
            bags: item.no_of_bags,
            price: parseFloat(item.item_price),
            total: parseFloat(item.item_total),
            complete_item_id: item.complete_item_id
          }));

          setReturnItems(formattedItems);
          setReturnLoaded(true);
        } else {
          throw new Error(returnResult.error || "Failed to fetch return data");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data. Please try again."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [returnId, toast]);

  // Calculate total
  const totalItems = returnItems.reduce((sum, item) => sum + item.total, 0);
  const totalBags = returnItems.reduce((sum, item) => sum + item.bags, 0);

  // Validate barcode and add item
  const handleAddItem = async () => {
    // Validate inputs
    if (!selectedCustomer) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a customer first"
      });
      return;
    }

    if (!barcode) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a barcode"
      });
      return;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid price"
      });
      return;
    }

    // Check if barcode already exists in the list
    const existingItem = returnItems.find(item => item.barcode === barcode);
    if (existingItem) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "This barcode has already been added"
      });
      return;
    }

    setValidatingBarcode(true);

    try {
      // Validate barcode
      const response = await fetch(`/api/sales/return/validate-barcode?barcode=${barcode}`);
      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Invalid barcode"
        });
        return;
      }

      const itemData = result.data;
      const priceValue = parseFloat(price);
      const total = priceValue * itemData.weight;

      // Add item to the list
      const newItem: ReturnItem = {
        id: Date.now().toString(),
        barcode: barcode,
        bagType: itemData.bundle_type,
        weight: itemData.weight,
        bags: itemData.bags,
        price: priceValue,
        total: total,
        complete_item_id: itemData.complete_item_id
      };

      setReturnItems([...returnItems, newItem]);

      // Reset form fields
      setBarcode("");
      setPrice("");

      toast({
        title: "Success",
        description: "Item added successfully"
      });
    } catch (error) {
      console.error("Error validating barcode:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to validate barcode"
      });
    } finally {
      setValidatingBarcode(false);
    }
  };

  // Remove item from the list
  const handleRemoveItem = (id: string) => {
    setReturnItems(returnItems.filter(item => item.id !== id));
  };

  // Update the return note
  const handleUpdateReturn = async () => {
    if (!selectedCustomer) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a customer"
      });
      return;
    }

    if (returnItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one item"
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/sales/return/${returnId}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: parseInt(selectedCustomer),
          items: returnItems,
          totalBags: totalBags,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Return note updated successfully"
        });

        // Redirect to return list page
        router.push("/sales/return");
      } else {
        throw new Error(result.error || "Failed to update return note");
      }
    } catch (error) {
      console.error("Error updating return note:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update return note"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Enter key press in barcode field
  const handleBarcodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // If price is already filled, add the item
      if (price && !isNaN(parseFloat(price)) && parseFloat(price) > 0) {
        handleAddItem();
      } else {
        // Otherwise, focus on the price input
        const priceInput = document.getElementById("price-input");
        if (priceInput) {
          priceInput.focus();
        }
      }
    }
  };

  // Handle Enter key press in price field
  const handlePriceKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  if (loading) {
    return <Loading />;
  }

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
                  <BreadcrumbPage className="text-2xl font-bold">Edit Return #{returnId}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="container mx-auto p-4">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {/* Customer Selection */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Name</label>
                  <Select
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem
                          key={customer.customer_id}
                          value={customer.customer_id.toString()}
                        >
                          {customer.customer_full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Add Items */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Barcode
                  </label>
                  <Input
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={handleBarcodeKeyPress}
                    placeholder="Scan or enter barcode"
                    disabled={validatingBarcode || submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price
                  </label>
                  <Input
                    id="price-input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    onKeyDown={handlePriceKeyPress}
                    placeholder="Enter price"
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={validatingBarcode || submitting}
                  />
                </div>
                <div>
                  <Button
                    onClick={handleAddItem}
                    disabled={validatingBarcode || submitting}
                    className="w-full md:w-auto mt-6"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Barcode No</TableHead>
                  <TableHead>Bag Type</TableHead>
                  <TableHead className="text-right">N/Weight</TableHead>
                  <TableHead className="text-right">No of Bags</TableHead>
                  <TableHead className="text-right">Item Price</TableHead>
                  <TableHead className="text-right">Item Total</TableHead>
                  <TableHead className="w-[50px]">#</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnItems.length > 0 ? (
                  <>
                    {returnItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.barcode}</TableCell>
                        <TableCell>{item.bagType}</TableCell>
                        <TableCell className="text-right">{item.weight.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.bags}</TableCell>
                        <TableCell className="text-right">{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={submitting}
                          >
                            <Trash color="#ff0000" className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {totalBags}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-bold">
                        {totalItems.toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No items added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <Button variant="outline" asChild>
                <Link href="/sales/return">Cancel</Link>
              </Button>
              <Button
                onClick={handleUpdateReturn}
                disabled={returnItems.length === 0 || submitting}
              >
                {submitting ? "Saving..." : "Update Return Note"}
              </Button>
            </div>
          </div>
        </div>
      </SidebarInset >
    </SidebarProvider >
  );
}
