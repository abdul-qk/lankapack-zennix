import { NextApiRequest, NextApiResponse } from 'next';
import { withMonitoring, getMonitoringMetrics } from '../../../lib/monitoring';
import { getUserActivitySummary } from '../../../lib/user-activity';
import appLogger from '../../../lib/logger';
import { verifyToken } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

// Interface for dashboard data
interface DashboardData {
  systemMetrics: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    activeUsers: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  };
  recentLogs: Array<{
    id: number;
    level: string;
    message: string;
    timestamp: Date;
    details?: any;
  }>;
  userActivity: {
    totalActivities: number;
    topActions: Array<{ action: string; count: number }>;
    recentActivities: Array<{
      action: string;
      resource?: string;
      timestamp: Date;
      user?: { he_user_id: number; he_username: string };
    }>;
  };
  auditTrail: Array<{
    id: number;
    tableName: string;
    action: string;
    timestamp: Date;
    user?: { he_user_id: number; he_username: string };
  }>;
  performanceMetrics: Array<{
    endpoint: string;
    averageResponseTime: number;
    requestCount: number;
    errorCount: number;
  }>;
}

async function getDashboardData(timeRange: '1h' | '24h' | '7d' = '24h'): Promise<DashboardData> {
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
  }

  try {
    // Get system metrics
    const systemMetrics = await getMonitoringMetrics();
    
    // Get recent system logs
    const recentLogsRaw = await prisma.hps_system_log.findMany({
      where: {
        timestamp: {
          gte: startTime,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 50,
      select: {
        id: true,
        level: true,
        message: true,
        timestamp: true,
        stack_trace: true,
      },
    });

    // Parse JSON strings back to objects
    const recentLogs = recentLogsRaw.map(log => ({
      ...log,
      stack_trace: log.stack_trace ? JSON.parse(log.stack_trace) : null,
    }));

    // Get user activity summary
    const userActivityData = await prisma.hps_user_activity.findMany({
      where: {
        timestamp: {
          gte: startTime,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100,
      include: {
        user: {
          select: {
            he_user_id: true,
            he_username: true,
          },
        },
      },
    });

    // Process user activity data
    const totalActivities = userActivityData.length;
    const actionCounts = userActivityData.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentActivities = userActivityData.slice(0, 20).map(activity => ({
      action: activity.action,
      resource: activity.resource || undefined,
      timestamp: activity.timestamp,
      user: activity.user || undefined,
    }));

    // Get audit trail
    const auditTrail = await prisma.hps_audit_log.findMany({
      where: {
        timestamp: {
          gte: startTime,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 50,
      select: {
        id: true,
        table_name: true,
        action: true,
        timestamp: true,
        user: {
          select: {
            he_user_id: true,
            he_username: true,
          },
        },
      },
    });

    // Get performance metrics
    const performanceData = await prisma.hps_performance_log.findMany({
      where: {
        timestamp: {
          gte: startTime,
        },
      },
      select: {
        endpoint: true,
        response_time: true,
        status_code: true,
      },
    });

    // Process performance data
    const endpointMetrics = performanceData.reduce((acc, log) => {
      if (!acc[log.endpoint]) {
        acc[log.endpoint] = {
          totalTime: 0,
          requestCount: 0,
          errorCount: 0,
        };
      }
      
      acc[log.endpoint].totalTime += log.response_time;
      acc[log.endpoint].requestCount += 1;
      
      if (log.status_code >= 400) {
        acc[log.endpoint].errorCount += 1;
      }
      
      return acc;
    }, {} as Record<string, { totalTime: number; requestCount: number; errorCount: number }>);

    const performanceMetrics = Object.entries(endpointMetrics)
      .map(([endpoint, metrics]) => ({
        endpoint,
        averageResponseTime: metrics.requestCount > 0 ? metrics.totalTime / metrics.requestCount : 0,
        requestCount: metrics.requestCount,
        errorCount: metrics.errorCount,
      }))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 20);

    // Calculate system health
    const totalRequests = performanceMetrics.reduce((sum, metric) => sum + metric.requestCount, 0);
    const totalErrors = performanceMetrics.reduce((sum, metric) => sum + metric.errorCount, 0);
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    const avgResponseTime = performanceMetrics.length > 0 
      ? performanceMetrics.reduce((sum, metric) => sum + metric.averageResponseTime, 0) / performanceMetrics.length 
      : 0;

    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (errorRate > 10 || avgResponseTime > 2000) {
      systemHealth = 'critical';
    } else if (errorRate > 5 || avgResponseTime > 1000) {
      systemHealth = 'warning';
    }

    // Get active users (users who have been active in the last hour)
    const activeUsersCount = await prisma.hps_user_activity.findMany({
      where: {
        timestamp: {
          gte: new Date(now.getTime() - 60 * 60 * 1000), // Last hour
        },
      },
      distinct: ['user_id'],
      select: {
        user_id: true,
      },
    });

    return {
      systemMetrics: {
        totalRequests,
        averageResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        activeUsers: activeUsersCount.length,
        systemHealth,
      },
      recentLogs,
      userActivity: {
        totalActivities,
        topActions,
        recentActivities,
      },
      auditTrail: auditTrail.map(log => ({
        id: log.id,
        tableName: log.table_name,
        action: log.action,
        timestamp: log.timestamp,
        user: log.user || undefined,
      })),
      performanceMetrics,
    };
  } catch (error) {
    appLogger.error('Failed to get dashboard data', { timeRange }, error as Error);
    throw error;
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user has admin privileges (you may want to implement proper role checking)
    const user = await prisma.hps_login.findUnique({
      where: { he_user_id: decoded.userId },
      select: { he_full_name: true, user_level: true },
    });

    if (!user || user.user_level !== '1') { // Assuming level 1 is admin
      return res.status(403).json({ error: 'Admin access required', userLevel: user?.user_level, he_username: user?.he_full_name }); 
    }

    // Get query parameters
    const timeRange = (req.query.timeRange as '1h' | '24h' | '7d') || '24h';
    const section = req.query.section as string;

    // Get dashboard data
    const dashboardData = await getDashboardData(timeRange);

    // If specific section requested, return only that section
    if (section) {
      switch (section) {
        case 'metrics':
          return res.status(200).json({ systemMetrics: dashboardData.systemMetrics });
        case 'logs':
          return res.status(200).json({ recentLogs: dashboardData.recentLogs });
        case 'activity':
          return res.status(200).json({ userActivity: dashboardData.userActivity });
        case 'audit':
          return res.status(200).json({ auditTrail: dashboardData.auditTrail });
        case 'performance':
          return res.status(200).json({ performanceMetrics: dashboardData.performanceMetrics });
        default:
          return res.status(400).json({ error: 'Invalid section' });
      }
    }

    // Return full dashboard data
    res.status(200).json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    appLogger.error('Dashboard API error', { query: req.query }, error as Error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
}

export default handler;