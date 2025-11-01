// /app/api/cutting/[id]/add-roll/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withMonitoring, logSystemEvent, logUserActivity } from "@/lib/monitoring";
import appLogger from "@/lib/logger";

export const POST = withMonitoring(async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const endpoint = `/api/cutting/${params.id}/add-roll`;
  const method = "POST";
  
  try {
    const jobCardId = parseInt(params.id);
    const { cutting_id, cutting_roll_weight, no_of_bags, cutting_wastage } =
      await request.json();

    // Validate ID
    if (isNaN(jobCardId)) {
      const responseTime = Date.now() - startTime;
      
      appLogger.warn("Invalid job card ID for adding cutting roll", {
        endpoint,
        method,
        providedId: params.id,
        responseTime,
      });
      
      return NextResponse.json(
        { error: "Invalid job card ID" },
        { status: 400 }
      );
    }

    // Log the API request start
    appLogger.info("Adding cutting roll", {
      endpoint,
      method,
      jobCardId,
      cutting_id,
      cutting_roll_weight,
      no_of_bags,
      cutting_wastage,
      timestamp: new Date().toISOString(),
    });

    // Validate inputs
    if (
      !cutting_id ||
      cutting_roll_weight === undefined || cutting_roll_weight === null ||
      no_of_bags === undefined || no_of_bags === null ||
      cutting_wastage === undefined || cutting_wastage === null
    ) {
      const responseTime = Date.now() - startTime;
      
      appLogger.warn("Missing required fields for adding cutting roll", {
        endpoint,
        method,
        providedFields: {
          cutting_id: !!cutting_id,
          cutting_roll_weight: cutting_roll_weight !== undefined && cutting_roll_weight !== null,
          no_of_bags: no_of_bags !== undefined && no_of_bags !== null,
          cutting_wastage: cutting_wastage !== undefined && cutting_wastage !== null
        },
        responseTime,
      });
      
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const highestRollRecord = await prisma.hps_cutting_roll.findFirst({
      orderBy: {
        cutting_roll_id: "desc",
      },
      select: {
        cutting_roll_id: true,
      },
    });

    const nextId = (highestRollRecord?.cutting_roll_id || 0) + 1;

    // Generate a unique barcode for this cutting roll
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const formattedDate = `${day}-${month}-${year}${hours}:${minutes}:${seconds}`;
    // Remove non-numeric characters
    const numericDate = formattedDate.replace(/[^0-9]/g, "");
    // Create barcode by concatenating nextId and numericDate
    const cuttingBarcode = `${nextId}${numericDate}`;

    // Create new cutting roll record
    const newCuttingRoll = await prisma.hps_cutting_roll.create({
      data: {
        job_card_id: jobCardId,
        cutting_id: cutting_id,
        cutting_roll_weight,
        no_of_bags,
        cutting_wastage,
        cutting_barcode: cuttingBarcode,
        add_date: new Date(),
        user_id: 1, // Replace with actual user ID from your auth system
        del_ind: 1,
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
      userId: 1, // Replace with actual user ID from your auth system
      action: 'CREATE_CUTTING_ROLL',
      resource: newCuttingRoll.cutting_roll_id.toString(),
      details: {
        jobCardId,
        cutting_id,
        cutting_roll_weight,
        no_of_bags,
        cutting_wastage,
        cutting_barcode: cuttingBarcode,
      },
      request,
    });

    // Log system event for successful creation
    await logSystemEvent({
      level: 'INFO',
      message: 'Successfully added cutting roll',
      context: {
        endpoint,
        cuttingRollId: newCuttingRoll.cutting_roll_id,
        jobCardId,
        cutting_id,
        cutting_roll_weight,
        no_of_bags,
        cutting_wastage,
        cutting_barcode: cuttingBarcode,
        responseTime,
      },
      source: 'cutting-api',
      request,
    });

    return NextResponse.json(
      { success: true, data: newCuttingRoll },
      { status: 201 }
    );
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    // Log error details
    appLogger.error("Error adding cutting roll", {
      endpoint,
      method,
      jobCardId: params.id,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);

    // Log system event for error
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to add cutting roll',
      context: {
        endpoint,
        jobCardId: params.id,
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      },
      source: 'cutting-api',
      request,
    });

    return NextResponse.json(
      { error: "Failed to add cutting roll", details: error.message },
      { status: 500 }
    );
  }
}, {
  logToDatabase: true,
  logToFile: true,
  trackPerformance: true,
  trackUserActivity: true,
});
