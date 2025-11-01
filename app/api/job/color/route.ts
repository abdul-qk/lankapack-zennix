import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withMonitoring, logSystemEvent, logAuditTrail } from "@/lib/monitoring";
import appLogger from "@/lib/logger";

export const GET = withMonitoring(async (req: NextRequest) => {
  const startTime = Date.now();
  
  try {
    appLogger.info('GET /api/job/color - Request started');
    
    // Fetch all filtered material info data
    const colorInfo = await prisma.hps_colour.findMany({});

    const duration = Date.now() - startTime;
    appLogger.info(`GET /api/job/color - Success: Retrieved ${colorInfo.length} colors in ${duration}ms`);
    
    await logSystemEvent({
      level: 'INFO',
      message: 'Successfully retrieved color information',
      context: {
        endpoint: '/api/job/color',
        recordCount: colorInfo.length,
        responseTime: duration,
      },
      source: 'color-api',
      request: req,
    });

    return NextResponse.json({ data: colorInfo }, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    appLogger.error(`GET /api/job/color - Error after ${duration}ms`, {
      endpoint: '/api/job/color',
      method: 'GET',
      responseTime: duration,
    }, error instanceof Error ? error : new Error(String(error)));
    
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to fetch color data',
      context: {
        endpoint: '/api/job/color',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: duration,
      },
      source: 'color-api',
      request: req,
    });

    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
});

export const POST = withMonitoring(async (req: NextRequest) => {
  const startTime = Date.now();
  
  try {
    appLogger.info('POST /api/job/color - Request started');
    
    const { colour_name } = await req.json();

    if (!colour_name || colour_name.trim() === "") {
      appLogger.warn('POST /api/job/color - Validation failed: Color name is required');
      
      await logSystemEvent({
        level: 'WARN',
        message: 'Color creation failed: Name is required',
        context: {
          endpoint: '/api/job/color',
          provided_colour_name: !!colour_name,
        },
        source: 'color-api',
        request: req,
      });
      
      return NextResponse.json({ error: "Color is required" }, { status: 400 });
    }

    const newColor = await prisma.hps_colour.create({
      data: { colour_name },
    });

    const duration = Date.now() - startTime;
    appLogger.info(`POST /api/job/color - Success: Created color '${colour_name}' with ID ${newColor.colour_id} in ${duration}ms`);
    
    await logAuditTrail({
      action: 'CREATE',
      tableName: 'hps_colour',
      recordId: newColor.colour_id.toString(),
      newValues: newColor,
    });
    
    await logSystemEvent({
      level: 'INFO',
      message: 'Successfully created color',
      context: {
        endpoint: '/api/job/color',
        recordId: newColor.colour_id,
        colour_name,
        responseTime: duration,
      },
      source: 'color-api',
      request: req,
    });

    return NextResponse.json(newColor, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    appLogger.error(`POST /api/job/color - Error after ${duration}ms`, {
      endpoint: '/api/job/color',
      method: 'POST',
      responseTime: duration,
    }, error instanceof Error ? error : new Error(String(error)));
    
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to create color',
      context: {
        endpoint: '/api/job/color',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: duration,
      },
      source: 'color-api',
      request: req,
    });

    return NextResponse.json({ error: "Failed to add color" }, { status: 500 });
  }
});

export const PATCH = withMonitoring(async (req: NextRequest) => {
  const startTime = Date.now();
  
  try {
    appLogger.info('PATCH /api/job/color - Request started');
    
    const { id, colour_name } = await req.json();

    if (!id || colour_name === undefined) {
      appLogger.warn('PATCH /api/job/color - Validation failed: ID and colour_name are required');
      
      await logSystemEvent({
        level: 'WARN',
        message: 'Color update failed: ID and colour_name are required',
        context: {
          endpoint: '/api/job/color',
          provided_id: !!id,
          provided_colour_name: colour_name !== undefined,
        },
        source: 'color-api',
        request: req,
      });
      
      return NextResponse.json({ error: "ID and colour_name are required" }, { status: 400 });
    }

    // Get old values for audit trail
    const oldColor = await prisma.hps_colour.findUnique({
      where: { colour_id: id }
    });

    const updated = await prisma.hps_colour.update({
      where: { colour_id: id },
      data: { colour_name: colour_name },
    });

    const duration = Date.now() - startTime;
    appLogger.info(`PATCH /api/job/color - Success: Updated color ID ${id} to '${colour_name}' in ${duration}ms`);
    
    await logAuditTrail({
      action: 'UPDATE',
      tableName: 'hps_colour',
      recordId: id.toString(),
      oldValues: oldColor,
      newValues: updated,
    });
    
    await logSystemEvent({
      level: 'INFO',
      message: 'Successfully updated color',
      context: {
        endpoint: '/api/job/color',
        recordId: id,
        old_colour_name: oldColor?.colour_name,
        new_colour_name: colour_name,
        responseTime: duration,
      },
      source: 'color-api',
      request: req,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    appLogger.error(`PATCH /api/job/color - Error after ${duration}ms`, {
      endpoint: '/api/job/color',
      method: 'PATCH',
      responseTime: duration,
    }, error instanceof Error ? error : new Error(String(error)));
    
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to update color',
      context: {
        endpoint: '/api/job/color',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: duration,
      },
      source: 'color-api',
      request: req,
    });

    return NextResponse.json({ error: "Failed to update colour name" }, { status: 500 });
  }
});

export const DELETE = withMonitoring(async (req: NextRequest) => {
  const startTime = Date.now();
  
  try {
    appLogger.info('DELETE /api/job/color - Request started');
    
    const { id } = await req.json();

    if (!id) {
      appLogger.warn('DELETE /api/job/color - Validation failed: ID is required');
      
      await logSystemEvent({
        level: 'WARN',
        message: 'Color deletion failed: ID is required',
        context: {
          endpoint: '/api/job/color',
          provided_id: !!id,
        },
        source: 'color-api',
        request: req,
      });
      
      return NextResponse.json({ error: "ID is required to delete" }, { status: 400 });
    }

    // Get old values for audit trail
    const oldColor = await prisma.hps_colour.findUnique({
      where: { colour_id: id }
    });

    if (!oldColor) {
      appLogger.warn(`DELETE /api/job/color - Record not found: ID ${id}`);
      
      await logSystemEvent({
        level: 'WARN',
        message: 'Color not found for deletion',
        context: {
          endpoint: '/api/job/color',
          colour_id: id,
        },
        source: 'color-api',
        request: req,
      });
      
      return NextResponse.json({ error: "Color not found" }, { status: 404 });
    }

    await prisma.hps_colour.delete({
      where: { colour_id: id },
    });

    const duration = Date.now() - startTime;
    appLogger.info(`DELETE /api/job/color - Success: Deleted color ID ${id} ('${oldColor.colour_name}') in ${duration}ms`);
    
    await logAuditTrail({
      action: 'DELETE',
      tableName: 'hps_colour',
      recordId: id.toString(),
      oldValues: oldColor,
    });
    
    await logSystemEvent({
      level: 'INFO',
      message: 'Successfully deleted color',
      context: {
        endpoint: '/api/job/color',
        recordId: id,
        colour_name: oldColor.colour_name,
        responseTime: duration,
      },
      source: 'color-api',
      request: req,
    });

    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    appLogger.error(`DELETE /api/job/color - Error after ${duration}ms`, {
      endpoint: '/api/job/color',
      method: 'DELETE',
      responseTime: duration,
    }, error instanceof Error ? error : new Error(String(error)));
    
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to delete color',
      context: {
        endpoint: '/api/job/color',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: duration,
      },
      source: 'color-api',
      request: req,
    });

    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
  }
});
