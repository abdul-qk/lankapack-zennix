"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Pencil,
    Trash2,
    Eye,
    CircleCheckBig,
    PlusCircle,
    CalendarIcon,
    Check,
} from "lucide-react";
import Link from "next/link";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useToast } from "@/hooks/use-toast";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import Loading from "@/components/layouts/loading";
import { useRouter } from "next/navigation";

interface CustomerInfo {
    customer_id: number;
    customer_full_name: string;
    customer_email_address: string;
    customer_address: string;
    contact_person: string;
    customer_mobile: string;
    customer_tel: string;
    customer_add_date: string;
}

interface PaperRollInfo {
    particular_id: number;
    particular_name: string;
}

interface MaterialItem {
    item_gsm: string;
    material_item_size: string;
}

interface PrintSizeInfo {
    print_size_id: number;
    print_size: string;
}

interface CuttingInfo {
    cutting_id: number;
    cutting_type: string;
}

interface ColorInfo {
    colour_id: number;
    colour_name: string;
}

interface BagTypeInfo {
    bag_id: number;
    bag_type: string;
    bags_select: string;
}

export default function JobCardTable() {
    const [loading, setLoading] = React.useState(true);
    const [customer, setCustomer] = React.useState<CustomerInfo[]>();
    const [paperRolls, setPaperRolls] = React.useState<PaperRollInfo[]>();
    const [printSizes, setPrintSizes] = React.useState<PrintSizeInfo[]>();
    const [cuttingType, setCuttingType] = React.useState<CuttingInfo[]>();
    const [colours, setColours] = React.useState<ColorInfo[]>();
    const [bagTypes, setBagTypes] = React.useState<BagTypeInfo[]>([]);
    const [slitting, setSlitting] = React.useState(false);
    const [cutting, setCutting] = React.useState(false);
    const [printing, setPrinting] = React.useState(false);
    const [jobCardDate, setJobCardDate] = React.useState<Date>();
    const [deliveryDate, setDeliveryDate] = React.useState<Date>();
    const [selectedPaperRollId, setSelectedPaperRollId] = React.useState<null | string>(null);
    const [selectedCustomer, setSelectedCustomer] = React.useState<null | string>(null);
    const [selectedGsm, setSelectedGsm] = React.useState<string>("");
    const [selectedSize, setSelectedSize] = React.useState<string>("");
    const [materials, setMaterials] = React.useState<MaterialItem[]>([]);
    const { toast } = useToast();
    const router = useRouter();

    // New states for additional fields
    const [unitPrice, setUnitPrice] = React.useState<string>("");

    // Slitting section
    const [slittingValue, setSlittingValue] = React.useState<string>("");
    const [slittingRemark, setSlittingRemark] = React.useState<string>("");

    // Printing section
    const [printingCylinderSize, setPrintingCylinderSize] = React.useState<string>("");
    const [printingNumberOfBags, setPrintingNumberOfBags] = React.useState<string>("");
    const [printingColourType, setPrintingColourType] = React.useState<string>("");
    const [printingBlockSize, setPrintingBlockSize] = React.useState<string>("");
    const [printingRemark, setPrintingRemark] = React.useState<string>("");
    // Add state for number of colors and multiple color selections
    const [numberOfColors, setNumberOfColors] = React.useState<string>("1");
    const [selectedColors, setSelectedColors] = React.useState<string[]>([]);

    // Cutting section
    const [cuttingTypeSelected, setCuttingTypeSelected] = React.useState<string>("");
    const [cuttingNumberOfBags, setCuttingNumberOfBags] = React.useState<string>("");
    const [cuttingSelectedType, setCuttingSelectedType] = React.useState<string>("");
    const [cuttingBagType, setCuttingBagType] = React.useState<string>("");
    const [cuttingPrintName, setCuttingPrintName] = React.useState<string>("");
    const [cuttingFold, setCuttingFold] = React.useState<string>("");
    const [cuttingRemark, setCuttingRemark] = React.useState<string>("");

    React.useEffect(() => {
        fetchData();
        fetchBagTypeData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/job/jobcard/new/`);
            const data = await response.json();
            setCustomer(data.customerInfo);
            setPaperRolls(data.paperRolls);
            setPrintSizes(data.printSizes);
            setCuttingType(data.cuttingTypes);
            setColours(data.colors);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBagTypeData = async () => {
        try {
            const response = await fetch(`/api/job/bagtype/`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setBagTypes(data.data);
        } catch (error) {
            console.error("Error fetching bag type data:", error);
            return [];
        }
    };

    const handlePaperRollChange = async (id: string) => {
        setSelectedPaperRollId(id);

        try {
            const response = await fetch(`/api/job/jobcard/stock/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setMaterials(data.uniqueValues || []);

            // Reset selections when paper roll changes
            setSelectedGsm("");
            setSelectedSize("");
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleCustomerChange = async (id: string) => {
        setSelectedCustomer(id);
    };

    // Add this function to handle color selection
    const handleColorChange = (value: string, index: number) => {
        const newSelectedColors = [...selectedColors];
        newSelectedColors[index] = value;
        setSelectedColors(newSelectedColors);
    };

    // Add this effect to reset or initialize color selections when number changes
    React.useEffect(() => {
        const colorCount = parseInt(numberOfColors);
        setSelectedColors(prev => {
            // Preserve existing selections up to the new count
            const newSelections = prev.slice(0, colorCount);
            // Add empty selections if needed
            while (newSelections.length < colorCount) {
                newSelections.push("");
            }
            return newSelections;
        });
    }, [numberOfColors]);

    // Get unique GSM values
    const uniqueGsm = Array.from(
        new Map(materials.map((item) => [item.item_gsm, item.item_gsm])).values()
    );

    // Get sizes for the selected GSM
    const availableSizes = materials
        .filter((item) => item.item_gsm === selectedGsm)
        .map((item) => item.material_item_size);

    // Submit handler for the form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate main required fields
        if (
            !selectedCustomer ||
            !selectedPaperRollId ||
            !selectedGsm ||
            !selectedSize ||
            !jobCardDate ||
            !deliveryDate ||
            !unitPrice
        ) {
            toast({
                title: "Error",
                description: "Please fill out all required fields in the main form.",
                variant: "destructive",
            });
            return;
        }

        // console.log('Added Date:', jobCardDate?.toLocaleDateString())

        const payload = {
            customer_id: selectedCustomer,
            paper_roll_id: selectedPaperRollId,
            gsm: selectedGsm,
            size: selectedSize,
            job_card_date: jobCardDate?.toLocaleDateString(),
            delivery_date: deliveryDate?.toLocaleDateString(),
            unit_price: unitPrice,
            slitting: {
                active: slitting,
                value: slitting ? slittingValue : null,
                remark: slitting ? slittingRemark : null,
            },
            printing: {
                active: printing,
                cylinder_size: printing ? printingCylinderSize : null,
                number_of_bags: printing ? printingNumberOfBags : null,
                colour_type: printing ? printingColourType : null,
                block_size: printing ? printingBlockSize : null,
                remark: printing ? printingRemark : null,
                number_of_colors: printing ? numberOfColors : null,
                selected_colors: printing ? selectedColors : null,
            },
            cutting: {
                active: cutting,
                cutting_type: cutting ? cuttingTypeSelected : null,
                number_of_bags: cutting ? cuttingNumberOfBags : null,
                selected_type: cutting ? cuttingSelectedType : null,
                bag_type: cutting ? cuttingBagType : null,
                print_name: cutting ? cuttingPrintName : null,
                fold: cutting ? cuttingFold : null,
                remark: cutting ? cuttingRemark : null,
            },
        };

        try {
            const response = await fetch("/api/job/jobcard/new", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            await response.json();
            toast({
                title: "Success",
                description: "Job card submitted successfully!",
            });
            router.push("/job/jobCard");
        } catch (error) {
            console.error("Error submitting job card:", error);
            toast({
                title: "Submission Error",
                description:
                    "There was an error submitting the job card. Please try again.",
                variant: "destructive",
            });
        }
    };

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
                                    <BreadcrumbPage className="text-2xl font-bold">
                                        Add Job Card
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                {/* Wrap everything in a form */}
                <form onSubmit={handleSubmit} className="container mx-auto p-4">
                    <Card className="mb-6">
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Add New Job</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 w-full gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Customer</label>
                                    <Select onValueChange={handleCustomerChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a Customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customer?.map((customer) => (
                                                <SelectItem
                                                    key={customer.customer_id}
                                                    value={customer.customer_id.toString()}
                                                >
                                                    {customer.customer_full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Paper Roll</label>
                                    <Select onValueChange={handlePaperRollChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a Paper Roll" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paperRolls?.map((paperRoll) => (
                                                <SelectItem
                                                    key={paperRoll.particular_id}
                                                    value={paperRoll.particular_id.toString()}
                                                >
                                                    {paperRoll.particular_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">GSM</label>
                                    <Select
                                        onValueChange={(value) => {
                                            setSelectedGsm(value);
                                            setSelectedSize(""); // Reset size when GSM changes
                                        }}
                                        value={selectedGsm}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select GSM" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {uniqueGsm.map((gsm) => (
                                                <SelectItem key={gsm} value={gsm}>
                                                    {gsm}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Size</label>
                                    <Select
                                        onValueChange={(value) => setSelectedSize(value)}
                                        value={selectedSize}
                                        disabled={!selectedGsm}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select GSM to view sizes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableSizes.map((size) => (
                                                <SelectItem key={size} value={size}>
                                                    {size}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 w-full gap-4 mt-8">
                                <div className="flex flex-col gap-2 w-full">
                                    <label className="text-sm font-medium">Job Card Date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !jobCardDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {jobCardDate ? format(jobCardDate, "PPP") : "Pick a job card date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={jobCardDate}
                                                onSelect={setJobCardDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <label className="text-sm font-medium">Delivery date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !deliveryDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {deliveryDate
                                                    ? format(deliveryDate, "PPP")
                                                    : "Pick a delivery date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={deliveryDate}
                                                onSelect={setDeliveryDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Unit Price</label>
                                    <Input
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-4 mt-4">
                                    <div className="flex gap-2 items-center">
                                        <Checkbox
                                            checked={slitting}
                                            onCheckedChange={() => setSlitting(!slitting)}
                                        />
                                        <label className="text-sm font-medium">Slitting</label>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <Checkbox
                                            checked={printing}
                                            onCheckedChange={() => setPrinting(!printing)}
                                        />
                                        <label className="text-sm font-medium">Printing</label>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <Checkbox
                                            checked={cutting}
                                            onCheckedChange={() => setCutting(!cutting)}
                                        />
                                        <label className="text-sm font-medium">Cutting</label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Slitting Section */}
                    {slitting && (
                        <Card className="mb-6">
                            <CardHeader>
                                <h2 className="text-xl font-semibold">Slitting</h2>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-row gap-2 w-full">
                                    <div className="flex flex-col gap-2 w-3/12">
                                        <label className="text-sm font-medium">Slitting</label>
                                        <Input
                                            value={slittingValue}
                                            onChange={(e) => setSlittingValue(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 w-9/12">
                                        <label className="text-sm font-medium">Remark</label>
                                        <Textarea
                                            value={slittingRemark}
                                            onChange={(e) => setSlittingRemark(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {/* Printing Section */}
                    {printing && (
                        <Card className="mb-6">
                            <CardHeader>
                                <h2 className="text-xl font-semibold">Printing</h2>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-2 w-full">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Cylinder Size</label>
                                        <Select
                                            onValueChange={setPrintingCylinderSize}
                                            value={printingCylinderSize}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Cylinder Size" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {printSizes?.map((printSize) => (
                                                    <SelectItem
                                                        key={printSize.print_size_id}
                                                        value={String(printSize.print_size_id)}
                                                    >
                                                        {printSize.print_size}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Number Of Bags</label>
                                        <Input
                                            value={printingNumberOfBags}
                                            onChange={(e) => setPrintingNumberOfBags(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Number of Colors</label>
                                        <Select
                                            onValueChange={setNumberOfColors}
                                            value={numberOfColors}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Number of Colors" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1</SelectItem>
                                                <SelectItem value="2">2</SelectItem>
                                                <SelectItem value="3">3</SelectItem>
                                                <SelectItem value="4">4</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Block Size</label>
                                        <Input
                                            value={printingBlockSize}
                                            onChange={(e) => setPrintingBlockSize(e.target.value)}
                                        />
                                    </div>

                                    {/* Dynamically render color selection dropdowns */}
                                    {Array.from({ length: parseInt(numberOfColors) }).map((_, index) => (
                                        <div key={index} className="flex flex-col gap-2">
                                            <label className="text-sm font-medium">Color {index + 1}</label>
                                            <Select
                                                onValueChange={(value) => handleColorChange(value, index)}
                                                value={selectedColors[index] || ""}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={`Select Color ${index + 1}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {colours?.map((colourType) => (
                                                        <SelectItem
                                                            key={colourType.colour_id}
                                                            value={String(colourType.colour_id)}
                                                        >
                                                            {colourType.colour_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}

                                    <div className="flex flex-col gap-2 mt-2 col-span-2">
                                        <label className="text-sm font-medium">Remark</label>
                                        <Textarea
                                            value={printingRemark}
                                            onChange={(e) => setPrintingRemark(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {/* Cutting Section */}
                    {cutting && (
                        <Card className="mb-6">
                            <CardHeader>
                                <h2 className="text-xl font-semibold">Cutting</h2>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-5 gap-2 w-full">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Cutting Type</label>
                                        <Select
                                            onValueChange={setCuttingTypeSelected}
                                            value={cuttingTypeSelected}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Cutting Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cuttingType?.map((ct) => (
                                                    <SelectItem
                                                        key={ct.cutting_id}
                                                        value={String(ct.cutting_id)}
                                                    >
                                                        {ct.cutting_type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Number Of Bags</label>
                                        <Input
                                            value={cuttingNumberOfBags}
                                            onChange={(e) => setCuttingNumberOfBags(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Selected Type</label>
                                        <Select
                                            onValueChange={setCuttingSelectedType}
                                            value={cuttingSelectedType}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Your Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={"1"}>Non Printing</SelectItem>
                                                <SelectItem value={"2"}>Printing</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Bag Type</label>
                                        <Select
                                            onValueChange={setCuttingBagType}
                                            value={cuttingBagType}
                                            disabled={!cuttingSelectedType}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Bag Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cuttingSelectedType && bagTypes
                                                    .filter(bagType => bagType.bags_select.toString() === cuttingSelectedType)
                                                    .map(bagType => (
                                                        <SelectItem key={bagType.bag_id} value={bagType.bag_id.toString()}>
                                                            {bagType.bag_type}
                                                        </SelectItem>
                                                    ))}
                                                {cuttingSelectedType && bagTypes.filter(
                                                    bagType => bagType.bags_select.toString() === cuttingSelectedType
                                                ).length === 0 && (
                                                        <SelectItem value="no-match" disabled>
                                                            No matching bag types
                                                        </SelectItem>
                                                    )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Print Name</label>
                                        <Input
                                            value={cuttingPrintName}
                                            onChange={(e) => setCuttingPrintName(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 mt-2">
                                        <label className="text-sm font-medium">Fold</label>
                                        <Input
                                            value={cuttingFold}
                                            onChange={(e) => setCuttingFold(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 mt-2 col-span-2">
                                        <label className="text-sm font-medium">Remark</label>
                                        <Textarea
                                            value={cuttingRemark}
                                            onChange={(e) => setCuttingRemark(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <Button type="submit" className="w-2/12 bg-primary text-white py-2 rounded-md">
                        Save
                    </Button>
                </form>
            </SidebarInset>
        </SidebarProvider>
    );
}
