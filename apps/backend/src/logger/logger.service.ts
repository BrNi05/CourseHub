/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, ConsoleLogger, OnModuleDestroy } from '@nestjs/common';
import { createWriteStream } from 'node:fs';
import type { WriteStream } from 'node:fs';
import * as path from 'node:path';

// A wrapper around ConsoleLogger with file logging and context handling
export class ContextualLogger {
  constructor(
    private readonly rootLogger: LoggerService,
    private readonly context: string
  ) {}

  log(message: any) {
    this.rootLogger.log(message, this.context);
  }

  error(message: any, trace?: string) {
    this.rootLogger.error(message, trace, this.context);
  }

  warn(message: any) {
    this.rootLogger.warn(message, this.context);
  }

  debug(message: any) {
    this.rootLogger.debug(message, this.context);
  }

  verbose(message: any) {
    this.rootLogger.verbose(message, this.context);
  }
}

@Injectable()
export class LoggerService extends ConsoleLogger implements OnModuleDestroy {
  private static readonly logFile = path.join(process.cwd(), 'CourseHub-Backend.log');
  private static sharedLogStream: WriteStream | null = LoggerService.createSharedLogStream();

  // Maintenance mode (log deletion/GDPR compliance)
  private static isMaintenanceMode = false;
  private static readonly pendingMessages: string[] = [];
  private static rotationLock: Promise<void> = Promise.resolve();

  constructor() {
    super('Application', { timestamp: false });
    LoggerService.sharedLogStream ??= LoggerService.createSharedLogStream();
  }

  // Creates a contextual logger for a specific context
  forContext(context: string): ContextualLogger {
    return new ContextualLogger(this, context);
  }

  async onModuleDestroy() {
    await LoggerService.closeSharedLogStream();
  }

  // Message handler
  // Parse as JSON if possible, otherwise log as string
  protected stringifyLogMessage(message: any): string {
    if (typeof message === 'object') {
      try {
        return JSON.stringify(message, null, 2);
      } catch {
        return String(message);
      }
    }

    return String(message);
  }

  log(message: any, context?: string) {
    const formattedMessage = this.stringifyLogMessage(message);
    const resolvedContext = this.resolveContext(context);

    super.log(formattedMessage, resolvedContext);
    this.writeToFile(`${this.formatTimestamp()} [INFO] [${resolvedContext}] ${formattedMessage}`);
  }

  error(message: any, trace?: string, context?: string) {
    const formattedMessage = this.stringifyLogMessage(message);
    const resolvedContext = this.resolveContext(context);

    super.error(formattedMessage, trace, resolvedContext);
    this.writeToFile(
      `${this.formatTimestamp()} [ERROR] [${resolvedContext}] ${formattedMessage}${trace ?? ''}`
    );
  }

  warn(message: any, context?: string) {
    const formattedMessage = this.stringifyLogMessage(message);
    const resolvedContext = this.resolveContext(context);

    super.warn(formattedMessage, resolvedContext);
    this.writeToFile(`${this.formatTimestamp()} [WARN] [${resolvedContext}] ${formattedMessage}`);
  }

  debug(message: any, context?: string) {
    const formattedMessage = this.stringifyLogMessage(message);
    const resolvedContext = this.resolveContext(context);

    super.debug(formattedMessage, resolvedContext);
    this.writeToFile(`${this.formatTimestamp()} [DEBUG] [${resolvedContext}] ${formattedMessage}`);
  }

  verbose(message: any, context?: string) {
    const formattedMessage = this.stringifyLogMessage(message);
    const resolvedContext = this.resolveContext(context);

    super.verbose(formattedMessage, resolvedContext);
    this.writeToFile(
      `${this.formatTimestamp()} [VERBOSE] [${resolvedContext}] ${formattedMessage}`
    );
  }

  // Formats the current timestamp for file logging
  private formatTimestamp(): string {
    return new Intl.DateTimeFormat('hu-HU', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date());
  }

  // Writes log messages to the file
  private writeToFile(message: string) {
    const logStream = LoggerService.getWritableStream();

    if (!logStream) {
      LoggerService.pendingMessages.push(message); // Buffer messages if in maintenance mode
      return;
    }

    logStream.write(message + '\n');
  }

  // Executes an operation while releasing the shared log stream for maintenance
  async withReleasedFileStream<T>(operation: () => Promise<T>): Promise<T> {
    return LoggerService.runExclusive(async () => {
      LoggerService.isMaintenanceMode = true;
      await LoggerService.closeSharedLogStream();

      try {
        return await operation();
      } finally {
        LoggerService.sharedLogStream = LoggerService.createSharedLogStream();
        LoggerService.isMaintenanceMode = false;
        LoggerService.flushPendingMessages();
      }
    });
  }

  // Get the set context of the logger
  private resolveContext(context?: string): string {
    return context ?? this.context ?? 'UnknownContext';
  }

  // Creates a shared log stream for the logger service
  private static createSharedLogStream(): WriteStream {
    const logStream = createWriteStream(LoggerService.logFile, { flags: 'a' });

    logStream.on('error', (error) => {
      process.stderr.write(`Logger file stream error: ${error.message}\n`);
    });

    return logStream;
  }

  // Flushes any pending log messages that were buffered during maintenance mode
  private static flushPendingMessages() {
    const logStream = LoggerService.getWritableStream();

    if (!logStream) return;

    for (const message of LoggerService.pendingMessages.splice(0)) {
      logStream.write(message + '\n');
    }
  }

  // Gets a writable stream for logging, or null if in maintenance mode
  private static getWritableStream(): WriteStream | null {
    const logStream = LoggerService.sharedLogStream;

    if (logStream && !logStream.destroyed && !logStream.writableEnded) return logStream;

    if (LoggerService.isMaintenanceMode) return null;

    LoggerService.sharedLogStream = LoggerService.createSharedLogStream();
    return LoggerService.sharedLogStream;
  }

  // Closes the shared log stream
  private static async closeSharedLogStream(): Promise<void> {
    const logStream = LoggerService.sharedLogStream;
    LoggerService.sharedLogStream = null;

    if (!logStream || logStream.destroyed || logStream.writableEnded) return;

    await new Promise<void>((resolve) => {
      logStream.once('close', resolve);
      logStream.end();
    });
  }

  // Makes sure that only one maintenance operation runs at a time
  private static async runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const previousLock = LoggerService.rotationLock;
    let releaseLock!: () => void;

    LoggerService.rotationLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    await previousLock;

    try {
      return await operation();
    } finally {
      releaseLock();
    }
  }
}
