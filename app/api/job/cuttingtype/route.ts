import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withMonitoring, logSystemEvent, logAuditTrail } from "@/lib/monitoring";
import appLogger from "@/lib/logger";

export const GET = withMonitoring(async (req: NextRequest) => {
  const startTime = Date.now();
  
  try {
    appLogger.info('GET /api/job/cuttingtype - Request started');
    
    // Fetch all filtered material info data
    const rollInfo = await prisma.hps_cutting_type.findMany({});

    const duration = Date.now() - startTime;
    appLogger.info(`GET /api/job/cuttingtype - Success: Retrieved ${rollInfo.length} cutting types in ${duration}ms`);
    
    await logSystemEvent({
      level: 'INFO',
      message: `Successfully retrieved cutting types data`,
      context: { count: rollInfo.length, duration }
    });

    return NextResponse.json({ data: rollInfo }, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    appLogger.error(`GET /api/job/cuttingtype - Error after ${duration}ms`, {
      endpoint: '/api/job/cuttingtype',
      method: 'GET',
      responseTime: duration,
    }, error instanceof Error ? error : new Error(String(error)));
    
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to fetch cutting types data',
      context: { error: error instanceof Error ? error.message : 'Unknown error', duration }
    });

    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
});

export const POST = withMonitoring(async (req: NextRequest) => {
  const startTime = Date.now();
  
  try {
    appLogger.info('POST /api/job/cuttingtype - Request started');
    
    const { cutting_type } = await req.json();

    if (!cutting_type || cutting_type.trim() === "") {
      appLogger.warn('POST /api/job/cuttingtype - Validation failed: Cutting type name is required');
      
      await logSystemEvent({
        level: 'WARN',
        message: 'Cutting type creation failed: Name is required',
        context: { provided_cutting_type: !!cutting_type }
      });
      
      return NextResponse.json({ error: "Particular name is required" }, { status: 400 });
    }

    const newRoll = await prisma.hps_cutting_type.create({
      data: { cutting_type },
    });

    const duration = Date.now() - startTime;
    appLogger.info(`POST /api/job/cuttingtype - Success: Created cutting type '${cutting_type}' with ID ${newRoll.cutting_id} in ${duration}ms`);
    
    await logAuditTrail({
      action: 'CREATE',
      tableName: 'hps_cutting_type',
      recordId: newRoll.cutting_id.toString(),
      newValues: newRoll,
    });
    
    await logSystemEvent({
      level: 'INFO',
      message: `Successfully created cutting type: ${cutting_type}`,
      context: { cutting_id: newRoll.cutting_id, cutting_type, duration }
    });

    return NextResponse.json(newRoll, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    appLogger.error(`POST /api/job/cuttingtype - Error after ${duration}ms`, {
      endpoint: '/api/job/cuttingtype',
      method: 'POST',
      responseTime: duration,
    }, error instanceof Error ? error : new Error(String(error)));
    
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to create cutting type',
      context: { error: error instanceof Error ? error.message : 'Unknown error', duration }
    });

    return NextResponse.json({ error: "Failed to add roll type" }, { status: 500 });
  }
});

export const PATCH = withMonitoring(async (req: NextRequest) => {
  const startTime = Date.now();
  
  try {
    appLogger.info('PATCH /api/job/cuttingtype - Request started');
    
    const { id, cutting_type } = await req.json();

    if (!id || cutting_type === undefined) {
      appLogger.warn('PATCH /api/job/cuttingtype - Validation failed: ID and cutting type are required');
      
      await logSystemEvent({
        level: 'WARN',
        message: 'Cutting type update failed: ID and cutting type are required',
        context: { provided_id: !!id, provided_cutting_type: cutting_type !== undefined }
      });
      
      return NextResponse.json({ error: "ID and Cutting Type are required" }, { status: 400 });
    }

    // Get old values for audit trail
    const oldCuttingType = await prisma.hps_cutting_type.findUnique({
      where: { cutting_id: id }
    });

    const updated = await prisma.hps_cutting_type.update({
      where: { cutting_id: id },
      data: { cutting_type: cutting_type },
    });

    const duration = Date.now() - startTime;
    appLogger.info(`PATCH /api/job/cuttingtype - Success: Updated cutting type ID ${id} to '${cutting_type}' in ${duration}ms`);
    
    await logAuditTrail({
      action: 'UPDATE',
      tableName: 'hps_cutting_type',
      recordId: id.toString(),
      oldValues: oldCuttingType,
      newValues: updated,
    });
    
    await logSystemEvent({
      level: 'INFO',
      message: `Successfully updated cutting type: ${oldCuttingType?.cutting_type} → ${cutting_type}`,
      context: { cutting_id: id, old_cutting_type: oldCuttingType?.cutting_type, new_cutting_type: cutting_type, duration }
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    appLogger.error(`PATCH /api/job/cuttingtype - Error after ${duration}ms`, {
      endpoint: '/api/job/cuttingtype',
      method: 'PATCH',
      responseTime: duration,
    }, error instanceof Error ? error : new Error(String(error)));
    
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to update cutting type',
      context: { error: error instanceof Error ? error.message : 'Unknown error', duration }
    });

    return NextResponse.json({ error: "Failed to update cutting type" }, { status: 500 });
  }
});

export const DELETE = withMonitoring(async (req: NextRequest) => {
  const startTime = Date.now();
  
  try {
    appLogger.info('DELETE /api/job/cuttingtype - Request started');
    
    const { id } = await req.json();

    if (!id) {
      appLogger.warn('DELETE /api/job/cuttingtype - Validation failed: ID is required');
      
      await logSystemEvent({
        level: 'WARN',
        message: 'Cutting type deletion failed: ID is required',
        context: { provided_id: !!id }
      });
      
      return NextResponse.json({ error: "ID is required to delete" }, { status: 400 });
    }

    // Get old values for audit trail
    const oldCuttingType = await prisma.hps_cutting_type.findUnique({
      where: { cutting_id: id }
    });

    if (!oldCuttingType) {
      appLogger.warn(`DELETE /api/job/cuttingtype - Record not found: ID ${id}`);
      
      await logSystemEvent({
        level: 'WARN',
        message: `Cutting type not found for deletion: ID ${id}`,
        context: { cutting_id: id }
      });
      
      return NextResponse.json({ error: "Cutting type not found" }, { status: 404 });
    }

    await prisma.hps_cutting_type.delete({
      where: { cutting_id: id },
    });

    const duration = Date.now() - startTime;
    appLogger.info(`DELETE /api/job/cuttingtype - Success: Deleted cutting type ID ${id} ('${oldCuttingType.cutting_type}') in ${duration}ms`);
    
    await logAuditTrail({
      action: 'DELETE',
      tableName: 'hps_cutting_type',
      recordId: id.toString(),
      oldValues: oldCuttingType,
    });
    
    await logSystemEvent({
      level: 'INFO',
      message: `Successfully deleted cutting type: ${oldCuttingType.cutting_type}`,
      context: { cutting_id: id, cutting_type: oldCuttingType.cutting_type, duration }
    });

    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    appLogger.error(`DELETE /api/job/cuttingtype - Error after ${duration}ms`, {
      endpoint: '/api/job/cuttingtype',
      method: 'DELETE',
      responseTime: duration,
    }, error instanceof Error ? error : new Error(String(error)));
    
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to delete cutting type',
      context: { error: error instanceof Error ? error.message : 'Unknown error', duration }
    });

    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
  }
});
