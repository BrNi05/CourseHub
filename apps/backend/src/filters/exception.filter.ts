/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

import { ErrorResponse } from '../common/responses/error.response.js';
import { LoggerService } from '../logger/logger.service.js';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const original = exception.getResponse();
      message =
        typeof original === 'string'
          ? original
          : (original as any).message || JSON.stringify(original);
    }

    // Handle Throttler exceptions
    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      message = 'Too many requests. Please try again later.';
    }

    // Log internal server errors
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.logger.error(`${request.method} ${request.url} - ${message}`, exception.stack);
    }

    // Prevent leaking paths on server static errors
    if (message.includes('ENOENT') || request.url.includes('/assets')) {
      message = 'Resource not found';
    }

    const errorResponse = new ErrorResponse(status, message, request.url, request.method);
    response.status(status).json(errorResponse);
  }
}
