import { NextRequest } from 'next/server';
import { logUserActivity, logAuditTrail } from './monitoring';
import appLogger from './logger';

// Common user actions
export const USER_ACTIONS = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  SESSION_EXPIRED: 'session_expired',
  
  // Navigation
  PAGE_VIEW: 'page_view',
  DASHBOARD_VIEW: 'dashboard_view',
  
  // Data Operations
  CREATE_RECORD: 'create_record',
  UPDATE_RECORD: 'update_record',
  DELETE_RECORD: 'delete_record',
  VIEW_RECORD: 'view_record',
  SEARCH_RECORDS: 'search_records',
  EXPORT_DATA: 'export_data',
  IMPORT_DATA: 'import_data',
  
  // Sales Operations
  CREATE_INVOICE: 'create_invoice',
  UPDATE_INVOICE: 'update_invoice',
  VIEW_INVOICE: 'view_invoice',
  DELETE_INVOICE: 'delete_invoice',
  CREATE_DELIVERY_ORDER: 'create_delivery_order',
  UPDATE_DELIVERY_ORDER: 'update_delivery_order',
  CREATE_RETURN: 'create_return',
  UPDATE_RETURN: 'update_return',
  
  // Job Operations
  CREATE_JOBCARD: 'create_jobcard',
  UPDATE_JOBCARD: 'update_jobcard',
  VIEW_JOBCARD: 'view_jobcard',
  
  // Material Operations
  CREATE_MATERIAL_RECEIVING: 'create_material_receiving',
  UPDATE_MATERIAL_RECEIVING: 'update_material_receiving',
  VIEW_MATERIAL_RECEIVING: 'view_material_receiving',
  
  // Stock Operations
  VIEW_STOCK: 'view_stock',
  UPDATE_STOCK: 'update_stock',
  STOCK_ADJUSTMENT: 'stock_adjustment',
  
  // Printing Operations
  CREATE_PRINT_JOB: 'create_print_job',
  UPDATE_PRINT_JOB: 'update_print_job',
  VIEW_PRINT_JOB: 'view_print_job',
  
  // Cutting Operations
  CREATE_CUTTING_JOB: 'create_cutting_job',
  UPDATE_CUTTING_JOB: 'update_cutting_job',
  VIEW_CUTTING_JOB: 'view_cutting_job',
  
  // Slitting Operations
  CREATE_SLITTING_JOB: 'create_slitting_job',
  UPDATE_SLITTING_JOB: 'update_slitting_job',
  VIEW_SLITTING_JOB: 'view_slitting_job',
  
  // System Operations
  SYSTEM_BACKUP: 'system_backup',
  SYSTEM_RESTORE: 'system_restore',
  CONFIGURATION_CHANGE: 'configuration_change',
  
  // Security Events
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  PERMISSION_DENIED: 'permission_denied',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
} as const;

export type UserAction = typeof USER_ACTIONS[keyof typeof USER_ACTIONS];

// Interface for user activity context
interface UserActivityContext {
  userId: number;
  action: UserAction;
  resource?: string;
  resourceId?: string | number;
  details?: Record<string, any>;
  request?: NextRequest;
  metadata?: {
    previousValues?: any;
    newValues?: any;
    searchQuery?: string;
    filters?: Record<string, any>;
    exportFormat?: string;
    importFileName?: string;
    errorMessage?: string;
    [key: string]: any;
  };
}

// Main function to track user activity
export async function trackUserActivity(context: UserActivityContext): Promise<void> {
  try {
    const {
      userId,
      action,
      resource,
      resourceId,
      details,
      request,
      metadata,
    } = context;

    // Construct resource string
    const fullResource = resourceId 
      ? `${resource}:${resourceId}` 
      : resource;

    // Combine details and metadata
    const activityDetails = {
      ...details,
      ...metadata,
      resourceId,
    };

    // Log the user activity
    await logUserActivity({
      userId,
      action,
      resource: fullResource,
      details: activityDetails ? JSON.stringify(activityDetails) : null,
      request,
    });

    // Log to file for immediate visibility
    appLogger.info(`User Activity: ${action}`, {
      userId,
      action,
      resource: fullResource,
      details: activityDetails,
    });
  } catch (error) {
    appLogger.error('Failed to track user activity', { context }, error as Error);
  }
}

// Specific tracking functions for common operations

// Authentication tracking
export async function trackLogin(userId: number, request?: NextRequest, success: boolean = true): Promise<void> {
  await trackUserActivity({
    userId,
    action: success ? USER_ACTIONS.LOGIN : USER_ACTIONS.LOGIN_FAILED,
    resource: 'authentication',
    request,
    details: {
      success,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function trackLogout(userId: number, request?: NextRequest): Promise<void> {
  await trackUserActivity({
    userId,
    action: USER_ACTIONS.LOGOUT,
    resource: 'authentication',
    request,
    details: {
      timestamp: new Date().toISOString(),
    },
  });
}

// Page view tracking
export async function trackPageView(
  userId: number,
  pagePath: string,
  request?: NextRequest
): Promise<void> {
  await trackUserActivity({
    userId,
    action: USER_ACTIONS.PAGE_VIEW,
    resource: 'page',
    resourceId: pagePath,
    request,
    details: {
      path: pagePath,
      timestamp: new Date().toISOString(),
    },
  });
}

// Data operation tracking
export async function trackDataOperation(
  userId: number,
  operation: 'create' | 'update' | 'delete' | 'view',
  tableName: string,
  recordId: string | number,
  request?: NextRequest,
  metadata?: {
    previousValues?: any;
    newValues?: any;
    [key: string]: any;
  }
): Promise<void> {
  const actionMap = {
    create: USER_ACTIONS.CREATE_RECORD,
    update: USER_ACTIONS.UPDATE_RECORD,
    delete: USER_ACTIONS.DELETE_RECORD,
    view: USER_ACTIONS.VIEW_RECORD,
  };

  await trackUserActivity({
    userId,
    action: actionMap[operation],
    resource: tableName,
    resourceId: recordId,
    request,
    metadata,
  });

  // Also log audit trail for data changes
  if (operation !== 'view') {
    await logAuditTrail({
      tableName,
      recordId: recordId.toString(),
      action: operation.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
      oldValues: metadata?.previousValues,
      newValues: metadata?.newValues,
      userId,
      request,
    });
  }
}

// Sales operation tracking
export async function trackSalesOperation(
  userId: number,
  operation: 'create' | 'update' | 'view' | 'delete',
  type: 'invoice' | 'delivery_order' | 'return',
  recordId: string | number,
  request?: NextRequest,
  metadata?: any
): Promise<void> {
  const actionMap = {
    invoice: {
      create: USER_ACTIONS.CREATE_INVOICE,
      update: USER_ACTIONS.UPDATE_INVOICE,
      view: USER_ACTIONS.VIEW_INVOICE,
      delete: USER_ACTIONS.DELETE_INVOICE,
    },
    delivery_order: {
      create: USER_ACTIONS.CREATE_DELIVERY_ORDER,
      update: USER_ACTIONS.UPDATE_DELIVERY_ORDER,
      view: USER_ACTIONS.VIEW_RECORD,
      delete: USER_ACTIONS.DELETE_RECORD,
    },
    return: {
      create: USER_ACTIONS.CREATE_RETURN,
      update: USER_ACTIONS.UPDATE_RETURN,
      view: USER_ACTIONS.VIEW_RECORD,
      delete: USER_ACTIONS.DELETE_RECORD,
    },
  };

  await trackUserActivity({
    userId,
    action: actionMap[type][operation],
    resource: type,
    resourceId: recordId,
    request,
    metadata,
  });
}

// Search operation tracking
export async function trackSearch(
  userId: number,
  searchQuery: string,
  resource: string,
  resultsCount: number,
  request?: NextRequest,
  filters?: Record<string, any>
): Promise<void> {
  await trackUserActivity({
    userId,
    action: USER_ACTIONS.SEARCH_RECORDS,
    resource,
    request,
    metadata: {
      searchQuery,
      resultsCount,
      filters,
      timestamp: new Date().toISOString(),
    },
  });
}

// Export operation tracking
export async function trackExport(
  userId: number,
  resource: string,
  format: string,
  recordCount: number,
  request?: NextRequest,
  filters?: Record<string, any>
): Promise<void> {
  await trackUserActivity({
    userId,
    action: USER_ACTIONS.EXPORT_DATA,
    resource,
    request,
    metadata: {
      exportFormat: format,
      recordCount,
      filters,
      timestamp: new Date().toISOString(),
    },
  });
}

// Import operation tracking
export async function trackImport(
  userId: number,
  resource: string,
  fileName: string,
  recordCount: number,
  request?: NextRequest,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  await trackUserActivity({
    userId,
    action: USER_ACTIONS.IMPORT_DATA,
    resource,
    request,
    metadata: {
      importFileName: fileName,
      recordCount,
      success,
      errorMessage,
      timestamp: new Date().toISOString(),
    },
  });
}

// Security event tracking
export async function trackSecurityEvent(
  userId: number | undefined,
  event: 'unauthorized_access' | 'permission_denied' | 'suspicious_activity',
  resource: string,
  request?: NextRequest,
  details?: Record<string, any>
): Promise<void> {
  const actionMap = {
    unauthorized_access: USER_ACTIONS.UNAUTHORIZED_ACCESS,
    permission_denied: USER_ACTIONS.PERMISSION_DENIED,
    suspicious_activity: USER_ACTIONS.SUSPICIOUS_ACTIVITY,
  };

  // If no userId, create a system log instead
  if (!userId) {
    appLogger.logSecurityEvent({
      event: actionMap[event],
      details,
      severity: 'warn',
    });
    return;
  }

  await trackUserActivity({
    userId,
    action: actionMap[event],
    resource,
    request,
    details: {
      securityEvent: event,
      ...details,
      timestamp: new Date().toISOString(),
    },
  });
}

// Batch activity tracking for multiple operations
export async function trackBatchActivity(
  activities: UserActivityContext[]
): Promise<void> {
  try {
    await Promise.all(
      activities.map(activity => trackUserActivity(activity))
    );
  } catch (error) {
    appLogger.error('Failed to track batch activities', { activities }, error as Error);
  }
}

// Get user activity summary
export async function getUserActivitySummary(
  userId: number,
  timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
): Promise<{
  totalActivities: number;
  topActions: Array<{ action: string; count: number }>;
  recentActivities: Array<{
    action: string;
    resource?: string;
    timestamp: Date;
    details?: any;
  }>;
}> {
  const now = new Date();
  let startTime: Date;
  
  switch (timeRange) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  try {
    const { prisma } = await import('./prisma');
    
    const [totalCount, topActions, recentActivities] = await Promise.all([
      // Total activity count
      prisma.hps_user_activity.count({
        where: {
          user_id: userId,
          timestamp: {
            gte: startTime,
          },
        },
      }),
      
      // Top actions
      prisma.hps_user_activity.groupBy({
        by: ['action'],
        where: {
          user_id: userId,
          timestamp: {
            gte: startTime,
          },
        },
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),
      
      // Recent activities
      prisma.hps_user_activity.findMany({
        where: {
          user_id: userId,
          timestamp: {
            gte: startTime,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 20,
        select: {
          action: true,
          resource: true,
          timestamp: true,
          details: true,
        },
      }),
    ]);

    return {
      totalActivities: totalCount,
      topActions: topActions.map(item => ({
        action: item.action,
        count: item._count.action,
      })),
      recentActivities: recentActivities.map(activity => ({
        action: activity.action,
        resource: activity.resource || undefined,
        timestamp: activity.timestamp,
        details: activity.details ? JSON.parse(activity.details) : undefined,
      })),
    };
  } catch (error) {
    appLogger.error('Failed to get user activity summary', { userId, timeRange }, error as Error);
    throw error;
  }
}