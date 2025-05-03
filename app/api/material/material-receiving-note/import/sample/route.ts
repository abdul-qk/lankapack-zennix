import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    // Define the path to the sample CSV file relative to the project root
    const filePath = path.resolve(process.cwd(), 'import.csv');

    try {
        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ message: 'Sample file not found.' }, { status: 404 });
        }

        // Read the file content
        const fileBuffer = fs.readFileSync(filePath);

        // Set headers for file download
        const headers = new Headers();
        headers.set('Content-Type', 'text/csv');
        headers.set('Content-Disposition', 'attachment; filename="sample_material_import.csv"');

        // Return the file content as a response
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: headers,
        });

    } catch (error) {
        console.error('Error serving sample CSV:', error);
        return NextResponse.json({ message: 'Error serving sample file.' }, { status: 500 });
    }
}