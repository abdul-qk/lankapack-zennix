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
import Link from "next/link";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Loading from "@/components/layouts/loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { set } from "date-fns";

type BagTypeInfo = {
    bag_id: number;
    bag_type: string;
    bag_price: string;
    bags_select: number;
};

export default function BagTypeTable() {
    const [data, setData] = React.useState<BagTypeInfo[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");            // Immediate search input state
    const [debouncedSearch, setDebouncedSearch] = React.useState("");  // Debounced search state
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [new_bag_type, setNewBagType] = React.useState("");
    const [new_bags_select, setNewBagsSelect] = React.useState("");
    const [new_bag_price, setNewBagPrice] = React.useState("");
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
            const response = await fetch(`/api/job/bagtype`);
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
                item.bag_price.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.bag_type.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [data, debouncedSearch]);

    const columns: ColumnDef<BagTypeInfo>[] = [
        {
            accessorKey: "bag_id",
            header: "ID",
        },
        {
            accessorKey: "bags_select",
            header: "Bags Select",
            cell: ({ row }) => {
                // If the value is 1, return "No Printing", else if value is 2 then return "Printing"
                return row.original.bags_select === 1 ? "No Printing" : "Printing";
            }
        },
        {
            accessorKey: "bag_type",
            header: "Bag Type",
        },
        {
            accessorKey: "bag_price",
            header: "Bag Price",
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const item = row.original;
                const [bag_type, setBagType] = React.useState(row.original.bag_type);
                const [bags_select, setBagsSelect] = React.useState(row.original.bags_select);
                const [bag_price, setBagPrice] = React.useState(row.original.bag_price);

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
                                    <DialogTitle>Edit Bag Type {row.original.bag_type}</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col gap-4">
                                    <div className="flex w-full gap-4">
                                        <Input id="bag_type" name="bag_type" value={bag_type} onChange={(e) => setBagType(e.target.value)} />
                                    </div>
                                    <div className="flex w-full gap-4">
                                        <Input id="bag_price" name="bag_price" value={bag_price} onChange={(e) => setBagPrice(e.target.value)} />
                                    </div>
                                    <Select value={bags_select.toString()} onValueChange={(e) => setBagsSelect(Number(e))}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">No Printing</SelectItem>
                                            <SelectItem value="2">Printing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button variant="primary" size="sm" onClick={() => handleEdit(item.bag_id, bag_type, bags_select, bag_price)}>
                                    Update
                                </Button>
                            </DialogContent>
                        </Dialog>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item.bag_id)}>
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
            await fetch(`/api/job/bagtype/`, {
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

    const handleEdit = async (id: number, bag_type: string, bags_select: number, bag_price: string) => {
        try {
            await fetch(`/api/job/bagtype/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, bag_type, bags_select, bag_price }),
            });
            toast({ description: "Entry updated successfully!" });
            fetchData(); // Refresh data
        } catch (error) {
            toast({ description: "Failed to update entry", variant: "destructive" });
        }
    };


    const handleAdd = async (bag_type: string, bags_select: number, bag_price: string) => {
        try {
            await fetch(`/api/job/bagtype/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bag_type, bags_select, bag_price }),
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
                                    <BreadcrumbPage className="text-2xl font-bold">Bag Type</BreadcrumbPage>
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
                                    Add New Bag Type
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Bag Type</DialogTitle>
                                </DialogHeader>
                                <div className="flex gap-4 py-4">
                                    <div className="flex flex-col w-full items-start gap-4">
                                        <label htmlFor="new_bag_type">Bag Type</label>
                                        <Input id="new_bag_type" name="new_bag_type" placeholder="Enter Bag Type" value={new_bag_type} onChange={(e) => setNewBagType(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col w-full items-start gap-4">
                                        <label htmlFor="new_bag_price">Bag Price</label>
                                        <Input id="new_bag_price" name="new_bag_price" placeholder="Enter Bag Price" value={new_bag_price} onChange={(e) => setNewBagPrice(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col w-full items-start gap-4">
                                        <label htmlFor="new_bag_price">Select Type</label>
                                        <Select value={new_bags_select} onValueChange={(e) => setNewBagsSelect(e)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">No Printing</SelectItem>
                                                <SelectItem value="2">Printing</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button variant="primary" size="sm" onClick={() => handleAdd(new_bag_type, Number(new_bags_select), new_bag_price)}>
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
