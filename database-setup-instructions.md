# Database Setup Instructions for Logging and Monitoring

This document contains SQL instructions to create the necessary database tables for the logging and monitoring system.

## Prerequisites

- Ensure you have administrative access to your database
- Run these commands in your database management tool (e.g., phpMyAdmin, MySQL Workbench, or command line)
- Execute the commands in the order provided

## 1. Audit Log Table

This table tracks all data changes (CREATE, UPDATE, DELETE operations) across the application.

```sql
CREATE TABLE `hps_audit_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `table_name` varchar(100) NOT NULL COMMENT 'Name of the table that was modified',
  `record_id` varchar(50) NOT NULL COMMENT 'ID of the record that was modified',
  `action` enum('CREATE','UPDATE','DELETE') NOT NULL COMMENT 'Type of operation performed',
  `old_values` text DEFAULT NULL COMMENT 'Previous values before the change (for UPDATE and DELETE) - JSON format',
  `new_values` text DEFAULT NULL COMMENT 'New values after the change (for CREATE and UPDATE) - JSON format',
  `user_id` int(11) DEFAULT NULL COMMENT 'ID of the user who performed the action',
  `user_ip` varchar(45) DEFAULT NULL COMMENT 'IP address of the user',
  `user_agent` text DEFAULT NULL COMMENT 'Browser/client information',
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the action was performed',
  `session_id` varchar(255) DEFAULT NULL COMMENT 'Session identifier',
  PRIMARY KEY (`id`),
  KEY `idx_table_record` (`table_name`, `record_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit trail for all data changes';
```

## 2. System Log Table

This table tracks system events, errors, and application-level activities.

```sql
CREATE TABLE `hps_system_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `level` enum('ERROR','WARN','INFO','DEBUG') NOT NULL COMMENT 'Log level',
  `message` text NOT NULL COMMENT 'Log message',
  `context` text DEFAULT NULL COMMENT 'Additional context data - JSON format',
  `source` varchar(255) DEFAULT NULL COMMENT 'Source of the log (e.g., API route, component)',
  `user_id` int(11) DEFAULT NULL COMMENT 'User ID if applicable',
  `session_id` varchar(255) DEFAULT NULL COMMENT 'Session identifier',
  `request_id` varchar(255) DEFAULT NULL COMMENT 'Unique request identifier',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'Client IP address',
  `user_agent` text DEFAULT NULL COMMENT 'Browser/client information',
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the event occurred',
  `stack_trace` text DEFAULT NULL COMMENT 'Stack trace for errors',
  PRIMARY KEY (`id`),
  KEY `idx_level` (`level`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_source` (`source`),
  KEY `idx_request_id` (`request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='System events and application logs';
```

## 3. Performance Metrics Table

This table tracks API performance and usage metrics.

```sql
CREATE TABLE `hps_performance_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `endpoint` varchar(255) NOT NULL COMMENT 'API endpoint path',
  `method` enum('GET','POST','PUT','DELETE','PATCH') NOT NULL COMMENT 'HTTP method',
  `response_time` int(11) NOT NULL COMMENT 'Response time in milliseconds',
  `status_code` int(11) NOT NULL COMMENT 'HTTP status code',
  `user_id` int(11) DEFAULT NULL COMMENT 'User ID if authenticated',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'Client IP address',
  `user_agent` text DEFAULT NULL COMMENT 'Browser/client information',
  `request_size` int(11) DEFAULT NULL COMMENT 'Request payload size in bytes',
  `response_size` int(11) DEFAULT NULL COMMENT 'Response payload size in bytes',
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the request was made',
  `session_id` varchar(255) DEFAULT NULL COMMENT 'Session identifier',
  `request_id` varchar(255) DEFAULT NULL COMMENT 'Unique request identifier',
  PRIMARY KEY (`id`),
  KEY `idx_endpoint` (`endpoint`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status_code` (`status_code`),
  KEY `idx_response_time` (`response_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API performance and usage metrics';
```

## 4. User Activity Log Table

This table tracks user actions and navigation within the application.

```sql
CREATE TABLE `hps_user_activity` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT 'ID of the user',
  `action` varchar(100) NOT NULL COMMENT 'Action performed (e.g., login, logout, view_page, create_record)',
  `resource` varchar(255) DEFAULT NULL COMMENT 'Resource accessed (e.g., page URL, record ID)',
  `details` text DEFAULT NULL COMMENT 'Additional details about the action - JSON format',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'Client IP address',
  `user_agent` text DEFAULT NULL COMMENT 'Browser/client information',
  `session_id` varchar(255) DEFAULT NULL COMMENT 'Session identifier',
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the action was performed',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_session_id` (`session_id`),
  FOREIGN KEY (`user_id`) REFERENCES `hps_login` (`he_user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User activity tracking';
```

## 5. Verify Table Creation

After running the above commands, verify that the tables were created successfully:

```sql
SHOW TABLES LIKE 'hps_%_log';
SHOW TABLES LIKE 'hps_user_activity';
SHOW TABLES LIKE 'hps_performance_log';
```

## 6. Grant Permissions (if needed)

If your application uses a specific database user, ensure it has the necessary permissions:

```sql
-- Replace 'your_app_user' with your actual database username
GRANT SELECT, INSERT, UPDATE ON hps_audit_log TO 'your_app_user'@'%';
GRANT SELECT, INSERT, UPDATE ON hps_system_log TO 'your_app_user'@'%';
GRANT SELECT, INSERT, UPDATE ON hps_performance_log TO 'your_app_user'@'%';
GRANT SELECT, INSERT, UPDATE ON hps_user_activity TO 'your_app_user'@'%';
```

## Next Steps

1. Execute the SQL commands above in your database
2. Update your Prisma schema file with the new models
3. Run `npx prisma generate` to update the Prisma client
4. Implement the logging utilities and middleware in your application

## Notes

- The `json` data type is used for flexible storage of context and values
- Indexes are created on commonly queried columns for better performance
- Foreign key constraints maintain data integrity where applicable
- All timestamps use the database's current timestamp as default
- Consider setting up log rotation or archival policies for production use