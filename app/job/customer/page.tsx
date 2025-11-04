"use client";

import * as React from "react";
import {
    ColumnDef,
    SortingState,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, PlusCircle, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Loading from "@/components/layouts/loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { set } from "date-fns";

type CustomerInfo = {
    customer_id: number;
    customer_full_name: string;
    customer_email_address: string;
    customer_address: string;
    contact_person: string;
    customer_mobile: string;
    customer_tel: string;
    customer_add_date: string;
};

export default function CustomerInfoTable() {
    const [data, setData] = React.useState<CustomerInfo[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");            // Immediate search input state
    const [debouncedSearch, setDebouncedSearch] = React.useState("");  // Debounced search state
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [new_customer_name, setNewCustomerName] = React.useState("");
    const [new_customer_email, setNewCustomerEmail] = React.useState("");
    const [new_customer_address, setNewCustomerAddress] = React.useState("");
    const [new_contact_person, setNewContactPerson] = React.useState("");
    const [new_customer_mobile, setNewCustomerMobile] = React.useState("");
    const [new_customer_tel, setNewCustomerTel] = React.useState("");

    const [form, setForm] = React.useState({
        customer_full_name: "",
        customer_email_address: "",
        customer_tel: "",
        customer_mobile: "",
        contact_person: "",
        customer_address: "",
    });
    
    const [errors, setErrors] = React.useState({
        customer_full_name: "",
        customer_email_address: "",
        customer_tel: "",
        customer_mobile: "",
        contact_person: "",
        customer_address: "",
    });

    const { toast } = useToast();

    // Debounce search input to optimize filtering
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);  // Update the debounced state after 300ms
        }, 300);

        return () => clearTimeout(timer);  // Clear the timeout on cleanup
    }, [search]);

    // Fetch data on component mount (or when search state changes)
    React.useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/job/customer`);
            const result = await response.json();
            setData(result.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Failed to fetch data");
        }
        setLoading(false);
    };

    // Filter data based on the debounced search input
    const filteredData = React.useMemo(() => {
        if (!debouncedSearch) return data;
        return data.filter(
            (item) =>
                item.customer_full_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.customer_email_address?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.customer_address?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.contact_person?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.customer_mobile?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.customer_tel?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [data, debouncedSearch]);

    const columns: ColumnDef<CustomerInfo>[] = [
        {
            accessorKey: "customer_id",
            header: "ID",
        },
        {
            accessorKey: "customer_full_name",
            header: "Company Name",
        },
        {
            accessorKey: "contact_person",
            header: "Contact Person",
            // Handle empty values
            cell: ({ row }) => {
                const value = row.getValue("contact_person");
                return value || "-";
            },
        },
        {
            accessorKey: "customer_email_address",
            header: "Email",
        },
        {
            accessorKey: "customer_address",
            header: "Address",
        },
        {
            accessorKey: "customer_mobile",
            header: "Mobile",
        },
        {
            accessorKey: "customer_tel",
            header: "Telephone",
        },
        {
            accessorKey: "customer_add_date",
            header: "Date",
            cell: ({ row }) => new Date(row.original.customer_add_date).toLocaleDateString(),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const item = row.original;
                const [customer_full_name, setCustomerName] = React.useState(row.original.customer_full_name);
                const [customer_email_address, setEmail] = React.useState(row.original.customer_email_address);
                const [customer_tel, setTel] = React.useState(row.original.customer_tel);
                const [customer_mobile, setMobile] = React.useState(row.original.customer_mobile);
                const [contact_person, setContactPerson] = React.useState(row.original.contact_person);
                const [customer_address, setAddress] = React.useState(row.original.customer_address);

                return (
                    <div className="flex space-x-2">
                        <Dialog>
                            <DialogTrigger>
                                <Button variant="outline" size="sm">
                                    <Pencil size={16} />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Customer {row.original.customer_full_name}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="flex flex-col justify-start items-center gap-4">
                                        <div className="flex flex-col w-full items-start gap-2">
                                            <label >Company Name</label>
                                            <Input placeholder="Enter Company Name" value={customer_full_name} onChange={(e) => setCustomerName(e.target.value)} className="col-span-4" />
                                        </div>
                                        <div className="flex flex-col w-full items-start gap-2">
                                            <label >Email</label>
                                            <Input placeholder="Enter Email" value={customer_email_address} onChange={(e) => setEmail(e.target.value)} className="col-span-4" />
                                        </div>
                                        <div className="flex flex-col w-full items-start gap-2">
                                            <label >Telephone</label>
                                            <Input placeholder="Enter Customer Telephone" value={customer_tel} onChange={(e) => setTel(e.target.value)} className="col-span-4" />
                                        </div>
                                        <div className="flex flex-col w-full items-start gap-2">
                                            <label >Mobile</label>
                                            <Input placeholder="Enter Customer Mobile" value={customer_mobile} onChange={(e) => setMobile(e.target.value)} className="col-span-4" />
                                        </div>
                                        <div className="flex flex-col w-full items-start gap-2">
                                            <label >Contact Person</label>
                                            <Input placeholder="Enter Contact Person" value={contact_person} onChange={(e) => setContactPerson(e.target.value)} className="col-span-4" />
                                        </div>
                                        <div className="flex flex-col w-full items-start gap-2">
                                            <label >Address</label>
                                            <Input placeholder="Enter Address" value={customer_address} onChange={(e) => setAddress(e.target.value)} className="col-span-4" />
                                        </div>
                                    </div>
                                </div>
                                <Button variant="primary" size="sm" onClick={() => handleEdit(item.customer_id, customer_full_name, customer_email_address, customer_tel, customer_mobile, contact_person, customer_address)}>
                                    Update
                                </Button>
                            </DialogContent>
                        </Dialog>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item.customer_id)}>
                            <Trash2 size={16} />
                        </Button>
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const totalPages = table.getPageCount();
    const currentPage = table.getState().pagination.pageIndex + 1;

    const visiblePageNumbers = React.useMemo(() => {
        const pageNumbers: number[] = [];
        const maxVisiblePages = 3;
        const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }
        return pageNumbers;
    }, [currentPage, totalPages]);

    const validateForm = () => {
        const newErrors: typeof errors = {
            customer_full_name: form.customer_full_name ? "" : "Company name is required",
            customer_email_address: "",
            customer_tel: "",
            customer_mobile: "",
            contact_person: "",
            customer_address: "",
        };
        setErrors(newErrors);
        // Return true if no errors
        return Object.values(newErrors).every(err => !err);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this entry?")) return;

        try {
            await fetch(`/api/job/customer/`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            toast({ description: "Entry deleted successfully!" });
            fetchData(); // Refresh data
        } catch (error) {
            toast({ description: "Failed to delete entry", variant: "destructive" });
        }
    };

    const handleEdit = async (id: number, customer_full_name: string, customer_email_address: string, customer_tel: string, customer_mobile: string, contact_person: string, customer_address: string) => {
        if (!validateForm()) return;
        try {
            await fetch(`/api/job/customer/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, customer_full_name, customer_email_address, customer_tel, customer_mobile, contact_person, customer_address }),
            });
            toast({ description: "Entry updated successfully!", variant: "default" });
            fetchData(); // Refresh data
        } catch (error) {
            toast({ description: "Failed to update entry", variant: "destructive" });
        }
    };

    const handleAdd = async (customer_full_name: string, customer_email_address: string, customer_tel: string, customer_mobile: string, contact_person: string, customer_address: string) => {
        if (!validateForm()) return;
        try {
            await fetch(`/api/job/customer/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_full_name, customer_email_address, customer_tel, customer_mobile, contact_person, customer_address }),
            });
            toast({ description: "Entry added successfully!" });
            fetchData(); // Refresh data
        } catch (error) {
            toast({ description: "Failed to add entry", variant: "destructive" });
        }
    }

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
                                    <BreadcrumbPage className="text-2xl font-bold">Customer</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="container mx-auto p-4">
                    <div className="flex items-center justify-between py-4">
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm"
                        />
                        <Dialog>
                            <DialogTrigger>
                                <Button variant={'primary'}>
                                    <PlusCircle />
                                    Add New Customer
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Customer</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col gap-4 py-4">
                                    <div className="flex flex-col w-full items-start gap-2">
                                        <label >Company Name</label>
                                        <div className="flex flex-col w-full items-start gap-1">
                                            <Input placeholder="Enter Company Name" value={form.customer_full_name}
                                                onChange={e => {
                                                    setForm({ ...form, customer_full_name: e.target.value });
                                                    if (errors.customer_full_name) setErrors({ ...errors, customer_full_name: "" });
                                                }}
                                            />
                                            {errors.customer_full_name && <span className="error text-sm text-red-700">{errors.customer_full_name}</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col w-full items-start gap-2">
                                        <label >Email</label>
                                        <div className="flex flex-col w-full items-start gap-1">
                                            <Input placeholder="Enter Email (Optional)" value={form.customer_email_address}
                                                onChange={e => {
                                                    setForm({ ...form, customer_email_address: e.target.value });
                                                    if (errors.customer_email_address) setErrors({ ...errors, customer_email_address: "" });
                                                }}
                                            />
                                            {errors.customer_email_address && <span className="error text-sm text-red-700">{errors.customer_email_address}</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col w-full items-start gap-2">
                                        <label >Tel</label>
                                        <div className="flex flex-col w-full items-start gap-1">
                                            <Input placeholder="Enter Tel (Optional)" value={form.customer_tel}
                                                onChange={e => {
                                                    setForm({ ...form, customer_tel: e.target.value });
                                                    if (errors.customer_tel) setErrors({ ...errors, customer_tel: "" });
                                                }}
                                            />
                                            {errors.customer_tel && <span className="error text-sm text-red-700">{errors.customer_tel}</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col w-full items-start gap-2">
                                        <label >Mobile</label>
                                        <div className="flex flex-col w-full items-start gap-1">
                                            <Input placeholder="Enter Mobile (Optional)" value={form.customer_mobile}
                                                onChange={e => {
                                                    setForm({ ...form, customer_mobile: e.target.value });
                                                    if (errors.customer_mobile) setErrors({ ...errors, customer_mobile: "" });
                                                }}
                                            />
                                            {errors.customer_mobile && <span className="error text-sm text-red-700">{errors.customer_mobile}</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col w-full items-start gap-2">
                                        <label >Contact Person</label>
                                        <div className="flex flex-col w-full items-start gap-1">
                                            <Input placeholder="Enter Contact Person (Optional)" value={form.contact_person}
                                                onChange={e => {
                                                    setForm({ ...form, contact_person: e.target.value });
                                                    if (errors.contact_person) setErrors({ ...errors, contact_person: "" });
                                                }}
                                            />
                                            {errors.contact_person && <span className="error text-sm text-red-700">{errors.contact_person}</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col w-full items-start gap-2">
                                        <label >Address</label>
                                        <div className="flex flex-col w-full items-start gap-1">
                                            <Input placeholder="Enter Address (Optional)" value={form.customer_address}
                                                onChange={e => {
                                                    setForm({ ...form, customer_address: e.target.value });
                                                    if (errors.customer_address) setErrors({ ...errors, customer_address: "" });
                                                }}
                                            />
                                            {errors.customer_address && <span className="error text-sm text-red-700">{errors.customer_address}</span>}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="primary" size="sm" onClick={() => handleAdd(
                                    form.customer_full_name,
                                    form.customer_email_address,
                                    form.customer_tel,
                                    form.customer_mobile,
                                    form.contact_person,
                                    form.customer_address
                                )}>
                                    Add
                                </Button>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-end space-x-2 pt-8">
                        {/* First Page */}
                        <Button variant="outline" size="sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                            <ChevronsLeft size={16} />
                        </Button>

                        {/* Previous Page */}
                        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                            <ChevronLeft size={16} />
                        </Button>

                        {/* Page Numbers */}
                        {visiblePageNumbers.map((page) => (
                            <Button
                                key={page}
                                variant={page === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => table.setPageIndex(page - 1)}
                            >
                                {page}
                            </Button>
                        ))}

                        {/* Next Page */}
                        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            <ChevronRight size={16} />
                        </Button>

                        {/* Last Page */}
                        <Button variant="outline" size="sm" onClick={() => table.setPageIndex(totalPages - 1)} disabled={!table.getCanNextPage()}>
                            <ChevronsRight size={16} />
                        </Button>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
