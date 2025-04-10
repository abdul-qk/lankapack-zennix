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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, PlusCircle, EyeIcon, Trash, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Trash2, Eye } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Loading from "@/components/layouts/loading";
import Link from "next/link";

type BillInfo = {
    bill_info_id: number;
    customer_name: string;
    bill_do: string;
    bill_total: string;
    add_date: string;
    customer_id: number;
    user_id: number;
    del_ind: number;
};

export default function InvoiceTable() {
    const [data, setData] = React.useState<BillInfo[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [itemToDelete, setItemToDelete] = React.useState<number | null>(null);
    const { toast } = useToast();

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    // Fetch data on component mount
    React.useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/sales/invoice`);
            const result = await response.json();
            if (result.data) {
                setData(result.data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch invoice data"
            });
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        try {
            const response = await fetch(`/api/sales/invoice?id=${id}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Invoice deleted successfully"
                });
                // Refresh data after deletion
                fetchData();
            } else {
                throw new Error(result.error || "Failed to delete");
            }
        } catch (error) {
            console.error("Error deleting invoice:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete invoice"
            });
        }

        // Close the dialog
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    // Open delete confirmation dialog
    const confirmDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteDialogOpen(true);
    };

    // Filter data based on search input
    const filteredData = React.useMemo(() => {
        if (!debouncedSearch) return data;
        return data.filter(
            (item) =>
                item.customer_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.bill_do.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.bill_info_id.toString().includes(debouncedSearch)
        );
    }, [data, debouncedSearch]);

    const columns: ColumnDef<BillInfo>[] = [
        {
            accessorKey: "bill_info_id",
            header: "ID",
        },
        {
            accessorKey: "customer_name",
            header: "Customer Name",
        },
        {
            accessorKey: "bill_do",
            header: "DO No",
        },
        {
            id: "add_date",
            header: "Date",
            cell: ({ row }) => {
                const date = new Date(row.original.add_date);
                return date.toLocaleDateString('en-GB');
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const billInfo = row.original;

                return (
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/sales/invoice/view/${billInfo.bill_info_id}`}>
                                <Button variant="outline" size="sm">
                                    <Eye size={16} />
                                </Button>
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/sales/invoice/edit/${billInfo.bill_info_id}`}>
                                <Button variant="outline" size="sm">
                                    <Pencil size={16} />
                                </Button>
                            </Link>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => confirmDelete(billInfo.bill_info_id)}>
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
                                    <BreadcrumbPage className="text-2xl font-bold">Invoices</BreadcrumbPage>
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
                        <Link href="/sales/invoice/new">
                            <Button variant={'primary'}>
                                <PlusCircle />
                                Add New Invoice
                            </Button>
                        </Link>
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will delete the invoice. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => itemToDelete && handleDelete(itemToDelete)}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SidebarProvider>
    );
}