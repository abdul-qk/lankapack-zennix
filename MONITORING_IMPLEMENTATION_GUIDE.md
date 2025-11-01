# Monitoring and Logging Implementation Guide

This guide explains how to implement and use the monitoring and logging system in your Next.js application.

## Overview

The monitoring system consists of:
- **Winston Logger**: File-based logging with rotation
- **Database Logging**: Structured logs stored in MySQL
- **User Activity Tracking**: Comprehensive user action logging
- **Performance Monitoring**: API response time and error tracking
- **Monitoring Dashboard**: Real-time system metrics and logs

## Quick Start

### 1. Database Setup

First, run the SQL commands from `database-setup-instructions.md` to create the required tables:
- `hps_audit_log` - For tracking data changes
- `hps_system_log` - For application logs
- `hps_performance_log` - For performance metrics
- `hps_user_activity` - For user activity tracking

**Note**: For MariaDB compatibility, JSON data is stored as TEXT fields and automatically converted to/from JSON in the application code.

```bash
# Apply the database migrations
mysql -u your_username -p your_database < database-setup-instructions.md
```

### 2. Generate Prisma Client

```bash
npx prisma generate
npx prisma db push
```

### 3. Environment Variables

Ensure your `.env` file includes:

```env
NODE_ENV=production
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
JWT_SECRET="your-jwt-secret"
```

## Implementation Examples

### Basic API Route with Monitoring

```typescript
// pages/api/example.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withMonitoring } from '../../lib/monitoring';
import { trackUserActivity, USER_ACTIONS } from '../../lib/user-activity';
import { verifyToken } from '../../lib/auth';
import appLogger from '../../lib/logger';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Track page view
    await trackUserActivity({
      userId: decoded.userId,
      action: USER_ACTIONS.PAGE_VIEW,
      resource: 'example-page',
      request: req,
    });

    // Your business logic here
    const data = { message: 'Hello World' };
    
    // Log successful operation
    appLogger.info('Example API called successfully', {
      userId: decoded.userId,
      data,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    appLogger.error('Example API error', { query: req.query }, error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Wrap with monitoring middleware
export default withMonitoring(handler);
```

### CRUD Operations with Audit Trail

```typescript
// pages/api/invoices/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withMonitoring } from '../../../lib/monitoring';
import { trackDataOperation, trackSalesOperation } from '../../../lib/user-activity';
import { prisma } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const invoice = await prisma.hps_bill_info.findUnique({
          where: { he_bill_id: parseInt(id as string) },
        });
        
        // Track view operation
        await trackSalesOperation(
          decoded.userId,
          'view',
          'invoice',
          id as string,
          req
        );
        
        return res.status(200).json({ success: true, data: invoice });

      case 'PUT':
        // Get current values for audit trail
        const currentInvoice = await prisma.hps_bill_info.findUnique({
          where: { he_bill_id: parseInt(id as string) },
        });
        
        // Update invoice
        const updatedInvoice = await prisma.hps_bill_info.update({
          where: { he_bill_id: parseInt(id as string) },
          data: req.body,
        });
        
        // Track update with audit trail
        await trackDataOperation(
          decoded.userId,
          'update',
          'hps_bill_info',
          id as string,
          req,
          {
            previousValues: currentInvoice,
            newValues: updatedInvoice,
          }
        );
        
        return res.status(200).json({ success: true, data: updatedInvoice });

      case 'DELETE':
        // Get current values before deletion
        const invoiceToDelete = await prisma.hps_bill_info.findUnique({
          where: { he_bill_id: parseInt(id as string) },
        });
        
        // Delete invoice
        await prisma.hps_bill_info.delete({
          where: { he_bill_id: parseInt(id as string) },
        });
        
        // Track deletion
        await trackDataOperation(
          decoded.userId,
          'delete',
          'hps_bill_info',
          id as string,
          req,
          {
            previousValues: invoiceToDelete,
          }
        );
        
        return res.status(200).json({ success: true, message: 'Invoice deleted' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    appLogger.error('Invoice API error', { id, method: req.method }, error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withMonitoring(handler);
```

### Authentication with Activity Tracking

```typescript
// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withMonitoring } from '../../../lib/monitoring';
import { trackLogin } from '../../../lib/user-activity';
import { generateToken } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcrypt';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  try {
    // Find user
    const user = await prisma.hps_login.findFirst({
      where: { he_user_name: username },
    });

    if (!user) {
      // Track failed login attempt
      await trackLogin(0, req, false); // Use 0 for unknown user
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password (replace with proper bcrypt when you fix the MD5 issue)
    const isValid = await bcrypt.compare(password, user.he_password);
    
    if (!isValid) {
      // Track failed login
      await trackLogin(user.he_user_id, req, false);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken({ userId: user.he_user_id, username: user.he_user_name });
    
    // Track successful login
    await trackLogin(user.he_user_id, req, true);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.he_user_id,
        username: user.he_user_name,
        level: user.he_user_level,
      },
    });
  } catch (error) {
    appLogger.error('Login error', { username }, error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withMonitoring(handler);
```

### Search with Activity Tracking

```typescript
// pages/api/search/invoices.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withMonitoring } from '../../../lib/monitoring';
import { trackSearch } from '../../../lib/user-activity';
import { prisma } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { q: searchQuery, status, dateFrom, dateTo } = req.query;
    
    // Build search filters
    const filters: any = {};
    
    if (searchQuery) {
      filters.OR = [
        { he_bill_no: { contains: searchQuery as string } },
        { he_customer_name: { contains: searchQuery as string } },
      ];
    }
    
    if (status) {
      filters.he_status = status;
    }
    
    if (dateFrom || dateTo) {
      filters.he_bill_date = {};
      if (dateFrom) filters.he_bill_date.gte = new Date(dateFrom as string);
      if (dateTo) filters.he_bill_date.lte = new Date(dateTo as string);
    }

    // Execute search
    const results = await prisma.hps_bill_info.findMany({
      where: filters,
      take: 50,
      orderBy: { he_bill_date: 'desc' },
    });

    // Track search activity
    await trackSearch(
      decoded.userId,
      searchQuery as string || '',
      'invoices',
      results.length,
      req,
      { status, dateFrom, dateTo }
    );

    res.status(200).json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    appLogger.error('Search error', { query: req.query }, error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withMonitoring(handler);
```

### Export with Activity Tracking

```typescript
// pages/api/export/invoices.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withMonitoring } from '../../../lib/monitoring';
import { trackExport } from '../../../lib/user-activity';
import { prisma } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { format = 'csv', filters = {} } = req.body;
    
    // Get data based on filters
    const invoices = await prisma.hps_bill_info.findMany({
      where: filters,
      include: {
        hps_bill_item: true,
      },
    });

    // Track export activity
    await trackExport(
      decoded.userId,
      'invoices',
      format,
      invoices.length,
      req,
      filters
    );

    // Generate export data (simplified)
    let exportData: string;
    
    if (format === 'csv') {
      const headers = 'Bill No,Customer,Date,Amount\n';
      const rows = invoices.map(inv => 
        `${inv.he_bill_no},${inv.he_customer_name},${inv.he_bill_date},${inv.he_total_amount}`
      ).join('\n');
      exportData = headers + rows;
    } else {
      exportData = JSON.stringify(invoices, null, 2);
    }

    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=invoices.${format}`);
    res.status(200).send(exportData);
  } catch (error) {
    appLogger.error('Export error', { body: req.body }, error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withMonitoring(handler);
```

## Frontend Integration

### React Hook for Activity Tracking

```typescript
// hooks/useActivityTracking.ts
import { useCallback } from 'react';
import { useAuth } from './useAuth'; // Your auth hook

export function useActivityTracking() {
  const { user } = useAuth();

  const trackActivity = useCallback(async (
    action: string,
    resource?: string,
    details?: any
  ) => {
    if (!user) return;

    try {
      await fetch('/api/activity/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action,
          resource,
          details,
        }),
      });
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }, [user]);

  return { trackActivity };
}
```

### Component with Activity Tracking

```typescript
// components/InvoiceList.tsx
import React, { useEffect } from 'react';
import { useActivityTracking } from '../hooks/useActivityTracking';

export function InvoiceList() {
  const { trackActivity } = useActivityTracking();

  useEffect(() => {
    // Track page view
    trackActivity('page_view', 'invoice-list');
  }, [trackActivity]);

  const handleInvoiceClick = (invoiceId: string) => {
    // Track invoice view
    trackActivity('view_record', 'invoice', { invoiceId });
    // Navigate to invoice detail
  };

  const handleExport = () => {
    // Track export action
    trackActivity('export_data', 'invoices', { format: 'csv' });
    // Trigger export
  };

  return (
    <div>
      {/* Your invoice list UI */}
      <button onClick={handleExport}>Export CSV</button>
    </div>
  );
}
```

## Monitoring Dashboard

### Accessing the Dashboard

The monitoring dashboard is available at `/api/monitoring/dashboard` and requires admin privileges.

```typescript
// Example dashboard component
import React, { useState, useEffect } from 'react';

interface DashboardData {
  systemMetrics: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    activeUsers: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  };
  // ... other data types
}

export function MonitoringDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/monitoring/dashboard?timeRange=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const result = await response.json();
        setData(result.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [timeRange]);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Requests</h3>
          <p>{data.systemMetrics.totalRequests}</p>
        </div>
        <div className="metric-card">
          <h3>Avg Response Time</h3>
          <p>{data.systemMetrics.averageResponseTime}ms</p>
        </div>
        <div className="metric-card">
          <h3>Error Rate</h3>
          <p>{data.systemMetrics.errorRate}%</p>
        </div>
        <div className="metric-card">
          <h3>Active Users</h3>
          <p>{data.systemMetrics.activeUsers}</p>
        </div>
      </div>
      {/* Add more dashboard components */}
    </div>
  );
}
```

## Log File Locations

- **Application Logs**: `logs/app-YYYY-MM-DD.log`
- **Error Logs**: `logs/error-YYYY-MM-DD.log`
- **System Logs**: `logs/system-YYYY-MM-DD.log`

## Best Practices

1. **Always wrap API routes** with `withMonitoring` middleware
2. **Track user activities** for important business operations
3. **Use structured logging** with consistent field names
4. **Include context** in log messages (user ID, request ID, etc.)
5. **Monitor performance** regularly through the dashboard
6. **Set up alerts** for critical system health metrics
7. **Regularly review** audit trails for security compliance
8. **Clean up old logs** to manage disk space

### Important Notes:
- All logging functions are async and should be awaited
- Database logging failures are caught and logged to files to prevent application crashes
- User activity tracking automatically captures IP address and user agent from requests
- Performance logging includes memory usage and response times
- **MariaDB Compatibility**: JSON data is automatically converted to/from strings when storing in TEXT fields

## Troubleshooting

### Common Issues

1. **Database connection errors**: Check your `DATABASE_URL` in `.env`
2. **Missing tables**: Run the SQL commands from `database-setup-instructions.md`
3. **Permission errors**: Ensure the database user has proper permissions
4. **Log file permissions**: Check that the application can write to the `logs/` directory

### Debug Mode

Set `NODE_ENV=development` to see detailed error messages in API responses.

## Security Considerations

1. **Sensitive data**: Never log passwords, tokens, or other sensitive information
2. **Access control**: Ensure only authorized users can access monitoring endpoints
3. **Log retention**: Implement proper log retention policies
4. **Data privacy**: Consider GDPR/privacy requirements for user activity logs

## Performance Tips

1. **Batch operations**: Use batch logging for high-volume operations
2. **Async logging**: Database logging is already async to avoid blocking requests
3. **Index optimization**: Ensure proper indexes on timestamp columns
4. **Log rotation**: Winston automatically rotates log files to prevent disk space issues

This monitoring system provides comprehensive visibility into your application's behavior while maintaining good performance and security practices.