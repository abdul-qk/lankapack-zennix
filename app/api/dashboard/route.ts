import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { withMonitoring, logSystemEvent } from "@/lib/monitoring";
import appLogger from "@/lib/logger";

export const GET = withMonitoring(async function GET(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/dashboard";
  const method = "GET";
  
  try {
    // Log the API request start
    appLogger.info("Fetching dashboard statistics", {
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    });

    // Fetch the total number of rows from both tables
    const [jobcardCount, cuttingCount, slittingCount, customerCount] = await Promise.all([
      prisma.hps_jobcard.count(),
      prisma.hps_cutting.count(),
      prisma.hps_slitting.count(),
      prisma.hps_customer.count(),
    ]);

    // Combine the results
    const data = {
      jobcardCount,
      cuttingCount,
      slittingCount,
      customerCount,
    };

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
      message: 'Successfully fetched dashboard statistics',
      context: {
        endpoint,
        data,
        responseTime,
      },
      source: 'dashboard-api',
      request,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error details
    appLogger.error("Error fetching dashboard data", {
      endpoint,
      method,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);

    // Log system event for error
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to fetch dashboard statistics from database',
      context: {
        endpoint,
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      },
      source: 'dashboard-api',
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
  trackUserActivity: false, // No user-specific activity for this endpoint
});
