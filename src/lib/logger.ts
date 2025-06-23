/**
 * Production-ready logging system with structured logging
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private level: LogLevel;
  private service: string;

  constructor(service: string = 'api', level: LogLevel = LogLevel.INFO) {
    this.service = service;
    this.level = process.env.NODE_ENV === 'production' ? LogLevel.WARN : level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatLog(entry: LogEntry): string {
    if (process.env.NODE_ENV === 'production') {
      // Structured JSON logging for production
      return JSON.stringify(entry);
    } else {
      // Human-readable logging for development
      const timestamp = new Date(entry.timestamp).toISOString();
      const level = LogLevel[entry.level];
      const metadata = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
      const error = entry.error ? `\n  Error: ${entry.error.message}\n  Stack: ${entry.error.stack}` : '';
      
      return `[${timestamp}] ${level} [${entry.service}] ${entry.message}${metadata}${error}`;
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
  }

  error(message: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, metadata, error);
    console.error(this.formatLog(entry));
    
    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry);
    }
  }

  warn(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, metadata);
    console.warn(this.formatLog(entry));
  }

  info(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, metadata);
    console.info(this.formatLog(entry));
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, metadata);
    console.debug(this.formatLog(entry));
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Implement external logging service integration here
    // Examples: Winston with cloud transport, DataDog, Sentry, etc.
    try {
      // Example: Send critical errors to external monitoring
      if (entry.level === LogLevel.ERROR) {
        // await sendToSentry(entry);
        // await sendToDatadog(entry);
      }
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }
}

// Create service-specific loggers
export const apiLogger = new Logger('api');
export const authLogger = new Logger('auth');
export const dbLogger = new Logger('database');
export const fileLogger = new Logger('files');
export const aiLogger = new Logger('ai');
export const storageLogger = new Logger('storage');
export const securityLogger = new Logger('security');
export const emailLogger = new Logger('email');

// Generic logger factory
export function createLogger(service: string): Logger {
  return new Logger(service);
}