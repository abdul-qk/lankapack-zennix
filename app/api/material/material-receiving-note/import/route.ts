import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { sanitizeString } from "@/lib/sanitize";
import Papa from 'papaparse';
import { Readable } from 'stream';

// Helper function to convert Node.js Readable stream to string
async function streamToString(stream: Readable): Promise<string> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const supplierId = formData.get('supplierId') as string;
        const file = formData.get('file') as File | null;

        if (!supplierId || !file) {
            return NextResponse.json({ message: 'Supplier ID and file are required.' }, { status: 400 });
        }

        if (file.type !== 'text/csv') {
            return NextResponse.json({ message: 'Invalid file type. Please upload a CSV file.' }, { status: 400 });
        }

        // Convert File stream to Node.js Readable stream
        const readableStream = Readable.fromWeb(file.stream() as any); // Type assertion needed
        const csvContent = await streamToString(readableStream);

        // Parse CSV data
        const parseResult = Papa.parse(csvContent, {
            header: true, // Assumes first row is header
            skipEmptyLines: true,
            dynamicTyping: true, // Automatically convert types
        });

        if (parseResult.errors.length > 0) {
            console.error('CSV Parsing Errors:', parseResult.errors);
            return NextResponse.json({ message: 'Error parsing CSV file.', errors: parseResult.errors }, { status: 400 });
        }

        const itemsData = parseResult.data as any[]; // Type assertion, validate below

        // --- Data Validation (Example - Adjust based on your exact CSV structure and requirements) ---
        const requiredHeaders = [
            'material_item_reel_no',
            'material_colour',
            'material_item_particular',
            'material_item_variety', // Match schema field name
            'material_item_gsm',
            'material_item_size',
            'material_item_net_weight',
            'material_item_gross_weight'
        ];

        const actualHeaders = parseResult.meta.fields;
        // Check if all required headers are present
        if (!actualHeaders || !requiredHeaders.every(header => actualHeaders.includes(header))) {
            return NextResponse.json({ message: `CSV must contain the following headers: ${requiredHeaders.join(', ')}` }, { status: 400 });
        }

        const validatedItems = [];
        const itemsToCreate: Array<{
            material_item_reel_no: string;
            material_colour: string;
            material_item_particular: number | null;
            material_item_variety: string;
            material_item_gsm: string;
            material_item_size: string;
            material_item_net_weight: string;
            material_item_gross_weight: string;
            material_item_barcode: string;
            added_date: Date;
            user_id: number;
            material_status: number;
        }> = [];
        for (const item of itemsData) {

            // Basic validation: check if required fields exist and have some value
            // Now strictly checks for 'material_item_variety'
            if (!item.material_item_reel_no || !item.material_colour || !item.material_item_particular || !item.material_item_variety || item.material_item_gsm == null || item.material_item_size == null || item.material_item_net_weight == null || item.material_item_gross_weight == null) {
                console.warn('Skipping invalid row due to missing essential data:', item);
                continue; // Skip rows with missing essential data
            }

            // Validate and fetch color name from color ID
            const colorId = parseInt(String(item.material_colour), 10);
            if (isNaN(colorId)) {
                console.warn('Skipping row due to invalid color ID:', item);
                continue;
            }
            const color = await prisma.hps_colour.findUnique({
                where: { colour_id: colorId },
                select: { colour_name: true }
            });
            if (!color) {
                console.warn(`Skipping row due to non-existent color ID: ${colorId}`, item);
                continue;
            }

            // Validate and parse particular ID
            let particularId: number | null = null;
            const particularValue = item.material_item_particular;
            if (particularValue !== null && particularValue !== '' && !isNaN(Number(particularValue))) {
                particularId = parseInt(String(particularValue), 10);
            } else if (particularValue) {
                console.warn(`Skipping row due to invalid non-numeric particular value: ${particularValue}`, item);
                continue; // Skip row if particular is present but not a number
            }

            // Validate numeric fields before parsing
            const netWeight = item.material_item_net_weight;
            const grossWeight = item.material_item_gross_weight;

            if (isNaN(parseFloat(netWeight)) || isNaN(parseFloat(grossWeight))) {
                console.warn('Skipping invalid row due to non-numeric weight:', item);
                continue; // Skip rows with non-numeric weights
            }

            const itemDataForDb = {
                material_item_reel_no: sanitizeString(item.material_item_reel_no),
                material_colour: color.colour_name,
                material_item_particular: particularId, // Use parsed ID or null
                material_item_variety: sanitizeString(item.material_item_variety),
                material_item_gsm: sanitizeString(item.material_item_gsm),
                material_item_size: sanitizeString(item.material_item_size),
                // Store weights as strings as per schema
                material_item_net_weight: sanitizeString(netWeight),
                material_item_gross_weight: sanitizeString(grossWeight),
                // Default values or values not in CSV
                material_item_barcode: '0', // Example default
                added_date: new Date(),
                user_id: 1, // TODO: Get actual user ID from session/auth
                material_status: 0, // Example default
            };

            // Keep track of parsed floats for summary calculation
            validatedItems.push({
                ...itemDataForDb,
                // Keep numeric weights for calculation
                numeric_net_weight: parseFloat(netWeight),
                numeric_gross_weight: parseFloat(grossWeight),
            });
            // Prepare data specifically for Prisma create
            itemsToCreate.push(itemDataForDb);
        }

        if (itemsToCreate.length === 0) {
            return NextResponse.json({ message: 'No valid items found in the CSV file after validation.' }, { status: 400 });
        }

        // --- Database Insertion ---
        // Calculate totals using the numeric weights stored in validatedItems
        const totalNetWeight = validatedItems.reduce((sum, item) => sum + item.numeric_net_weight, 0);
        const totalGrossWeight = validatedItems.reduce((sum, item) => sum + item.numeric_gross_weight, 0);

        // Create material info and items in an interactive transaction to handle barcode updates
        const result = await prisma.$transaction(async (tx) => {
            const newMaterialInfo = await tx.hps_material_info.create({
                data: {
                    material_supplier: parseInt(supplierId, 10),
                    total_reels: itemsToCreate.length,
                    total_net_weight: totalNetWeight,
                    total_gross_weight: totalGrossWeight,
                    add_date: new Date(),
                    user_id: 1, // TODO: Get actual user ID
                    material_info_status: 1,
                    material_items: {
                        create: itemsToCreate as Array<{
                            material_item_reel_no: string;
                            material_colour: string;
                            material_item_particular: number | null;
                            material_item_variety: string;
                            material_item_gsm: string;
                            material_item_size: string;
                            material_item_net_weight: string;
                            material_item_gross_weight: string;
                            material_item_barcode: string;
                            added_date: Date;
                            user_id: number;
                            material_status: number;
                        }>
                    }
                },
                include: {
                    material_items: true,
                },
            });

            // Update barcodes for all created items
            const updatePromises = newMaterialInfo.material_items.map(item => {
                const barcode = `${item.material_item_id}${item.material_item_reel_no}`;
                return tx.hps_material_item.update({
                    where: { material_item_id: item.material_item_id },
                    data: { material_item_barcode: barcode }
                });
            });

            const updatedItems = await Promise.all(updatePromises);

            // Create stock entries for each material item
            const stockEntries = updatedItems.map(item => ({
                material_item_particular: item.material_item_particular || 0,
                material_used_buy: 1,
                main_id: newMaterialInfo.material_info_id,
                material_item_id: item.material_item_id,
                item_gsm: item.material_item_gsm,
                stock_barcode: BigInt(item.material_item_barcode),
                material_item_size: item.material_item_size,
                item_net_weight: item.material_item_net_weight,
                stock_date: new Date(),
                material_status: 0
            }));

            await tx.hps_stock.createMany({
                data: stockEntries
            });

            return { ...newMaterialInfo, material_items: updatedItems };
        });

        return NextResponse.json({ message: `Successfully imported ${itemsToCreate.length} items.`, data: result }, { status: 201 });

    } catch (error: any) {
        console.error('Import API Error:', error);
        // Check for Prisma-specific errors if needed
        return NextResponse.json({ error: "Failed to import data." }, { status: 500 });
  }
}