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
import { ArrowUpDown, FilterIcon, CalendarIcon, XCircle, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Loading from "@/components/layouts/loading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

interface ParticularInfo {
    particular_id: number;
    particular_name: string;
}

type StockItem = {
    item_gsm: string;
    material_item_size: string;
};

type StockInfo = {
    stock_id: number;
    stock_date: string;
    stock_barcode: string;
    material_used_buy: string;
    material_status: string;
    material_item_size: string;
    material_item_particular: string;
    material_item_id: string;
    item_net_weight: string;
    item_gsm: string;
};

interface FilterState {
    materialId: string;
    inDate: Date | undefined;
    outDate: Date | undefined;
    size: string;
    gsm: string;
    status: string;
}

export default function StockTable() {
    const [data, setData] = React.useState<StockInfo[]>([]);
    const [materials, setMaterials] = React.useState<ParticularInfo[]>([]);
    const [filterState, setFilterState] = React.useState<FilterState>({
        materialId: "all",
        inDate: undefined,
        outDate: undefined,
        size: "all",
        gsm: "all",
        status: "all",
    });
    const [uniqueGsm, setUniqueGsm] = React.useState<string[]>([]);
    const [uniqueSizes, setUniqueSizes] = React.useState<string[]>([]);

    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const { toast } = useToast();

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    // Handle filter changes
    const updateFilter = (key: keyof FilterState, value: any) => {
        setFilterState(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Reset all filters
    const resetFilters = () => {
        setFilterState({
            materialId: "all",
            inDate: undefined,
            outDate: undefined,
            size: "all",
            gsm: "all",
            status: "all",
        });
        setSearch("");
    };

    // Fetch data when filters change
    React.useEffect(() => {
        fetchData();
    }, [filterState]);

    // Fetch unique values for dropdowns on component mount
    React.useEffect(() => {
        fetchUniqueValues();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();

            if (filterState.materialId && filterState.materialId !== "all") {
                params.append("materialId", filterState.materialId);
            }

            if (filterState.inDate) {
                params.append("indatepicker", filterState.inDate.toISOString());
            }

            if (filterState.outDate) {
                params.append("outdatepicker", filterState.outDate.toISOString());
            }

            if (filterState.size && filterState.size !== "all") {
                params.append("size_id", filterState.size);
            }

            if (filterState.gsm && filterState.gsm !== "all") {
                params.append("item_gsm", filterState.gsm);
            }

            if (filterState.status && filterState.status !== "all") {
                params.append("status_id", filterState.status);
            }

            const url = `/api/stock/stock?${params.toString()}`;
            console.log("Fetching from:", url);

            const response = await fetch(url);
            const result = await response.json();

            if (result.data && result.particulars) {
                setData(result.data.data || []);
                setMaterials(result.particulars || []);
            } else {
                console.error("Unexpected API response format:", result);
                toast({
                    title: "Error",
                    description: "Received invalid data format from API",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({
                title: "Error",
                description: "Failed to fetch stock data",
                variant: "destructive",
            });
        }
        setLoading(false);
    };

    const fetchUniqueValues = async () => {
        try {
            const response = await fetch(`/api/stock/unique`);
            const result = await response.json();

            if (result?.data && Array.isArray(result.data)) {
                const parsedData: StockItem[] = result.data as StockItem[];

                // Strip GSM suffix if present
                const uniqueGsm = Array.from(
                    new Set(
                        parsedData
                            .map((item) => item.item_gsm?.replace("GSM", "").trim())
                            .filter(Boolean)
                    )
                );

                // Strip CM suffix if present
                const uniqueSizes = Array.from(
                    new Set(
                        parsedData
                            .map((item) => item.material_item_size?.replace("CM", "").trim())
                            .filter(Boolean)
                    )
                );

                setUniqueGsm(uniqueGsm);
                setUniqueSizes(uniqueSizes);
            }
        } catch (error) {
            console.error("Error fetching unique values:", error);
            toast({
                title: "Error",
                description: "Failed to fetch filter options",
                variant: "destructive",
            });
        }
    };

    // Filter data based on the debounced search input
    const filteredData = React.useMemo(() => {
        if (!debouncedSearch) return data;

        const searchLower = debouncedSearch.toLowerCase();
        return data.filter(item => {
            return Object.values(item).some(
                value =>
                    value &&
                    typeof value === 'string' &&
                    value.toLowerCase().includes(searchLower)
            );
        });
    }, [data, debouncedSearch]);

    const columns: ColumnDef<StockInfo>[] = [
        {
            accessorKey: "stock_id",
            header: "ID",
        },
        {
            accessorKey: "material_item_particular",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Particular
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        {
            accessorKey: "material_used_buy",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Section
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        {
            accessorKey: "stock_date",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const date = row.getValue("stock_date") as string;
                return date ? format(new Date(date), "MMM dd, yyyy") : "";
            }
        },
        {
            accessorKey: "material_item_id",
            header: "Item ID",
        },
        {
            accessorKey: "item_gsm",
            header: "GSM",
        },
        {
            accessorKey: "material_item_size",
            header: "Size",
        },
        {
            accessorKey: "item_net_weight",
            header: "Weight",
        },
        {
            accessorKey: "stock_barcode",
            header: "Barcode",
        },
        {
            accessorKey: "material_status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("material_status") as string;
                return (
                    <Badge variant={status === "IN" ? "default" : "secondary"}>
                        {status}
                    </Badge>
                );
            }
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
        pageCount: Math.ceil(filteredData.length / 10),
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

    const activeFiltersCount = Object.entries(filterState).filter(([key, val]) =>
        val !== undefined && val !== "all" && val !== null
    ).length;

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
                                    <BreadcrumbPage className="text-2xl font-bold">Stock</BreadcrumbPage>
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
                    {/* Filters */}
                    <div className="flex flex-col mt-2 mb-4">
                        <div className="pb-4 flex justify-between items-center">
                            <h3 className="text-lg font-semibold flex items-center">
                                <FilterIcon className="mr-2" size={16} />
                                Filter
                                {activeFiltersCount > 0 && (
                                    <Badge variant="outline" className="ml-2">
                                        {activeFiltersCount} active
                                    </Badge>
                                )}
                            </h3>
                            {activeFiltersCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="flex items-center"
                                >
                                    <XCircle className="mr-1 h-4 w-4" />
                                    Reset Filters
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {/* Select Material Dropdown */}
                            <Select
                                value={filterState.materialId}
                                onValueChange={(value) => updateFilter("materialId", value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Material" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Materials</SelectItem>
                                    {materials.map((material) => (
                                        <SelectItem key={material.particular_id} value={String(material.particular_id)}>
                                            {material.particular_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Pick IN Date from datepicker */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-[180px] justify-start text-left font-normal",
                                            !filterState.inDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filterState.inDate ? format(filterState.inDate, "PPP") : <span>From date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={filterState.inDate}
                                        onSelect={(date) => updateFilter("inDate", date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            {/* Pick OUT Date from datepicker */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-[180px] justify-start text-left font-normal",
                                            !filterState.outDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filterState.outDate ? format(filterState.outDate, "PPP") : <span>To date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={filterState.outDate}
                                        onSelect={(date) => updateFilter("outDate", date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            {/* Select Size Dropdown */}
                            <Select
                                value={filterState.size}
                                onValueChange={(value) => updateFilter("size", value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Size" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sizes</SelectItem>
                                    {uniqueSizes.map((size) => (
                                        <SelectItem key={size} value={size}>
                                            {size}CM
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Select GSM Dropdown */}
                            <Select
                                value={filterState.gsm}
                                onValueChange={(value) => updateFilter("gsm", value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select GSM" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All GSM</SelectItem>
                                    {uniqueGsm.map((gsm) => (
                                        <SelectItem key={gsm} value={gsm}>
                                            {gsm}GSM
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Select Status Dropdown */}
                            <Select
                                value={filterState.status}
                                onValueChange={(value) => updateFilter("status", value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="0">IN</SelectItem>
                                    <SelectItem value="1">OUT</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <hr />
                    <div className="rounded-md border mt-4">
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
                    </div>

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