"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash, Plus } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import Loading from "@/components/layouts/loading";
import { Label } from "@/components/ui/label";

// Define types
type Customer = {
  customer_id: number;
  customer_full_name: string;
};

type DoNumber = {
  id: number;
  doNumber: string;
  customerId: number;
  customerName: string;
};

type BagType = {
  id: number;
  type: string;
  price: string;
  weight: number;
  bags: number;
  bagTypeId: number;
};

type InvoiceItem = {
  id: string;
  bagTypeId: number;
  bagType: string;
  quantity: string;
  price: string;
  total: string;
  doNumber: string;
};

type InvoiceInfo = {
  bill_info_id: number;
  customer_name: number;
  bill_do: string;
  bill_total: string;
  add_date: string;
  user_id: number;
  del_ind: number;
};

type BillItem = {
  bill_item_id: number;
  bill_info_id: number;
  de_number: number;
  bundel_type: number;
  bundel_qty: string;
  item_price: string;
  item_total: string;
  user_id: number;
  del_ind: number;
};

type BagTypeNameMap = {
  bag_id: number;
  bag_type: string;
  bag_price: string;
};

export default function EditInvoice() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [doNumbers, setDoNumbers] = useState<DoNumber[]>([]);
  const [bagTypes, setBagTypes] = useState<BagType[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [totalAmount, setTotalAmount] = useState("0.00");
  const [invoiceInfo, setInvoiceInfo] = useState<InvoiceInfo | null>(null);
  const [bagTypeNameMap, setBagTypeNameMap] = useState<Map<number, { name: string, price: string }>>(new Map());

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [doId, setDoId] = useState("");
  const [selectedBagTypeId, setSelectedBagTypeId] = useState(""); // For UI selection
  const [bagType, setBagType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  // Load all necessary data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setInitialLoading(true);
        await Promise.all([
          fetchInvoiceData(),
          fetchCustomers(),
          fetchDoNumbers(),
          fetchAllBagTypeNames()
        ]);
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load all required data");
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Calculate total amount whenever invoice items change
  useEffect(() => {
    const total = invoiceItems.reduce(
      (sum, item) => sum + parseFloat(item.total || "0"),
      0
    );
    setTotalAmount(total.toFixed(2));
  }, [invoiceItems]);

  // Fetch all bag type names once to use as a reference map
  const fetchAllBagTypeNames = async () => {
    try {
      const response = await fetch(`/api/sales/bag-type-names`);
      const result = await response.json();

      if (result.success) {
        const newMap = new Map();
        result.data.forEach((bt: BagTypeNameMap) => {
          newMap.set(bt.bag_id, {
            name: bt.bag_type,
            price: bt.bag_price
          });
        });
        setBagTypeNameMap(newMap);
        return newMap;
      }
      return new Map();
    } catch (error) {
      console.error("Error fetching all bag type names:", error);
      return new Map();
    }
  };

  const fetchInvoiceData = async () => {
    try {
      const response = await fetch(`/api/sales/invoice/${params.id}`);
      const result = await response.json();

      if (result.success && result.data) {
        const { invoiceInfo, invoiceItems } = result.data;
        setInvoiceInfo(invoiceInfo);

        // Set form values
        setCustomerId(invoiceInfo.customer_name.toString());
        setDoId(invoiceInfo.bill_do);

        // Get all bag type names first
        const bagTypeMap = await fetchAllBagTypeNames();

        // Convert invoice items to the format used by the form
        const formattedItems: InvoiceItem[] = invoiceItems.map((item: BillItem) => {
          const bagTypeInfo = bagTypeMap.get(item.bundel_type);

          return {
            id: item.bill_item_id.toString(),
            bagTypeId: item.bundel_type,
            bagType: bagTypeInfo ? bagTypeInfo.name : `Type ${item.bundel_type}`,
            quantity: item.bundel_qty,
            price: item.item_price,
            total: item.item_total,
            doNumber: item.de_number.toString(),
          };
        });

        setInvoiceItems(formattedItems);

        // Set doId based on the first item's de_number and fetch bag types
        if (invoiceItems.length > 0) {
          const firstItem = invoiceItems[0];
          const doIdValue = firstItem.de_number.toString();
          setDoId(doIdValue);

          // Fetch bag types for this DO number
          await fetchBagTypes(doIdValue);
        }
      } else {
        toast.error("Failed to load invoice data");
        router.push("/sales/invoice");
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      toast.error("Failed to load invoice data");
      router.push("/sales/invoice");
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    }
  };

  const fetchDoNumbers = async () => {
    try {
      const response = await fetch("/api/sales/do-numbers");
      const data = await response.json();
      if (data.success) {
        setDoNumbers(data.data);
      }
    } catch (error) {
      console.error("Error fetching DO numbers:", error);
      toast.error("Failed to load DO numbers");
    } finally {
      setLoading(false);
    }
  };

  // Fetch bag types when DO number changes
  const fetchBagTypes = async (doId: string) => {
    if (!doId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/sales/bag-types/${doId}`);
      const data = await response.json();

      if (data.success) {
        console.log("Fetched bag types:", data.data);

        // Ensure each bag type has a valid bagTypeId
        const processedBagTypes = data.data.map((bagType: any) => {
          // If the API doesn't provide bagTypeId, use id as a fallback
          if (!bagType.bagTypeId && bagType.bagTypeId !== 0) {
            console.warn("bagTypeId missing for bag type, using id as fallback:", bagType);
            return { ...bagType, bagTypeId: bagType.id };
          }
          return bagType;
        });

        setBagTypes(processedBagTypes);

        // Reset bag type selection when DO changes
        setSelectedBagTypeId("");
        setBagType("");
        setPrice("");
        setQuantity("");
      } else {
        toast.error("Failed to load bag types");
      }
    } catch (error) {
      console.error("Error fetching bag types:", error);
      toast.error("Failed to load bag types");
    } finally {
      setLoading(false);
    }
  };

  // Handle customer change
  const handleCustomerChange = (value: string) => {
    setCustomerId(value);
  };

  // Handle DO number change
  const handleDoNumberChange = (value: string) => {
    setDoId(value);

    // Fetch bag types for this DO number
    fetchBagTypes(value);
  };

  // Handle bag type change
  const handleBagTypeChange = (value: string) => {
    setSelectedBagTypeId(value);

    // Find the selected bag type to get its price and other details
    const selectedBagType = bagTypes.find((bagType) => bagType.id.toString() === value);

    if (selectedBagType) {
      setBagType(selectedBagType.type);
      setPrice(selectedBagType.price);
    }
  };

  // Add item to invoice
  const handleAddItem = () => {
    if (!selectedBagTypeId || !quantity) {
      toast.error("Please select a bag type and enter quantity");
      return;
    }

    // Find the selected bag type
    const selectedBagType = bagTypes.find((bagType) => bagType.id.toString() === selectedBagTypeId);
    if (!selectedBagType) {
      toast.error("Invalid bag type selected");
      return;
    }

    // Ensure bagTypeId exists
    if (!selectedBagType.bagTypeId && selectedBagType.bagTypeId !== 0) {
      console.error("Missing bagTypeId in selected bag type:", selectedBagType);
      toast.error("Invalid bag type data");
      return;
    }

    // Calculate total
    const itemPrice = parseFloat(price);
    const itemQuantity = parseFloat(quantity);
    const itemTotal = (itemPrice * itemQuantity).toFixed(2);

    // Create new invoice item
    const newItem: InvoiceItem = {
      id: Date.now().toString(), // Use timestamp as unique ID for new items
      bagTypeId: selectedBagType.bagTypeId,
      bagType: selectedBagType.type,
      quantity: quantity,
      price: price,
      total: itemTotal,
      doNumber: doId,
    };

    console.log("Adding new invoice item:", newItem);

    // Add to invoice items
    setInvoiceItems([...invoiceItems, newItem]);

    // Reset form fields except customer and DO
    setSelectedBagTypeId("");
    setBagType("");
    setQuantity("");
    setPrice("");
  };

  // Remove item from invoice
  const handleRemoveItem = (id: string) => {
    setInvoiceItems(invoiceItems.filter((item) => item.id !== id));
  };

  // Submit form
  const handleSubmit = async () => {
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    if (!doId) {
      toast.error("Please select a DO number");
      return;
    }

    if (invoiceItems.length === 0) {
      toast.error("Please add at least one item to the invoice");
      return;
    }

    // Check if any item has a missing or invalid bagTypeId
    const invalidItems = invoiceItems.filter(item => !item.bagTypeId && item.bagTypeId !== 0);
    if (invalidItems.length > 0) {
      console.error("Invalid items found:", invalidItems);
      toast.error("Some items have invalid bag type information. Please remove and re-add them.");
      return;
    }

    try {
      setLoading(true);

      const requestData = {
        customerId: parseInt(customerId),
        doId: parseInt(doId),
        doNumber: doId,
        items: invoiceItems.map(item => ({
          id: item.id,
          bagTypeId: Number(item.bagTypeId),
          quantity: item.quantity.toString(),
          price: item.price,
          total: item.total,
          doNumber: item.doNumber,
        })),
        userId: invoiceInfo?.user_id || 1,
      };

      console.log("Submitting updated invoice data:", requestData);

      const response = await fetch(`/api/sales/invoice/${params.id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Invoice updated successfully");
        router.push("/sales/invoice");
      } else {
        throw new Error(result.error || "Failed to update invoice");
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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
                  <a href="/dashboard">Dashboard</a>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <a href="/sales/invoice">Invoice</a>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbPage>Edit Invoice</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {loading && <Loading />}

        <div className="container mx-auto p-4">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label htmlFor="customer">Customer Name</Label>
                <Select
                  value={customerId}
                  onValueChange={handleCustomerChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Please Select Customer" />
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

              {/* DO Number Selection */}
              <div className="space-y-2">
                <Label htmlFor="doNumber">DO #</Label>
                <Select
                  value={doId}
                  onValueChange={handleDoNumberChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select DO Number" />
                  </SelectTrigger>
                  <SelectContent>
                    {doNumbers.map((doNumber) => (
                      <SelectItem
                        key={doNumber.id}
                        value={doNumber.id.toString()}
                      >
                        {doNumber.id.toString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border p-4 rounded-md mb-6">
              <h3 className="text-lg font-semibold mb-4">Add Invoice Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Bag Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="bagType">Bags Type</Label>
                  <Select
                    value={selectedBagTypeId}
                    onValueChange={handleBagTypeChange}
                    disabled={!doId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Bag Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {bagTypes.map((bagType) => (
                        <SelectItem
                          key={bagType.id}
                          value={bagType.id.toString()}
                        >
                          {bagType.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Qty</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="Enter price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    readOnly
                  />
                </div>

                {/* Add Button */}
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!selectedBagTypeId || !quantity}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Items Table */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Bag Type</TableHead>
                      <TableHead>DO #</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Item Price</TableHead>
                      <TableHead className="text-right">Item Total</TableHead>
                      <TableHead className="w-[50px]">#</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No items added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoiceItems.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.bagType}</TableCell>
                          <TableCell>{item.doNumber}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">{item.price}</TableCell>
                          <TableCell className="text-right">{item.total}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {invoiceItems.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-right font-bold">
                          Total:
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {totalAmount}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/sales/invoice")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={invoiceItems.length === 0 || loading}
              >
                Update Invoice
              </Button>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}