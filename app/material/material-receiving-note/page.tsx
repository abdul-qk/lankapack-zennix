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
import { Pencil, Trash2, Eye, PlusCircle, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, UploadCloud, Download } from "lucide-react"; // Added UploadCloud, Download
import Link from "next/link";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Loading from "@/components/layouts/loading";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"; // Added Dialog components
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"; // Added Select components
import { Label } from "@/components/ui/label"; // Added Label

type SupplierInfo = {
    supplier_id: number;
    supplier_name: string;
    supplier_company: string;
    supplier_address: string;
    supplier_contact_no: string;
    supplier_email: string;
}

// Added Supplier type for dropdown
type Supplier = {
    supplier_id: number;
    supplier_name: string;
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

    // State for import dialog
    const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
    const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = React.useState<string>("");
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [isUploading, setIsUploading] = React.useState(false);

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
        fetchSuppliers(); // Fetch suppliers for the dialog
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/material/material-receiving-note`);
            const result = await response.json();
            setData(result.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ description: "Failed to fetch material notes", variant: "destructive" });
        }
        setLoading(false);
    };

    // Fetch suppliers for the import dialog dropdown
    const fetchSuppliers = async () => {
        try {
            // Assuming an endpoint exists to fetch just suppliers, similar to the add page
            // Adjust the endpoint if necessary
            const response = await fetch(`/api/job/supplier`); // Corrected endpoint based on directory structure
            if (!response.ok) throw new Error('Failed to fetch suppliers');
            const data = await response.json();
            setSuppliers(data.data || []); // Adjust based on actual API response structure
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            toast({ description: "Failed to fetch suppliers for import", variant: "destructive" });
        }
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

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    // Handle CSV download
    const handleDownloadSample = () => {
        // Trigger download via a link or direct fetch
        window.location.href = '/api/material/material-receiving-note/import/sample';
    };

    // Handle file upload
    const handleUpload = async () => {
        if (!selectedSupplierId || !selectedFile) {
            toast({ description: "Please select a supplier and a CSV file.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("supplierId", selectedSupplierId);
        formData.append("file", selectedFile);

        try {
            const response = await fetch('/api/material/material-receiving-note/import', {
                method: 'POST',
                body: formData,
                // No 'Content-Type' header needed, browser sets it for FormData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Upload failed');
            }

            const result = await response.json();
            toast({ description: result.message || "File imported successfully!" });
            setIsImportDialogOpen(false); // Close dialog on success
            setSelectedFile(null); // Reset file input
            setSelectedSupplierId(""); // Reset supplier
            fetchData(); // Refresh the table data
        } catch (error: any) {
            console.error("Error uploading file:", error);
            toast({ description: error.message || "Failed to import file.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

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

    if (loading) return <Loading />;

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
                        <div className="flex space-x-2"> {/* Wrap buttons */} 
                            {/* Import Button and Dialog */}
                            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant={'outline'}> {/* Changed variant */} 
                                        <UploadCloud className="mr-2 h-4 w-4" />
                                        Import
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Import Material Items</DialogTitle>
                                        <DialogDescription>
                                            Select a supplier and upload a CSV file with material details.
                                            <Button variant="link" className="p-0 h-auto ml-1" onClick={handleDownloadSample}>
                                                <Download className="mr-1 h-3 w-3" /> Download Sample CSV
                                            </Button>
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="supplier" className="text-right">
                                                Supplier
                                            </Label>
                                            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select a supplier" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {suppliers.map(supplier => (
                                                        <SelectItem key={supplier.supplier_id} value={String(supplier.supplier_id)}>
                                                            {supplier.supplier_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="csvFile" className="text-right">
                                                CSV File
                                            </Label>
                                            <Input
                                                id="csvFile"
                                                type="file"
                                                accept=".csv"
                                                onChange={handleFileChange}
                                                className="col-span-3"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleUpload} disabled={isUploading || !selectedSupplierId || !selectedFile}>
                                            {isUploading ? "Uploading..." : "Upload"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Add New Button */}
                            <Link href={`/material/material-receiving-note/add`}>
                                <Button variant={'primary'}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> {/* Added margin */} 
                                    Add New Material Note
                                </Button>
                            </Link>
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
