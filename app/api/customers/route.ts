export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { withMonitoring, logUserActivity, logSystemEvent } from "@/lib/monitoring";
import appLogger from "@/lib/logger";

export const GET = withMonitoring(async function GET(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/customers";
  const method = "GET";
  
  try {
    // Log the API request start
    appLogger.info("Fetching customers list", {
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    });

    // Fetch all active customers
    const customers = await prisma.hps_customer.findMany({
      where: {
        del_ind: 1, // Not deleted
      },
      select: {
        customer_id: true,
        customer_full_name: true,
        customer_address: true,
        customer_mobile: true,
      },
      orderBy: {
        customer_full_name: "asc",
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
      message: `Successfully fetched ${customers.length} customers`,
      context: {
        endpoint,
        customerCount: customers.length,
        responseTime,
      },
      source: 'customers-api',
      request,
    });

    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error details
    appLogger.error("Error fetching customers", {
      endpoint,
      method,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);

    // Log system event for error
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to fetch customers from database',
      context: {
        endpoint,
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      },
      source: 'customers-api',
      request,
    });

    return NextResponse.json(
      { success: false, error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}, {
  logToDatabase: true,
  logToFile: true,
  trackPerformance: true,
  trackUserActivity: false, // No user-specific activity for this endpoint
});
