import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { withMonitoring, logSystemEvent } from "@/lib/monitoring";
import appLogger from "@/lib/logger";

export const GET = withMonitoring(async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const endpoint = `/api/cutting/${params.id}`;
  const method = "GET";
  
  try {
    const jobCardId = parseInt(params.id, 10);
    if (isNaN(jobCardId)) {
      // Log invalid ID error
      appLogger.warn("Invalid job card ID provided", {
        endpoint,
        method,
        providedId: params.id,
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // Log the API request start
    appLogger.info("Fetching cutting info by job card ID", {
      endpoint,
      method,
      jobCardId,
      timestamp: new Date().toISOString(),
    });

    const cuttingInfo = await prisma.hps_jobcard.findFirst({
      include: {
        customer: true,
        particular: true,
        cut_types: true,
        cut_bag_types: true,
      },
      where: {
        job_card_id: jobCardId,
        OR: [
          { section_list: "3" },
          { section_list: { startsWith: "3," } },
          { section_list: { endsWith: ",3" } },
          { section_list: { contains: ",3," } },
        ],
      },
    });

    const basicCuttingData = await prisma.hps_cutting.findMany({
      where: {
        job_card_id: jobCardId,
      },
    });

    const cuttingData = await Promise.all(
      basicCuttingData.map(async (cutting) => {
        // Converting the barcode string to BigInt for comparison with hps_stock.stock_barcode
        const stockItem = await prisma.hps_stock.findFirst({
          where: {
            stock_barcode: BigInt(cutting.roll_barcode_no),
          },
          select: {
            item_net_weight: true,
          },
        });

        // Return the slitting data with the added net_weight field
        return {
          ...cutting,
          net_weight: stockItem?.item_net_weight || null,
        };
      })
    );

    const cuttingRollData = await prisma.hps_cutting_roll.findMany({
      where: {
        job_card_id: jobCardId,
      },
    });

    if (!cuttingInfo) {
      const responseTime = Date.now() - startTime;
      
      // Log not found
      appLogger.warn("Cutting info not found", {
        endpoint,
        method,
        jobCardId,
        responseTime,
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const responseTime = Date.now() - startTime;
    
    // Log successful response
    appLogger.logApiRequest({
      method,
      endpoint,
      statusCode: 200,
      responseTime,
      requestId: request.headers.get('x-request-id') || undefined,
    });

    // Log system event for successful data retrieval
    await logSystemEvent({
      level: 'INFO',
      message: 'Successfully fetched cutting info by job card ID',
      context: {
        endpoint,
        jobCardId,
        cuttingDataCount: cuttingData.length,
        cuttingRollDataCount: cuttingRollData.length,
        responseTime,
      },
      source: 'cutting-api',
      request,
    });

    return NextResponse.json(
      { data: cuttingInfo, cuttingData, cuttingRollData },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error details
    appLogger.error("Error fetching cutting info", {
      endpoint,
      method,
      jobCardId: params.id,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);

    // Log system event for error
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to fetch cutting info from database',
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
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}, {
  logToDatabase: true,
  logToFile: true,
  trackPerformance: true,
  trackUserActivity: false,
});
