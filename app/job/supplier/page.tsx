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

type SupplierInfo = {
    supplier_id: number;
    supplier_name: string;
    supplier_company: string;
    supplier_email: string;
    supplier_address: string;
    supplier_contact_no: string;
};

export default function SupplierInfoTable() {
    const [data, setData] = React.useState<SupplierInfo[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");            // Immediate search input state
    const [debouncedSearch, setDebouncedSearch] = React.useState("");  // Debounced search state
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [new_supplier_name, setNewCustomerName] = React.useState("");
    const [new_supplier_company, setNewSupplierCompany] = React.useState("");
    const [new_supplier_email, setNewCustomerEmail] = React.useState("");
    const [new_supplier_address, setNewCustomerAddress] = React.useState("");
    const [new_supplier_contact_no, setNewCustomerMobile] = React.useState("");
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
            const response = await fetch(`/api/job/supplier`);
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
                item.supplier_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.supplier_email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.supplier_address.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.supplier_contact_no.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [data, debouncedSearch]);

    const columns: ColumnDef<SupplierInfo>[] = [
        {
            accessorKey: "supplier_id",
            header: "ID",
        },
        {
            accessorKey: "supplier_name",
            header: "Supplier Name",
        },
        {
            accessorKey: "supplier_company",
            header: "Company Name",
        },
        {
            accessorKey: "supplier_email",
            header: "Email",
        },
        {
            accessorKey: "supplier_address",
            header: "Address",
        },
        {
            accessorKey: "supplier_contact_no",
            header: "Mobile",
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const item = row.original;
                const [supplier_name, setCustomerName] = React.useState(row.original.supplier_name);
                const [supplier_company, setSupplier] = React.useState(row.original.supplier_company);
                const [supplier_email, setEmail] = React.useState(row.original.supplier_email);
                const [supplier_contact_no, setMobile] = React.useState(row.original.supplier_contact_no);
                const [supplier_address, setAddress] = React.useState(row.original.supplier_address);

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
                                    <DialogTitle>Edit Roll Type {row.original.supplier_name}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Input placeholder="Enter Supplier Name" value={supplier_name} onChange={(e) => setCustomerName(e.target.value)} className="col-span-4" />
                                        <Input placeholder="Enter Supplier Company" value={supplier_company} onChange={(e) => setSupplier(e.target.value)} className="col-span-4" />
                                        <Input placeholder="Enter Email" value={supplier_email} onChange={(e) => setEmail(e.target.value)} className="col-span-4" />
                                        <Input placeholder="Enter Customer Mobile" value={supplier_contact_no} onChange={(e) => setMobile(e.target.value)} className="col-span-4" />
                                        <Input placeholder="Enter Address" value={supplier_address} onChange={(e) => setAddress(e.target.value)} className="col-span-4" />
                                    </div>
                                </div>
                                <Button variant="primary" size="sm" onClick={() => handleEdit(item.supplier_id, supplier_name, supplier_company, supplier_email, supplier_contact_no, supplier_address)}>
                                    Update
                                </Button>
                            </DialogContent>
                        </Dialog>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item.supplier_id)}>
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

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this entry?")) return;

        try {
            await fetch(`/api/job/supplier/`, {
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

    const handleEdit = async (id: number, supplier_name: string, supplier_company: string, supplier_email: string, supplier_contact_no: string, supplier_address: string) => {
        try {
            await fetch(`/api/job/supplier/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, supplier_name, supplier_company, supplier_email, supplier_contact_no, supplier_address }),
            });
            toast({ description: "Entry updated successfully!", variant: "default" });
            fetchData(); // Refresh data
        } catch (error) {
            toast({ description: "Failed to update entry", variant: "destructive" });
        }
    };

    const handleAdd = async (supplier_name: string, supplier_company: string, supplier_email: string, supplier_contact_no: string, supplier_address: string) => {
        try {
            await fetch(`/api/job/supplier/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ supplier_name, supplier_company, supplier_email, supplier_contact_no, supplier_address }),
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
                                    <BreadcrumbPage className="text-2xl font-bold">Supplier</BreadcrumbPage>
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
                                    Add New Supplier
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Supplier</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col gap-4 py-4">
                                    <div className="flex flex-col w-full items-start gap-4">
                                        <label >Supplier Name</label>
                                        <Input placeholder="Enter Supplier Name" value={new_supplier_name} onChange={(e) => setNewCustomerName(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col w-full items-start gap-4">
                                        <label >Supplier Company</label>
                                        <Input placeholder="Enter Supplier Company" value={new_supplier_company} onChange={(e) => setNewSupplierCompany(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col w-full items-start gap-4">
                                        <label >Email</label>
                                        <Input placeholder="Enter Email" value={new_supplier_email} onChange={(e) => setNewCustomerEmail(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col w-full items-start gap-4">
                                        <label >Mobile</label>
                                        <Input placeholder="Enter Mobile" value={new_supplier_contact_no} onChange={(e) => setNewCustomerMobile(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col w-full items-start gap-4">
                                        <label >Address</label>
                                        <Input placeholder="Enter Address" value={new_supplier_address} onChange={(e) => setNewCustomerAddress(e.target.value)} />
                                    </div>
                                </div>
                                <Button variant="primary" size="sm" onClick={() => handleAdd(new_supplier_name, new_supplier_company, new_supplier_email, new_supplier_contact_no, new_supplier_address)}>
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
