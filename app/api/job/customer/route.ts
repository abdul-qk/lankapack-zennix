export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withMonitoring, logSystemEvent, logAuditTrail } from "@/lib/monitoring";
import appLogger from "@/lib/logger";

export const GET = withMonitoring(async (req: NextRequest) => {
  const startTime = Date.now();
  
  try {
    appLogger.info('GET /api/job/customer - Request started');
    
    const customerInfo = await prisma.hps_customer.findMany({});

    const duration = Date.now() - startTime;
    appLogger.info(`GET /api/job/customer - Success: Retrieved ${customerInfo.length} customers in ${duration}ms`);
    
    await logSystemEvent({
      level: 'INFO',
      message: `Successfully retrieved ${customerInfo.length} customers`,
      context: {
        endpoint: '/api/job/customer',
        recordCount: customerInfo.length,
        responseTime: duration,
      },
      source: 'customer-api',
      request: req,
    });

    return NextResponse.json({ data: customerInfo }, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    appLogger.error(`GET /api/job/customer - Error after ${duration}ms`, {
      endpoint: '/api/job/customer',
      method: 'GET',
      responseTime: duration,
    }, error instanceof Error ? error : new Error(String(error)));
    
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to fetch customer data',
      context: {
        endpoint: '/api/job/customer',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: duration,
      },
      source: 'customer-api',
      request: req,
    });

    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
});

export const POST = withMonitoring(async (req: NextRequest) => {
  const startTime = Date.now();
  
  try {
    appLogger.info('POST /api/job/customer - Request started');
    
    const {
      customer_full_name,
      contact_person,
      customer_address,
      customer_tel,
      customer_mobile,
      customer_email_address,
    } = await req.json();

    if (
      !customer_full_name ||
      customer_full_name.trim() === ""
    ) {
      appLogger.warn('POST /api/job/customer - Validation failed: Customer name is required');
      
      await logSystemEvent({
        level: 'WARN',
        message: 'Customer creation failed: Customer name is required',
        context: { field: 'customer_full_name' }
      });
      
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const newCustomer = await prisma.hps_customer.create({
      data: {
        customer_full_name,
        contact_person: contact_person,
        customer_address: customer_address,
        customer_tel: customer_tel,
        customer_mobile: customer_mobile,
        customer_add_date: new Date(),
        customer_email_address: customer_email_address,
        hps_user_id: 0,
        del_ind: 1,
      },
    });

    const duration = Date.now() - startTime;
    appLogger.info(`POST /api/job/customer - Success: Created customer '${customer_full_name}' with ID ${newCustomer.customer_id} in ${duration}ms`);
    
    await logAuditTrail({
      action: 'CREATE',
      tableName: 'hps_customer',
      recordId: newCustomer.customer_id.toString(),
      newValues: newCustomer,
    });
    
    await logSystemEvent({
      level: 'INFO',
      message: `Successfully created customer: ${customer_full_name}`,
      context: { customer_id: newCustomer.customer_id, customer_full_name, duration }
    });

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    appLogger.error(`POST /api/job/customer - Error after ${duration}ms`, {
      endpoint: '/api/job/customer',
      method: 'POST',
      responseTime: duration,
    }, error instanceof Error ? error : new Error(String(error)));
    
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to create customer',
      context: { error: error instanceof Error ? error.message : 'Unknown error', duration }
    });

    return NextResponse.json({ error: "Failed to add customer" }, { status: 500 });
  }
});

export const PATCH = withMonitoring(async (req: NextRequest) => {
  const startTime = Date.now();
  
  try {
    appLogger.info('PATCH /api/job/customer - Request started');
    
    const {
      id,
      customer_full_name,
      contact_person,
      customer_address,
      customer_tel,
      customer_mobile,
      customer_email_address,
    } = await req.json();

    if (!id || customer_full_name === undefined) {
      appLogger.warn('PATCH /api/job/customer - Validation failed: ID and customer name are required');
      
      await logSystemEvent({
        level: 'WARN',
        message: 'Customer update failed: ID and customer name are required',
        context: { provided_id: !!id, provided_customer_name: customer_full_name !== undefined }
      });
      
      return NextResponse.json({ error: "ID and customer name are required" }, { status: 400 });
    }

    // Get old values for audit trail
    const oldCustomer = await prisma.hps_customer.findUnique({
      where: { customer_id: id }
    });

    const updated = await prisma.hps_customer.update({
      where: { customer_id: id },
      data: {
        customer_full_name,
        contact_person,
        customer_address,
        customer_tel,
        customer_mobile,
        customer_email_address,
      },
    });

    const duration = Date.now() - startTime;
    appLogger.info(`PATCH /api/job/customer - Success: Updated customer ID ${id} to '${customer_full_name}' in ${duration}ms`);
    
    await logAuditTrail({
      action: 'UPDATE',
      tableName: 'hps_customer',
      recordId: id.toString(),
      oldValues: oldCustomer,
      newValues: updated,

    });
    
    await logSystemEvent({
      level: 'INFO',
      message: `Successfully updated customer ID ${id}`,
      context: { customer_id: id, old_name: oldCustomer?.customer_full_name, new_name: customer_full_name, duration }
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    appLogger.error(`PATCH /api/job/customer - Error after ${duration}ms`, {
      endpoint: '/api/job/customer',
      method: 'PATCH',
      responseTime: duration,
    }, error instanceof Error ? error : new Error(String(error)));
    
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to update customer',
      context: { error: error instanceof Error ? error.message : 'Unknown error', duration }
    });

    return NextResponse.json({ error: "Failed to update customer details" }, { status: 500 });
  }
});

export const DELETE = withMonitoring(async (req: NextRequest) => {
  const startTime = Date.now();
  
  try {
    appLogger.info('DELETE /api/job/customer - Request started');
    
    const { id } = await req.json();

    if (!id) {
      appLogger.warn('DELETE /api/job/customer - Validation failed: ID is required');
      
      await logSystemEvent({
        level: 'WARN',
        message: 'Customer deletion failed: ID is required',
        context: { provided_id: !!id }
      });
      
      return NextResponse.json({ error: "ID is required to delete" }, { status: 400 });
    }

    // Get old values for audit trail
    const oldCustomer = await prisma.hps_customer.findUnique({
      where: { customer_id: id }
    });

    if (!oldCustomer) {
      appLogger.warn(`DELETE /api/job/customer - Record not found: ID ${id}`);
      
      await logSystemEvent({
        level: 'WARN',
        message: `Customer not found for deletion: ID ${id}`,
        context: { customer_id: id }
      });
      
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await prisma.hps_customer.delete({
      where: { customer_id: id },
    });

    const duration = Date.now() - startTime;
    appLogger.info(`DELETE /api/job/customer - Success: Deleted customer ID ${id} ('${oldCustomer.customer_full_name}') in ${duration}ms`);
    
    await logAuditTrail({
      action: 'DELETE',
      tableName: 'hps_customer',
      recordId: id.toString(),
      oldValues: oldCustomer,
    });
    
    await logSystemEvent({
      level: 'INFO',
      message: `Successfully deleted customer: ${oldCustomer.customer_full_name}`,
      context: { customer_id: id, customer_full_name: oldCustomer.customer_full_name, duration }
    });

    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    appLogger.error(`DELETE /api/job/customer - Error after ${duration}ms`, {
      endpoint: '/api/job/customer',
      method: 'DELETE',
      responseTime: duration,
    }, error instanceof Error ? error : new Error(String(error)));
    
    await logSystemEvent({
      level: 'ERROR',
      message: 'Failed to delete customer',
      context: { error: error instanceof Error ? error.message : 'Unknown error', duration }
    });

    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
  }
});
