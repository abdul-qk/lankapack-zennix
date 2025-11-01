// /app/api/cutting/add-barcode/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { withMonitoring, logSystemEvent, logUserActivity } from "@/lib/monitoring";
import appLogger from "@/lib/logger";

export const POST = withMonitoring(async function POST(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/cutting/add-barcode";
  const method = "POST";
  
  try {
    const { jobCardId, barcode, weight, userId } = await request.json();

    // Log the API request start
    appLogger.info("Adding cutting barcode", {
      endpoint,
      method,
      jobCardId,
      barcode,
      weight,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Validate inputs
    if (!jobCardId || !barcode || !weight || !userId) {
      const responseTime = Date.now() - startTime;
      
      appLogger.warn("Missing required fields for adding cutting barcode", {
        endpoint,
        method,
        providedFields: { jobCardId: !!jobCardId, barcode: !!barcode, weight: !!weight, userId: !!userId },
        responseTime,
      });
      
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the barcode exists in the hps_stock table
    const stockItem = await prisma.hps_stock.findFirst({
      where: {
        stock_barcode: BigInt(barcode),
      },
    });

    if (!stockItem) {
      const responseTime = Date.now() - startTime;
      
      appLogger.warn("Barcode not found in stock", {
        endpoint,
        method,
        barcode,
        responseTime,
      });
      
      return NextResponse.json(
        { error: "Barcode not found in stock or not available" },
        { status: 404 }
      );
    }

    // Create new cutting record
    const newCutting = await prisma.hps_cutting.create({
      data: {
        job_card_id: jobCardId,
        roll_barcode_no: barcode,
        cutting_weight: weight,
        number_of_roll: 1, // Default value, adjust as needed
        wastage: "0", // Default value, adjust as needed
        added_date: new Date(),
        user_id: userId,
        del_ind: 0,
      },
    });

    // Update the stock status to indicate it has been used (status = 1)
    await prisma.hps_stock.update({
      where: {
        stock_id: stockItem.stock_id,
      },
      data: {
        material_status: 1, // Set status to 1 indicating the roll has been used
        material_used_buy: 4,
      },
    });

    const responseTime = Date.now() - startTime;
    
    // Log successful response
    appLogger.logApiRequest({
      method,
      endpoint,
      statusCode: 201,
      responseTime,
      requestId: request.headers.get('x-request-id') || undefined,
    });

    // Log user activity
    await logUserActivity({
      userId: parseInt(userId),
      action: 'CREATE_CUTTING_BARCODE',
      resource: newCutting.cutting_id.toString(),
      details: {
        jobCardId,
        barcode,
        weight,
      },
      request,
    });

    // Log system event for successful creation
    await logSystemEvent({
      level: 'INFO',
      message: 'Successfully added cutting barcode',
      context: {
        endpoint,
        cuttingId: newCutting.cutting_id,
        jobCardId,
        barcode,
        weight,
        userId,
        responseTime,
      },
      source: 'cutting-api',
      request,
    });

    return NextResponse.json(
      { success: true, data: newCutting },
      { status: 201 }
    );
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    // Log error details
    appLogger.error("Error adding cutting barcode", {
      endpoint,
      method,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);

    // Log system event for error
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to add cutting barcode',
      context: {
        endpoint,
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      },
      source: 'cutting-api',
      request,
    });

    return NextResponse.json(
      { error: "Failed to add barcode", details: error.message },
      { status: 500 }
    );
  }
}, {
  logToDatabase: true,
  logToFile: true,
  trackPerformance: true,
  trackUserActivity: true,
});
