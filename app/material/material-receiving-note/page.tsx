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
import { Pencil, Trash2, Eye, PlusCircle } from "lucide-react";
import Link from "next/link";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";

type SupplierInfo = {
    supplier_id: number;
    supplier_name: string;
    supplier_company: string;
    supplier_address: string;
    supplier_contact_no: string;
    supplier_email: string;
}

type MaterialInfo = {
    material_info_id: number;
    supplier: SupplierInfo;
    total_reels: number;
    total_net_weight: number;
    total_gross_weight: number;
    add_date: string;
};

export default function MaterialInfoTable() {
    const [data, setData] = React.useState<MaterialInfo[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");            // Immediate search input state
    const [debouncedSearch, setDebouncedSearch] = React.useState("");  // Debounced search state
    const [sorting, setSorting] = React.useState<SortingState>([]);
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
            const response = await fetch(`/api/material/material-receiving-note`);
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
                // Add Supplier Name Search
                item.supplier.supplier_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.material_info_id.toString().includes(debouncedSearch) ||
                item.total_reels.toString().includes(debouncedSearch) ||
                item.total_net_weight.toString().includes(debouncedSearch) ||
                item.total_gross_weight.toString().includes(debouncedSearch) ||
                new Date(item.add_date).toLocaleDateString().includes(debouncedSearch)
        );
    }, [data, debouncedSearch]);

    const columns: ColumnDef<MaterialInfo>[] = [
        {
            accessorKey: "material_info_id",
            header: "ID",
        },
        {
            accessorKey: "supplier.supplier_name",
            header: "Supplier Name",
        },
        {
            accessorKey: "total_reels",
            header: "Total Reels",
        },
        {
            accessorKey: "total_net_weight",
            header: "Total Net Weight",
        },
        {
            accessorKey: "total_gross_weight",
            header: "Total Gross Weight",
        },
        {
            accessorKey: "add_date",
            header: "Added Date",
            cell: ({ row }) => new Date(row.original.add_date).toLocaleDateString(),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex space-x-2">
                        <Link href={`/material/material-receiving-note/view/${item.material_info_id}`}>
                            <Button variant="outline" size="sm">
                                <Eye size={16} />
                            </Button>
                        </Link>
                        <Link href={`/material/material-receiving-note/edit/${item.material_info_id}`}>
                            <Button variant="outline" size="sm">
                                <Pencil size={16} />
                            </Button>
                        </Link>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item.material_info_id)}>
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

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this entry?")) return;

        try {
            await fetch(`/api/material/material-receiving-note`, {
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

    if (loading) return <p>Loading...</p>;

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
                                    <BreadcrumbPage className="text-2xl font-bold">Material Receiving Note</BreadcrumbPage>
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
                        <Link href={`/material/material-receiving-note/add`}>
                            <Button variant={'primary'}>
                                <PlusCircle />
                                Add New Material Note
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

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            Next
                        </Button>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
