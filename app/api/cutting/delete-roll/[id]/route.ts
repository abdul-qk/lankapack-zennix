// /app/api/cutting/delete-barcode/[cuttingId]/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
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
    const cuttingId = parseInt(params.id);

    // Validate ID
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
    appLogger.info("Deleting cutting record", {
      endpoint,
      method,
      cuttingId,
      timestamp: new Date().toISOString(),
    });

    // First, get the cutting record to log details before deletion
    const cuttingRecord = await prisma.hps_cutting_roll.findUnique({
      where: { cutting_roll_id: cuttingId },
    });

    if (!cuttingRecord) {
      const responseTime = Date.now() - startTime;
      
      appLogger.warn("Cutting record not found for deletion", {
        endpoint,
        method,
        cuttingId,
        responseTime,
      });
      
      return NextResponse.json(
        { error: "Cutting record not found" },
        { status: 404 }
      );
    }

    // Hard delete the cutting record
    await prisma.hps_cutting_roll.delete({
      where: { cutting_roll_id: cuttingId },
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
      message: 'Successfully deleted cutting record',
      context: {
        endpoint,
        cuttingId,
        jobCardId: cuttingRecord.job_card_id,
        barcode: cuttingRecord.cutting_barcode,
        weight: cuttingRecord.cutting_roll_weight,
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
    appLogger.error("Error deleting cutting record", {
      endpoint,
      method,
      cuttingId: params.id,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);

    // Log system event for error
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to delete cutting record',
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
