/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, ConsoleLogger, Scope } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable({ scope: Scope.DEFAULT }) // singleton
export class LoggerService extends ConsoleLogger {
  private readonly logFile = path.join(process.cwd(), 'CourseHub-Backend.log');

  constructor(context: string = 'GenericLogger') {
    super(context, { timestamp: false });
  }

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

  // File writer helper
  private writeToFile(message: string) {
    fs.appendFileSync(this.logFile, message + '\n');
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

  log(message: any) {
    const formattedMessage = this.formatMessage(message);
    super.log(formattedMessage, this.context);
    this.writeToFile(`${this.formatTimestamp()} [INFO] [${this.context}] ${formattedMessage}`);
  }

  error(message: any, trace?: string) {
    const formattedMessage = this.formatMessage(message);
    super.error(formattedMessage, trace, this.context);
    trace = trace || '';
    this.writeToFile(
      `${this.formatTimestamp()} [ERROR] [${this.context}] ${formattedMessage}${trace}`
    );
  }

  warn(message: any) {
    const formattedMessage = this.formatMessage(message);
    super.warn(formattedMessage, this.context);
    this.writeToFile(`${this.formatTimestamp()} [WARN] [${this.context}] ${formattedMessage}`);
  }

  debug(message: any) {
    const formattedMessage = this.formatMessage(message);
    super.debug(formattedMessage, this.context);
    this.writeToFile(`${this.formatTimestamp()} [DEBUG] [${this.context}] ${formattedMessage}`);
  }

  verbose(message: any) {
    const formattedMessage = this.formatMessage(message);
    super.verbose(formattedMessage, this.context);
    this.writeToFile(`${this.formatTimestamp()} [VERBOSE] [${this.context}] ${formattedMessage}`);
  }
}
