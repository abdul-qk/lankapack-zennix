import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(logColors);

// Create logs directory path
const logsDir = path.join(process.cwd(), 'logs');

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      log += `\nStack: ${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Create transports
const transports: winston.transport[] = [];

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    })
  );
}

// File transport for all logs
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
    level: 'info',
  })
);

// File transport for error logs only
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: logFormat,
    level: 'error',
  })
);

// File transport for system logs (performance, audit, etc.)
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'system-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '7d',
    format: logFormat,
    level: 'debug',
  })
);

// Create the logger
const logger = winston.createLogger({
  levels: logLevels,
  transports,
  exitOnError: false,
});

// Enhanced logging interface
interface LogContext {
  userId?: number;
  sessionId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

class Logger {
  private winston: winston.Logger;

  constructor(winstonLogger: winston.Logger) {
    this.winston = winstonLogger;
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.winston.error(message, {
      ...context,
      stack: error?.stack,
      errorMessage: error?.message,
    });
  }

  warn(message: string, context?: LogContext) {
    this.winston.warn(message, context);
  }

  info(message: string, context?: LogContext) {
    this.winston.info(message, context);
  }

  debug(message: string, context?: LogContext) {
    this.winston.debug(message, context);
  }

  // Specific logging methods for different types of events
  
  logApiRequest({
    method,
    endpoint,
    statusCode,
    responseTime,
    userId,
    ipAddress,
    userAgent,
    requestId,
    sessionId,
  }: {
    method: string;
    endpoint: string;
    statusCode: number;
    responseTime: number;
    userId?: number;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    sessionId?: string;
  }) {
    this.info(`API Request: ${method} ${endpoint}`, {
      type: 'api_request',
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

  logUserActivity({
    userId,
    action,
    resource,
    details,
    ipAddress,
    userAgent,
    sessionId,
  }: {
    userId: number;
    action: string;
    resource?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }) {
    this.info(`User Activity: ${action}`, {
      type: 'user_activity',
      userId,
      action,
      resource,
      details,
      ipAddress,
      userAgent,
      sessionId,
    });
  }

  logDatabaseOperation({
    operation,
    table,
    recordId,
    userId,
    oldValues,
    newValues,
    sessionId,
  }: {
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    table: string;
    recordId: string;
    userId?: number;
    oldValues?: any;
    newValues?: any;
    sessionId?: string;
  }) {
    this.info(`Database Operation: ${operation} on ${table}`, {
      type: 'database_operation',
      operation,
      table,
      recordId,
      userId,
      oldValues,
      newValues,
      sessionId,
    });
  }

  logSecurityEvent({
    event,
    userId,
    ipAddress,
    userAgent,
    details,
    severity = 'warn',
  }: {
    event: string;
    userId?: number;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
    severity?: 'info' | 'warn' | 'error';
  }) {
    const message = `Security Event: ${event}`;
    const context = {
      type: 'security_event',
      event,
      userId,
      ipAddress,
      userAgent,
      details,
    };

    switch (severity) {
      case 'error':
        this.error(message, context);
        break;
      case 'warn':
        this.warn(message, context);
        break;
      default:
        this.info(message, context);
    }
  }

  logSystemEvent({
    event,
    details,
    severity = 'info',
  }: {
    event: string;
    details?: any;
    severity?: 'info' | 'warn' | 'error';
  }) {
    const message = `System Event: ${event}`;
    const context = {
      type: 'system_event',
      event,
      details,
    };

    switch (severity) {
      case 'error':
        this.error(message, context);
        break;
      case 'warn':
        this.warn(message, context);
        break;
      default:
        this.info(message, context);
    }
  }
}

// Create and export the enhanced logger instance
const appLogger = new Logger(logger);

export default appLogger;
export type { Logger, LogContext };

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  appLogger.error('Uncaught Exception', {}, error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  appLogger.error('Unhandled Rejection', {
    promise: promise.toString(),
    reason: reason?.toString(),
  });
});