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
import { useAuth } from "@/hooks/use-auth";
import { useConfirmAction } from "@/components/confirm-action-dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Loading from "@/components/layouts/loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type SheetTypeInfo = {
    sheet_id: number;
    sheet_type: string;
    sheet_price: string;
};

export default function SheetTypeTable() {
    const [data, setData] = React.useState<SheetTypeInfo[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [new_sheet_type, setNewSheetType] = React.useState("");
    const [new_sheet_price, setNewSheetPrice] = React.useState("");
    const [addOpen, setAddOpen] = React.useState(false);
    const { toast } = useToast();

    
    const { isAdmin } = useAuth();
    const { requestConfirm, dialog } = useConfirmAction();
React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    React.useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/job/sheettype`);
            const result = await response.json();
            setData(result.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Failed to fetch data");
        }
        setLoading(false);
    };

    const filteredData = React.useMemo(() => {
        if (!debouncedSearch) return data;
        return data.filter(
            (item) =>
                item.sheet_price.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.sheet_type.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [data, debouncedSearch]);

    const columns: ColumnDef<SheetTypeInfo>[] = [
        {
            accessorKey: "sheet_id",
            header: "ID",
        },
        {
            accessorKey: "sheet_type",
            header: "Sheet Type",
        },
        {
            accessorKey: "sheet_price",
            header: "Price",
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const item = row.original;
                const [sheet_type, setSheetType] = React.useState(row.original.sheet_type);
                const [sheet_price, setSheetPrice] = React.useState(row.original.sheet_price);

                return (
                    <div className="flex space-x-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Pencil size={16} />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Sheet Type</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor={`sheet_type_${item.sheet_id}`}>Sheet Type</label>
                                        <Input
                                            id={`sheet_type_${item.sheet_id}`}
                                            maxLength={120}
                                            value={sheet_type}
                                            onChange={(e) => setSheetType(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor={`sheet_price_${item.sheet_id}`}>Price</label>
                                        <Input
                                            id={`sheet_price_${item.sheet_id}`}
                                            maxLength={12}
                                            value={sheet_price}
                                            onChange={(e) => setSheetPrice(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleEdit(item.sheet_id, sheet_type, sheet_price)}
                                >
                                    Update
                                </Button>
                            </DialogContent>
                        </Dialog>
                        {isAdmin && (
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item.sheet_id)}>
                            <Trash2 size={16} />
                        </Button>
                        )}
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

    const handleDelete = (id: number) => {
        requestConfirm(
            "Delete this entry?",
            "This action cannot be undone. Are you sure you want to delete this record?",
            async () => {
                try {
                    const res = await fetch(`/api/job/sheettype/`, {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id }),
                    });
                    if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        toast({
                            description: data.message || data.error || "Failed to delete entry",
                            variant: "destructive",
                        });
                        return;
                    }
                    toast({ description: "Entry deleted successfully!" });
                    fetchData();
                } catch {
                    toast({ description: "Failed to delete entry", variant: "destructive" });
                }
            },
            "Delete"
        );
    };

    const handleEdit = async (id: number, sheet_type: string, sheet_price: string) => {
        try {
            const response = await fetch(`/api/job/sheettype/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, sheet_type, sheet_price }),
            });
            const result = await response.json();
            if (!response.ok) {
                toast({ description: result.error || "Failed to update entry", variant: "destructive" });
                return;
            }
            toast({ description: "Entry updated successfully!" });
            fetchData();
        } catch (error) {
            toast({ description: "Failed to update entry", variant: "destructive" });
        }
    };

    const handleAdd = async (sheet_type: string, sheet_price: string) => {
        try {
            const response = await fetch(`/api/job/sheettype/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sheet_type, sheet_price }),
            });
            const result = await response.json();
            if (!response.ok) {
                toast({ description: result.error || "Failed to add entry", variant: "destructive" });
                return;
            }
            toast({ description: "Entry added successfully!" });
            setNewSheetType("");
            setNewSheetPrice("");
            setAddOpen(false);
            fetchData();
        } catch (error) {
            toast({ description: "Failed to add entry", variant: "destructive" });
        }
    };

    if (loading) {
        return <Loading />;
    }

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
                                    <BreadcrumbPage className="text-2xl font-bold">Sheet Type</BreadcrumbPage>
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
                        <Dialog open={addOpen} onOpenChange={setAddOpen}>
                            <DialogTrigger asChild>
                                <Button variant="primary">
                                    <PlusCircle />
                                    Add New Sheet Type
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Sheet Type</DialogTitle>
                                </DialogHeader>
                                <div className="flex gap-4 py-4">
                                    <div className="flex flex-col w-full items-start gap-4">
                                        <label htmlFor="new_sheet_type">Sheet Type</label>
                                        <Input
                                            id="new_sheet_type"
                                            maxLength={120}
                                            placeholder="Enter Sheet Type"
                                            value={new_sheet_type}
                                            onChange={(e) => setNewSheetType(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col w-full items-start gap-4">
                                        <label htmlFor="new_sheet_price">Price</label>
                                        <Input
                                            id="new_sheet_price"
                                            maxLength={12}
                                            placeholder="Enter Price"
                                            value={new_sheet_price}
                                            onChange={(e) => setNewSheetPrice(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleAdd(new_sheet_type, new_sheet_price)}
                                >
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
                        <Button variant="outline" size="sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                            <ChevronsLeft size={16} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                            <ChevronLeft size={16} />
                        </Button>
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
                        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            <ChevronRight size={16} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => table.setPageIndex(totalPages - 1)} disabled={!table.getCanNextPage()}>
                            <ChevronsRight size={16} />
                        </Button>
                    </div>
                </div>
            </SidebarInset>
                    {dialog}
        </SidebarProvider>
    );
}
