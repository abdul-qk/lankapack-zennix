// /app/api/cutting/delete-barcode/[cuttingId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withMonitoring, logSystemEvent, logUserActivity } from "@/lib/monitoring";
import appLogger from "@/lib/logger";

export const DELETE = withMonitoring(async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const endpoint = `/api/cutting/delete-barcode/${params.id}`;
  const method = "DELETE";
  
  try {
    console.log("Input cuttingId:", params.id);
    const cuttingId = parseInt(params.id);
    console.log("Received cuttingId:", cuttingId);

    if (isNaN(cuttingId)) {
      const responseTime = Date.now() - startTime;
      
      appLogger.warn("Invalid cutting ID for deletion", {
        endpoint,
        method,
        providedId: params.id,
        responseTime,
      });
      
      return NextResponse.json(
        { error: "Invalid cutting ID" },
        { status: 400 }
      );
    }

    // Log the API request start
    appLogger.info("Deleting cutting barcode", {
      endpoint,
      method,
      cuttingId,
      timestamp: new Date().toISOString(),
    });

    const barcode = await prisma.hps_cutting.findFirst({
      where: { cutting_id: cuttingId },
      select: { roll_barcode_no: true },
    });

    if (!barcode) {
      const responseTime = Date.now() - startTime;
      
      appLogger.warn("Barcode not found in cutting table", {
        endpoint,
        method,
        cuttingId,
        responseTime,
      });
      
      return NextResponse.json(
        { error: "Barcode not found in cutting table" },
        { status: 404 }
      );
    }

    const stockItem = await prisma.hps_stock.findFirst({
      where: {
        stock_barcode: Number(barcode.roll_barcode_no),
      },
    });

    if (!stockItem) {
      const responseTime = Date.now() - startTime;
      
      appLogger.warn("Barcode not found in stock or not available", {
        endpoint,
        method,
        cuttingId,
        barcode: barcode.roll_barcode_no,
        responseTime,
      });
      
      return NextResponse.json(
        { error: "Barcode not found in stock or not available" },
        { status: 404 }
      );
    }

    await prisma.hps_stock.update({
      where: {
        stock_id: stockItem.stock_id,
      },
      data: {
        material_status: 0, // Set status to 0 indicating the roll is available
        material_used_buy: 1,
      },
    });

    // Hard delete the cutting record
    await prisma.hps_cutting.delete({
      where: { cutting_id: cuttingId },
    });

    const responseTime = Date.now() - startTime;
    
    // Log successful response
    appLogger.logApiRequest({
      method,
      endpoint,
      statusCode: 200,
      responseTime,
      requestId: request.headers.get('x-request-id') || undefined,
    });

    // Log system event for successful deletion
    await logSystemEvent({
      level: 'INFO',
      message: 'Successfully deleted cutting barcode',
      context: {
        endpoint,
        cuttingId,
        barcode: barcode.roll_barcode_no,
        responseTime,
      },
      source: 'cutting-api',
      request,
    });

    return NextResponse.json(
      { success: true, message: "Barcode deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error details
    appLogger.error("Error deleting barcode", {
      endpoint,
      method,
      cuttingId: params.id,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);

    // Log system event for error
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to delete cutting barcode',
      context: {
        endpoint,
        cuttingId: params.id,
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      },
      source: 'cutting-api',
      request,
    });

    return NextResponse.json(
      { error: "Failed to delete barcode", details: error },
      { status: 500 }
    );
  }
}, {
  logToDatabase: true,
  logToFile: true,
  trackPerformance: true,
  trackUserActivity: true,
});
