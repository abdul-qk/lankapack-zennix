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
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";

type Particular = {
    particular_id: number;
    particular_name: string;
    particular_status: number;
    added_date: string;
};

export default function ParticularTable() {
    const [data, setData] = React.useState<Particular[]>([]);
    const [filteredData, setFilteredData] = React.useState<Particular[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState(""); // Immediate input state
    const [debouncedSearch, setDebouncedSearch] = React.useState(""); // Debounced search state
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [isPopupOpen, setIsPopupOpen] = React.useState(false);
    const [currentParticular, setCurrentParticular] = React.useState<Particular | null>(null);
    const [newParticularName, setNewParticularName] = React.useState("");
    const [new_particular_name, setAddNewParticularName] = React.useState("");
    const { toast } = useToast();

    // Debounce search input by 300ms
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search); // Update the debounced state after 300ms
        }, 300);

        return () => clearTimeout(timer); // Clear timeout on cleanup
    }, [search]);

    // Trigger data filtering whenever data or debounced search changes
    React.useEffect(() => {
        filterData();
    }, [data, debouncedSearch]);

    React.useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/material/particular`);
            const result = await response.json();
            setData(result.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Failed to fetch data");
        }
        setLoading(false);
    };

    const handleAddOrEdit = async () => {
        const method = currentParticular ? "PUT" : "POST";
        const url = `/api/material/particular`;
        const body = currentParticular
            ? { id: currentParticular.particular_id, particular_name: newParticularName }
            : { particular_name: newParticularName };

        try {
            await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            fetchData();
            closePopup();
        } catch (error) {
            console.error(`Error ${method === "POST" ? "adding" : "editing"} particular:`, error);
            alert(`Failed to ${method === "POST" ? "add" : "edit"} particular`);
        }
    };

    const handleAdd = async (particular_name: string) => {
        try {
            await fetch(`/api/material/particular/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ particular_name }),
            });
            toast({ description: "Entry added successfully!" });
            fetchData(); // Refresh data
        } catch (error) {
            toast({ description: "Failed to add entry", variant: "destructive" });
        }
    }

    const handleToggleStatus = async (id: number, status: number) => {
        try {
            await fetch(`/api/material/particular`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: status === 1 ? 0 : 1 }),
            });
            fetchData();
        } catch (error) {
            console.error("Error toggling status:", error);
            alert("Failed to toggle status");
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this particular? This action cannot be undone.")) return;
        try {
            await fetch(`/api/material/particular`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            fetchData();
        } catch (error) {
            console.error("Error deleting particular:", error);
            alert("Failed to delete particular");
        }
    };

    const openPopup = (particular?: Particular) => {
        setCurrentParticular(particular || null);
        setNewParticularName(particular?.particular_name || "");
        setIsPopupOpen(true);
    };

    const closePopup = () => {
        setIsPopupOpen(false);
        setCurrentParticular(null);
        setNewParticularName("");
    };

    const filterData = () => {
        if (!debouncedSearch) {
            setFilteredData(data);
            return;
        }

        const filtered = data.filter(
            (item) =>
                item.particular_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                item.particular_id.toString().includes(debouncedSearch) ||
                item.particular_status.toString().includes(debouncedSearch)
        );

        setFilteredData(filtered);
    };

    const columns: ColumnDef<Particular>[] = [
        {
            accessorKey: "particular_id",
            header: "ID",
        },
        {
            accessorKey: "particular_name",
            header: "Particular Name",
        },
        {
            accessorKey: "particular_status",
            header: "Status",
            cell: ({ row }) => {
                const [status, setStatus] = React.useState(row.original.particular_status === 1 ? true : false);

                const handleChange = async (checked: boolean) => {
                    try {
                        setStatus(checked);  // Update the switch state
                        await handleToggleStatus(row.original.particular_id, status ? 1 : 0);
                    } catch (error) {
                        alert("Failed to update status");
                    }
                };

                return (
                    <div className="flex items-center space-x-2">
                        <Switch checked={status} onCheckedChange={handleChange} />
                        <span>{status ? "Active" : "Inactive"}</span>
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const item = row.original;

                return (
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openPopup(item)}>
                            <Pencil size={16} />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item.particular_id)}>
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
                                    <BreadcrumbPage className="text-2xl font-bold">Particulars</BreadcrumbPage>
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
                                    Add New Particular
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Particular</DialogTitle>
                                </DialogHeader>
                                <div className="flex gap-4 py-4">
                                    <div className="flex flex-col w-full items-start gap-4">
                                        <label>Particular Name</label>
                                        <Input placeholder="Enter Particular Name" value={new_particular_name} onChange={(e) => setAddNewParticularName(e.target.value)} />
                                    </div>
                                </div>
                                <Button variant="primary" size="sm" onClick={() => handleAdd(new_particular_name)}>
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

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            Next
                        </Button>
                    </div>

                    {/* Dialog for Add/Edit Particular */}
                    <Dialog open={isPopupOpen} onOpenChange={closePopup}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{currentParticular ? "Edit Particular" : "Add New Particular"}</DialogTitle>
                            </DialogHeader>
                            <Input
                                placeholder="Enter particular name"
                                value={newParticularName}
                                onChange={(e) => setNewParticularName(e.target.value)}
                            />
                            <DialogFooter>
                                <Button onClick={handleAddOrEdit}>
                                    {currentParticular ? "Update" : "Add"}
                                </Button>
                                <Button variant="outline" onClick={closePopup}>
                                    Cancel
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
