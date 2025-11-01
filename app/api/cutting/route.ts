export const dynamic = "force-dynamic";
// Get all data from hps_slitting
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { withMonitoring, logSystemEvent } from "@/lib/monitoring";
import appLogger from "@/lib/logger";

export const GET = withMonitoring(async function GET(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/cutting";
  const method = "GET";
  
  try {
    // Log the API request start
    appLogger.info("Fetching cutting data", {
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    });

    const slittingInfo = await prisma.hps_jobcard.findMany({
      include: {
        customer: true,
        particular: true,
      },
      where: {
        OR: [
          { section_list: "3" },
          { section_list: { startsWith: "3," } },
          { section_list: { endsWith: ",3" } },
          { section_list: { contains: ",3," } },
        ],
      },
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

    // Log system event for successful data retrieval
    await logSystemEvent({
      level: 'INFO',
      message: 'Successfully fetched cutting data',
      context: {
        endpoint,
        recordCount: slittingInfo.length,
        responseTime,
      },
      source: 'cutting-api',
      request,
    });

    return NextResponse.json({ data: slittingInfo }, { status: 200 });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error details
    appLogger.error("Error fetching cutting data", {
      endpoint,
      method,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);

    // Log system event for error
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to fetch cutting data from database',
      context: {
        endpoint,
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
