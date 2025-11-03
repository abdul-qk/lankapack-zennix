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
import { Pencil, Trash2, PlusCircle, EyeIcon, PencilIcon, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Loading from "@/components/layouts/loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type JobCardInfo = {
    job_card_id: number;
    customer_id: number;
    section_list: string;
    unit_price: string;
    customer: CustomerInfo;
    particular: ParticularInfo;
    printing_no_of_bag: string;
    add_date: string;
    updated_date: string;
    card_printting: number;
};

interface CustomerInfo {
    customer_id: number;
    customer_full_name: string;
}

interface ParticularInfo {
    particular_id: number;
    particular_name: string;
}

export default function SlitingTable() {
    const [data, setData] = React.useState<JobCardInfo[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");            // Immediate search input state
    const [debouncedSearch, setDebouncedSearch] = React.useState("");  // Debounced search state
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const { toast } = useToast();

    // Debounce search input to optimize filtering
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);  // Update the debounced state after 300ms
            console.log(search);
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
            const response = await fetch(`/api/printing/`);
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
                item.job_card_id.toString().includes(debouncedSearch) ||
                item.customer.customer_full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.particular.particular_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.printing_no_of_bag?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [data, debouncedSearch]);

    const columns: ColumnDef<JobCardInfo>[] = [
        {
            accessorKey: "job_card_id",
            header: "ID",
        },
        {
            accessorKey: "customer.customer_full_name",
            header: "Customer",
        },
        {
            accessorKey: "particular.particular_name",
            header: "Paper Roll",
        },
        {
            accessorKey: "printing_no_of_bag",
            header: "No of Bags",
        },
        {
            accessorKey: "add_date",
            header: "Added Date",
            cell: ({ row }) => new Date(row.original.add_date).toLocaleDateString(),
        },
        {
            accessorKey: "updated_date",
            header: "Updated Date",
            cell: ({ row }) => new Date(row.original.updated_date).toLocaleDateString(),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const item = row.original;

                return (
                    <div className="flex space-x-2">
                        <Link href={`/printing/view/${item.job_card_id}`}>
                            <Button variant="default" size="sm">
                                <EyeIcon size={16} />
                            </Button>
                        </Link>
                        <Link href={`/printing/edit/${item.job_card_id}`} onClick={(e) => item.card_printting === 1 && e.preventDefault()} style={{ pointerEvents: item.card_printting === 1 ? 'none' : 'auto' }}>
                            <Button variant="outline" size="sm" disabled={item.card_printting === 1}>
                                <PencilIcon size={16} />
                            </Button>
                        </Link>
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
                                    <BreadcrumbPage className="text-2xl font-bold">Printing</BreadcrumbPage>
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
