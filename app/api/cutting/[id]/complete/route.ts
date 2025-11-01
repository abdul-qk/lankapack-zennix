import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { withMonitoring, logSystemEvent, logUserActivity } from "@/lib/monitoring";
import appLogger from "@/lib/logger";

export const POST = withMonitoring(async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const endpoint = `/api/cutting/${params.id}/complete`;
  const method = "POST";
  
  try {
    const { id } = params;
    const jobCardId = parseInt(id);

    // Validate ID
    if (isNaN(jobCardId)) {
      const responseTime = Date.now() - startTime;
      
      appLogger.warn("Invalid job card ID for completion", {
        endpoint,
        method,
        providedId: id,
        responseTime,
      });
      
      return NextResponse.json(
        { error: "Invalid job card ID" },
        { status: 400 }
      );
    }

    // Log the API request start
    appLogger.info("Completing cutting for job card", {
      endpoint,
      method,
      jobCardId,
      timestamp: new Date().toISOString(),
    });

    // Update the job card status to "Completed"
    const updatedJobCard = await prisma.hps_jobcard.update({
      where: { job_card_id: jobCardId },
      data: { card_cutting: 1 },
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

    // Log system event for successful completion
    await logSystemEvent({
      level: 'INFO',
      message: 'Successfully completed cutting for job card',
      context: {
        endpoint,
        jobCardId,
        responseTime,
      },
      source: 'cutting-api',
      request,
    });

    return NextResponse.json({
      message: "Cutting process marked as completed",
      data: updatedJobCard,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error details
    appLogger.error("Error completing cutting for job card", {
      endpoint,
      method,
      jobCardId: params.id,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);

    // Log system event for error
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to complete cutting for job card',
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
      { error: "Failed to update cutting status" },
      { status: 500 }
    );
  }
}, {
  logToDatabase: true,
  logToFile: true,
  trackPerformance: true,
  trackUserActivity: false,
});
