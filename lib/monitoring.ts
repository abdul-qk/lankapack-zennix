import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import appLogger from './logger';
import { prisma } from './prisma';

// Types for monitoring
interface RequestContext {
  requestId: string;
  userId?: number;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  startTime: number;
}

interface MonitoringOptions {
  logToDatabase?: boolean;
  logToFile?: boolean;
  trackPerformance?: boolean;
  trackUserActivity?: boolean;
}

// Default monitoring options
const defaultOptions: MonitoringOptions = {
  logToDatabase: true,
  logToFile: true,
  trackPerformance: true,
  trackUserActivity: true,
};

// Extract user information from request (you may need to adjust based on your auth implementation)
function extractUserInfo(request: NextRequest): { userId?: number; sessionId?: string } {
  try {
    // Try to get user info from cookies or headers
    const sessionId = request.cookies.get('sessionId')?.value;
    const userIdCookie = request.cookies.get('userId')?.value;
    const userId = userIdCookie ? parseInt(userIdCookie, 10) : undefined;
    
    return { userId, sessionId };
  } catch (error) {
    return {};
  }
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-vercel-forwarded-for');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddr || 'unknown';
}

// Higher-order function to wrap API routes with monitoring
export function withMonitoring(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: MonitoringOptions = {}
) {
  const config = { ...defaultOptions, ...options };
  
  return async function monitoredHandler(
    request: NextRequest,
    context?: any
  ): Promise<NextResponse> {
    const requestId = uuidv4();
    const startTime = Date.now();
    const { userId, sessionId } = extractUserInfo(request);
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || undefined;
    const method = request.method;
    const endpoint = request.nextUrl.pathname;
    
    const requestContext: RequestContext = {
      requestId,
      userId,
      sessionId,
      ipAddress,
      userAgent,
      startTime,
    };
    
    // Log request start
    if (config.logToFile) {
      appLogger.info(`Incoming ${method} request to ${endpoint}`, {
        requestId,
        userId,
        sessionId,
        ipAddress,
        userAgent,
        endpoint,
        method,
      });
    }
    
    let response: NextResponse;
    let error: Error | null = null;
    
    try {
      // Execute the actual handler
      response = await handler(request, { ...context, requestContext });
    } catch (err) {
      error = err as Error;
      
      // Log error
      if (config.logToFile) {
        appLogger.error(`Error in ${method} ${endpoint}`, {
          requestId,
          userId,
          sessionId,
          ipAddress,
          userAgent,
          endpoint,
          method,
        }, error);
      }
      
      // Log to database
      if (config.logToDatabase) {
        try {
          await prisma.hps_system_log.create({
            data: {
              level: 'ERROR',
              message: `API Error: ${method} ${endpoint} - ${error.message}`,
              context: JSON.stringify({
                requestId,
                endpoint,
                method,
                error: error.message,
              }),
              source: `API:${endpoint}`,
              user_id: userId,
              session_id: sessionId,
              request_id: requestId,
              ip_address: ipAddress,
              user_agent: userAgent,
              stack_trace: error.stack,
            },
          });
        } catch (dbError) {
          appLogger.error('Failed to log error to database', {}, dbError as Error);
        }
      }
      
      // Return error response
      response = NextResponse.json(
        { error: 'Internal Server Error', requestId },
        { status: 500 }
      );
    }
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const statusCode = response.status;
    
    // Log request completion
    if (config.logToFile) {
      appLogger.logApiRequest({
        method,
        endpoint,
        statusCode,
        responseTime,
        userId,
        ipAddress,
        userAgent,
        requestId,
        sessionId,
      });
    }
    
    // Log performance metrics to database
    if (config.trackPerformance && config.logToDatabase) {
      try {
        await prisma.hps_performance_log.create({
          data: {
            endpoint,
            method,
            response_time: responseTime,
            status_code: statusCode,
            user_id: userId,
            ip_address: ipAddress,
            user_agent: userAgent,
            session_id: sessionId,
            request_id: requestId,
          },
        });
      } catch (dbError) {
        appLogger.error('Failed to log performance metrics to database', {}, dbError as Error);
      }
    }
    
    // Add monitoring headers to response
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Response-Time', `${responseTime}ms`);
    
    return response;
  };
}

// Function to log user activities
export async function logUserActivity({
  userId,
  action,
  resource,
  details,
  request,
}: {
  userId: number;
  action: string;
  resource?: string;
  details?: any;
  request?: NextRequest;
}) {
  const ipAddress = request ? getClientIP(request) : undefined;
  const userAgent = request?.headers.get('user-agent') || undefined;
  const sessionId = request?.cookies.get('sessionId')?.value;
  
  // Log to file
  appLogger.logUserActivity({
    userId,
    action,
    resource,
    details,
    ipAddress,
    userAgent,
    sessionId,
  });
  
  // Log to database
  try {
    await prisma.hps_user_activity.create({
      data: {
        user_id: userId,
        action,
        resource,
        details: details ? JSON.stringify(details) : null,
        ip_address: ipAddress,
        user_agent: userAgent,
        session_id: sessionId,
      },
    });
  } catch (error) {
    appLogger.error('Failed to log user activity to database', {}, error as Error);
  }
}

// Function to log audit trail for data changes
export async function logAuditTrail({
  tableName,
  recordId,
  action,
  oldValues,
  newValues,
  userId,
  request,
}: {
  tableName: string;
  recordId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValues?: any;
  newValues?: any;
  userId?: number;
  request?: NextRequest;
}) {
  const ipAddress = request ? getClientIP(request) : undefined;
  const userAgent = request?.headers.get('user-agent') || undefined;
  const sessionId = request?.cookies.get('sessionId')?.value;
  
  // Log to file
  appLogger.logDatabaseOperation({
    operation: action,
    table: tableName,
    recordId,
    userId,
    oldValues,
    newValues,
    sessionId,
  });
  
  // Log to database
  try {
    await prisma.hps_audit_log.create({
        data: {
          table_name: tableName,
          record_id: recordId,
          action,
          old_values: oldValues ? JSON.stringify(oldValues) : null,
          new_values: newValues ? JSON.stringify(newValues) : null,
          user_id: userId,
          user_ip: ipAddress,
          user_agent: userAgent,
          session_id: sessionId,
        },
      });
  } catch (error) {
    appLogger.error('Failed to log audit trail to database', {}, error as Error);
  }
}

// Function to log system events
export async function logSystemEvent({
  level,
  message,
  context,
  source,
  userId,
  request,
}: {
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  context?: any;
  source?: string;
  userId?: number;
  request?: NextRequest;
}) {
  const ipAddress = request ? getClientIP(request) : undefined;
  const userAgent = request?.headers.get('user-agent') || undefined;
  const sessionId = request?.cookies.get('sessionId')?.value;
  const requestId = request?.headers.get('x-request-id') || uuidv4();
  
  // Log to file
  appLogger.logSystemEvent({
    event: message,
    details: context,
    severity: level.toLowerCase() as 'info' | 'warn' | 'error',
  });
  
  // Log to database
  try {
    await prisma.hps_system_log.create({
      data: {
        level,
        message,
        context: context ? JSON.stringify(context) : null,
        source,
        user_id: userId,
        session_id: sessionId,
        request_id: requestId,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });
  } catch (error) {
    appLogger.error('Failed to log system event to database', {}, error as Error);
  }
}

// Middleware for monitoring dashboard metrics
export async function getMonitoringMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
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
    const [performanceMetrics, errorCounts, userActivity, systemEvents] = await Promise.all([
      // Performance metrics
      prisma.hps_performance_log.groupBy({
        by: ['endpoint', 'method'],
        where: {
          timestamp: {
            gte: startTime,
          },
        },
        _avg: {
          response_time: true,
        },
        _count: {
          id: true,
        },
        _max: {
          response_time: true,
        },
      }),
      
      // Error counts
      prisma.hps_system_log.groupBy({
        by: ['level'],
        where: {
          timestamp: {
            gte: startTime,
          },
        },
        _count: {
          id: true,
        },
      }),
      
      // User activity
      prisma.hps_user_activity.groupBy({
        by: ['action'],
        where: {
          timestamp: {
            gte: startTime,
          },
        },
        _count: {
          id: true,
        },
      }),
      
      // System events
      prisma.hps_system_log.findMany({
        where: {
          timestamp: {
            gte: startTime,
          },
          level: 'ERROR',
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 10,
        select: {
          message: true,
          timestamp: true,
          source: true,
          context: true,
        },
      }),
    ]);
    
    return {
      performanceMetrics,
      errorCounts,
      userActivity,
      recentErrors: systemEvents,
      timeRange,
      generatedAt: now,
    };
  } catch (error) {
    appLogger.error('Failed to fetch monitoring metrics', {}, error as Error);
    throw error;
  }
}

export type { RequestContext, MonitoringOptions };