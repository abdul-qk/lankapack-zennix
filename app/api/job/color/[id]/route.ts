import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withMonitoring, logSystemEvent } from "@/lib/monitoring";
import appLogger from "@/lib/logger";

export const GET = withMonitoring(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const startTime = Date.now();
  appLogger.info(`GET /api/job/color/${params.id} - Request started`);

  try {
    const colorId = parseInt(params.id, 10);
    
    if (isNaN(colorId)) {
      appLogger.warn(`GET /api/job/color/${params.id} - Invalid ID format`, {
        endpoint: `/api/job/color/${params.id}`,
        method: 'GET',
        providedId: params.id,
      });
      
      await logSystemEvent({
        level: 'WARN',
        message: 'Invalid color ID format',
        context: {
          endpoint: `/api/job/color/${params.id}`,
          providedId: params.id,
        },
        source: 'color-api',
        request: req,
      });
      
      return NextResponse.json(
        { error: 'Invalid color ID format' },
        { status: 400 }
      );
    }

    // Fetch color info by ID
    const colorInfo = await prisma.hps_colour.findFirst({
      where: { colour_id: colorId },
    });

    if (!colorInfo) {
      const duration = Date.now() - startTime;
      appLogger.warn(`GET /api/job/color/${params.id} - Color not found after ${duration}ms`, {
        endpoint: `/api/job/color/${params.id}`,
        method: 'GET',
        colorId,
        responseTime: duration,
      });
      
      await logSystemEvent({
        level: 'WARN',
        message: 'Color not found',
        context: {
          endpoint: `/api/job/color/${params.id}`,
          colorId,
          responseTime: duration,
        },
        source: 'color-api',
        request: req,
      });
      
      return NextResponse.json(
        { error: 'Color not found' },
        { status: 404 }
      );
    }

    const duration = Date.now() - startTime;
    appLogger.info(`GET /api/job/color/${params.id} - Success after ${duration}ms`, {
      endpoint: `/api/job/color/${params.id}`,
      method: 'GET',
      colorId,
      responseTime: duration,
    });
    
    await logSystemEvent({
      level: 'INFO',
      message: 'Successfully retrieved color by ID',
      context: {
        endpoint: `/api/job/color/${params.id}`,
        colorId,
        colorName: colorInfo.colour_name,
        responseTime: duration,
      },
      source: 'color-api',
      request: req,
    });

    return NextResponse.json({ data: colorInfo }, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    appLogger.error(`GET /api/job/color/${params.id} - Error after ${duration}ms`, {
      endpoint: `/api/job/color/${params.id}`,
      method: 'GET',
      responseTime: duration,
    }, error instanceof Error ? error : new Error(String(error)));
    
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to fetch color by ID',
      context: {
        endpoint: `/api/job/color/${params.id}`,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: duration,
      },
      source: 'color-api',
      request: req,
    });

    return NextResponse.json(
      { error: 'Failed to fetch color data' },
      { status: 500 }
    );
  }
});
