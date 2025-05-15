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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Pencil, PlusCircle, EyeIcon, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Filter } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Loading from "@/components/layouts/loading";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type CompleteItemInfo = {
    complete_item_id: number;
    complete_item_date: string;
    bundle_type: string;
    complete_item_bags: string;
    complete_item_barcode: string;
    complete_item_weight: string;
    del_ind: number;
};

type NonCompleteInfo = {
    non_complete_id: number;
    non_complete_info: number;
    non_complete_bags: string;
    non_complete_barcode: string;
    non_complete_weight: string;
    del_ind: number;
}

export default function FinishingGoodsTable() {
    const [data, setData] = React.useState<CompleteItemInfo[]>([]);
    const [nonCompleteData, setNonCompleteData] = React.useState<NonCompleteInfo[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [uniqueSizes, setUniqueSizes] = React.useState<string[]>([]);
    const [sizeFilter, setSizeFilter] = React.useState("all");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const { toast } = useToast();

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    // Initial data fetch on component mount
    React.useEffect(() => {
        fetchData();
    }, []);

    // Fetch data when filters change
    React.useEffect(() => {
        fetchData();
    }, [sizeFilter, statusFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Construct the URL with filter parameters
            let url = `/api/stock/finishingGoods?`;
            if (sizeFilter !== "all") {
                url += `size=${encodeURIComponent(sizeFilter)}&`;
            }
            if (statusFilter !== "all") {
                url += `status=${encodeURIComponent(statusFilter)}`;
            }

            const response = await fetch(url);
            const result = await response.json();
            setData(result.data.complete_items);
            setNonCompleteData(result.data.non_complete_items);


            // Extract unique sizes for the filter dropdown (only on initial load)
            if (uniqueSizes.length === 0 && result.data.complete_items.length > 0) {
                // Use object keys to get unique values instead of Set
                const sizeMap: Record<string, boolean> = {};
                result.data.complete_items.forEach((item: CompleteItemInfo) => {
                    if (item.bundle_type) {
                        sizeMap[item.bundle_type] = true;
                    }
                });
                const sizes = Object.keys(sizeMap);
                setUniqueSizes(sizes);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch data"
            });
        }
        setLoading(false);
    };

    // Filter data based on the search input
    const filteredData = React.useMemo(() => {
        if (!debouncedSearch) return data;
        return data.filter(
            (item) =>
                item.complete_item_bags.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.complete_item_weight.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.complete_item_barcode.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.bundle_type.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [data, debouncedSearch]);

    const columns: ColumnDef<CompleteItemInfo>[] = [
        {
            accessorKey: "complete_item_id",
            header: "ID",
        },
        {
            accessorKey: "complete_item_barcode",
            header: "Barcode",
        },
        {
            accessorKey: "bundle_type",
            header: "Size",
        },
        {
            accessorKey: "complete_item_weight",
            header: "Weight",
        },
        {
            accessorKey: "complete_item_bags",
            header: "No of Bags",
        },
        {
            id: "complete_item_date",
            header: "Date",
            cell: ({ row }) => {
                const date = new Date(row.original.complete_item_date);
                return date.toLocaleDateString('en-GB');
            },
        },
        {
            id: "del_ind",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.del_ind;
                return (
                    <Badge variant={status === 1 ? "default" : "secondary"}>
                        {status === 0 ? "OUT" : "IN"}
                    </Badge>
                );
            }
            // cell: ({ row }) => row.original.del_ind === 0 ? "In" : "Out",
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
                                    <BreadcrumbPage className="text-2xl font-bold">Finishing Goods</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="container mx-auto p-4">
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            {/* Search Input */}
                            <div className="flex-1">
                                <Input
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="max-w-sm"
                                />
                            </div>

                            {/* Filters Section */}
                            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                                <div className="flex items-center gap-2">
                                    <Filter size={16} className="text-gray-500" />
                                    <span className="text-sm font-medium">Filters:</span>
                                </div>

                                {/* Size Filter */}
                                <Select value={sizeFilter} onValueChange={setSizeFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select Size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sizes</SelectItem>
                                        {uniqueSizes.map((size) => (
                                            <SelectItem key={size} value={size}>
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Status Filter */}
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="in">In</SelectItem>
                                        <SelectItem value="out">Out</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
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
                        <tfoot className="bg-slate-100">
                            <TableRow>
                                <TableCell colSpan={3}>
                                </TableCell>
                                <TableCell className="text-left font-semibold text-sm">
                                    Total Bags:
                                </TableCell>
                                <TableCell colSpan={3} className="font-bold">
                                    {table.getRowModel().rows.reduce((total, row) => total + parseInt(row.original.complete_item_bags || '0', 10), 0)}
                                </TableCell>
                            </TableRow>
                        </tfoot>
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