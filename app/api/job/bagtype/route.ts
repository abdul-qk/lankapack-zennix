import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { withMonitoring, logSystemEvent, logAuditTrail } from "@/lib/monitoring";
import appLogger from "@/lib/logger";

export const GET = withMonitoring(async function GET(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/job/bagtype";
  const method = "GET";
  
  try {
    // Log the API request start
    appLogger.info("Fetching bag type information", {
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    });

    // Fetch all bag type data
    const bagInfo = await prisma.hps_bag_type.findMany({});

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
      message: 'Successfully fetched bag type information',
      context: {
        endpoint,
        recordCount: bagInfo.length,
        responseTime,
      },
      source: 'bagtype-api',
      request,
    });

    return NextResponse.json({ data: bagInfo }, { status: 200 });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error details
    appLogger.error("Error fetching bag type info", {
      endpoint,
      method,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);

    // Log system event for error
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to fetch bag type information from database',
      context: {
        endpoint,
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      },
      source: 'bagtype-api',
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

export const POST = withMonitoring(async function POST(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/job/bagtype";
  const method = "POST";
  
  try {
    // Log the API request start
    appLogger.info("Creating new bag type", {
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    });

    const { bag_type, bags_select, bag_price } = await request.json();

    if (!bag_type || bag_type.trim() === "") {
      const responseTime = Date.now() - startTime;
      
      // Log validation error
      appLogger.warn("Bag type creation failed - validation error", {
        endpoint,
        method,
        responseTime,
        error: "Bag type name is required",
      });

      await logSystemEvent({
        level: 'WARN',
        message: 'Bag type creation failed due to validation error',
        context: {
          endpoint,
          error: "Bag type name is required",
          responseTime,
        },
        source: 'bagtype-api',
        request,
      });

      return NextResponse.json(
        { error: "Bag type name is required" },
        { status: 400 }
      );
    }

    const newBag = await prisma.hps_bag_type.create({
      data: { bags_select, bag_type, bag_price },
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

    // Log audit trail for data creation
    await logAuditTrail({
      tableName: 'hps_bag_type',
      recordId: newBag.bag_id.toString(),
      action: 'CREATE',
      newValues: newBag,
      request,
    });

    // Log system event for successful creation
    await logSystemEvent({
      level: 'INFO',
      message: 'Successfully created new bag type',
      context: {
        endpoint,
        bagId: newBag.bag_id,
        bagType: newBag.bag_type,
        responseTime,
      },
      source: 'bagtype-api',
      request,
    });

    return NextResponse.json(newBag, { status: 201 });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error details
    appLogger.error("Error adding new bag type", {
      endpoint,
      method,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);

    // Log system event for error
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to create new bag type',
      context: {
        endpoint,
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      },
      source: 'bagtype-api',
      request,
    });

    return NextResponse.json(
      { error: "Failed to add bag type" },
      { status: 500 }
    );
  }
}, {
  logToDatabase: true,
  logToFile: true,
  trackPerformance: true,
  trackUserActivity: true,
});

export const PATCH = withMonitoring(async function PATCH(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/job/bagtype";
  const method = "PATCH";
  
  try {
    // Log the API request start
    appLogger.info("Updating bag type", {
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    });

    const { id, bag_type, bags_select, bag_price } = await request.json();

    if (
      !id ||
      bag_type === undefined ||
      bags_select === undefined ||
      bag_price === undefined
    ) {
      const responseTime = Date.now() - startTime;
      
      // Log validation error
      appLogger.warn("Bag type update failed - validation error", {
        endpoint,
        method,
        responseTime,
        error: "All fields are required",
        bagId: id,
      });

      await logSystemEvent({
        level: 'WARN',
        message: 'Bag type update failed due to validation error',
        context: {
          endpoint,
          error: "All fields are required",
          bagId: id,
          responseTime,
        },
        source: 'bagtype-api',
        request,
      });

      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Get old values for audit trail
    const oldBag = await prisma.hps_bag_type.findUnique({
      where: { bag_id: id },
    });

    const updated = await prisma.hps_bag_type.update({
      where: { bag_id: id },
      data: {
        bag_type: bag_type,
        bags_select: bags_select,
        bag_price: bag_price,
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

    // Log audit trail for data update
    await logAuditTrail({
      tableName: 'hps_bag_type',
      recordId: id.toString(),
      action: 'UPDATE',
      oldValues: oldBag,
      newValues: updated,
      request,
    });

    // Log system event for successful update
    await logSystemEvent({
      level: 'INFO',
      message: 'Successfully updated bag type',
      context: {
        endpoint,
        bagId: id,
        bagType: updated.bag_type,
        responseTime,
      },
      source: 'bagtype-api',
      request,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error details
    appLogger.error("Error updating bag type", {
      endpoint,
      method,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);

    // Log system event for error
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to update bag type',
      context: {
        endpoint,
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      },
      source: 'bagtype-api',
      request,
    });

    return NextResponse.json(
      { error: "Failed to update bag type" },
      { status: 500 }
    );
  }
}, {
  logToDatabase: true,
  logToFile: true,
  trackPerformance: true,
  trackUserActivity: true,
});

export const DELETE = withMonitoring(async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/job/bagtype";
  const method = "DELETE";
  
  try {
    // Log the API request start
    appLogger.info("Deleting bag type", {
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    });

    const { id } = await request.json();

    if (!id) {
      const responseTime = Date.now() - startTime;
      
      // Log validation error
      appLogger.warn("Bag type deletion failed - validation error", {
        endpoint,
        method,
        responseTime,
        error: "ID is required to delete",
      });

      await logSystemEvent({
        level: 'WARN',
        message: 'Bag type deletion failed due to validation error',
        context: {
          endpoint,
          error: "ID is required to delete",
          responseTime,
        },
        source: 'bagtype-api',
        request,
      });

      return NextResponse.json(
        { error: "ID is required to delete" },
        { status: 400 }
      );
    }

    // Get old values for audit trail before deletion
    const oldBag = await prisma.hps_bag_type.findUnique({
      where: { bag_id: id },
    });

    if (!oldBag) {
      const responseTime = Date.now() - startTime;
      
      // Log not found error
      appLogger.warn("Bag type deletion failed - record not found", {
        endpoint,
        method,
        responseTime,
        bagId: id,
      });

      await logSystemEvent({
        level: 'WARN',
        message: 'Bag type deletion failed - record not found',
        context: {
          endpoint,
          bagId: id,
          responseTime,
        },
        source: 'bagtype-api',
        request,
      });

      return NextResponse.json(
        { error: "Bag type not found" },
        { status: 404 }
      );
    }

    await prisma.hps_bag_type.delete({
      where: { bag_id: id },
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

    // Log audit trail for data deletion
    await logAuditTrail({
      tableName: 'hps_bag_type',
      recordId: id.toString(),
      action: 'DELETE',
      oldValues: oldBag,
      request,
    });

    // Log system event for successful deletion
    await logSystemEvent({
      level: 'INFO',
      message: 'Successfully deleted bag type',
      context: {
        endpoint,
        bagId: id,
        bagType: oldBag.bag_type,
        responseTime,
      },
      source: 'bagtype-api',
      request,
    });

    return NextResponse.json(
      { message: "Deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error details
    appLogger.error("Error deleting bag type", {
      endpoint,
      method,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);

    // Log system event for error
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to delete bag type',
      context: {
        endpoint,
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      },
      source: 'bagtype-api',
      request,
    });

    return NextResponse.json(
      { error: "Failed to delete data" },
      { status: 500 }
    );
  }
}, {
  logToDatabase: true,
  logToFile: true,
  trackPerformance: true,
  trackUserActivity: true,
});
