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
  private static readonly sharedLogStream: WriteStream = LoggerService.createSharedLogStream();

  constructor() {
    super('Application', { timestamp: false });
  }

  // Creates a contextual logger for a specific context
  forContext(context: string): ContextualLogger {
    return new ContextualLogger(this, context);
  }

  onModuleDestroy() {
    LoggerService.sharedLogStream.end();
  }

  // Message handler
  // Parse as JSON if possible, otherwise log as string
  protected formatMessage(message: any): string {
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
    const formattedMessage = this.formatMessage(message);
    const resolvedContext = this.resolveContext(context);

    super.log(formattedMessage, resolvedContext);
    this.writeToFile(`${this.formatTimestamp()} [INFO] [${resolvedContext}] ${formattedMessage}`);
  }

  error(message: any, trace?: string, context?: string) {
    const formattedMessage = this.formatMessage(message);
    const resolvedContext = this.resolveContext(context);

    super.error(formattedMessage, trace, resolvedContext);
    this.writeToFile(
      `${this.formatTimestamp()} [ERROR] [${resolvedContext}] ${formattedMessage}${trace ?? ''}`
    );
  }

  warn(message: any, context?: string) {
    const formattedMessage = this.formatMessage(message);
    const resolvedContext = this.resolveContext(context);

    super.warn(formattedMessage, resolvedContext);
    this.writeToFile(`${this.formatTimestamp()} [WARN] [${resolvedContext}] ${formattedMessage}`);
  }

  debug(message: any, context?: string) {
    const formattedMessage = this.formatMessage(message);
    const resolvedContext = this.resolveContext(context);

    super.debug(formattedMessage, resolvedContext);
    this.writeToFile(`${this.formatTimestamp()} [DEBUG] [${resolvedContext}] ${formattedMessage}`);
  }

  verbose(message: any, context?: string) {
    const formattedMessage = this.formatMessage(message);
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
    const logStream = LoggerService.sharedLogStream;

    if (logStream.destroyed) return;
    logStream.write(message + '\n');
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
}
