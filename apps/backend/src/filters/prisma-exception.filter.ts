import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '../prisma/generated/client/client.js';

import { ErrorResponse } from '../common/responses/error.response.js';
import { ContextualLogger, LoggerService } from '../logger/logger.service.js';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger: ContextualLogger;

  constructor(logger: LoggerService) {
    this.logger = logger.forContext(PrismaExceptionFilter.name);
  }

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status;
    let message;

    // Log all 2xxx errors
    if (exception.code.startsWith('P2')) {
      this.logger.error(`[PRISMA ERROR ${exception.code}] ${request.method} ${request.url}`);
    }

    switch (exception.code) {
      case 'P1000':
      case 'P1001':
      case 'P1002':
      case 'P1003':
      case 'P1011':
      case 'P1012':
      case 'P1013':
      case 'P1014':
      case 'P1015':
      case 'P1016':
      case 'P1017':
      case 'P2024':
      case 'P2036':
      case 'P2037':
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = `Database connection or connection pool error.`;
        break;
      case 'P1008':
        status = HttpStatus.GATEWAY_TIMEOUT;
        message = `Database timeout.`;
        break;
      case 'P1009':
        status = HttpStatus.BAD_REQUEST;
        message = `Table already exists.`;
        break;
      case 'P1010':
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = `Database user was denied access.`;
        break;
      case 'P2000':
      case 'P2033':
        status = HttpStatus.BAD_REQUEST;
        message = `Value too big.`;
        break;
      case 'P2001':
        status = HttpStatus.NOT_FOUND;
        message = `Record not found for query.`;
        break;
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = `Unique constraint violated.`;
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = `Foreign key constraint violated.`;
        break;
      case 'P2004':
        status = HttpStatus.BAD_REQUEST;
        message = `A constraint failed.`;
        break;
      case 'P2005':
      case 'P2006':
      case 'P2007':
        status = HttpStatus.BAD_REQUEST;
        message = `Invalid input.`;
        break;
      case 'P2008':
      case 'P2009':
      case 'P2010':
      case 'P2016':
      case 'P2026':
      case 'P2027':
      case 'P2029':
        status = HttpStatus.BAD_REQUEST;
        message = `Invalid or failed query.`;
        break;
      case 'P2011':
        status = HttpStatus.BAD_REQUEST;
        message = `Null constraint violated.`;
        break;
      case 'P2012':
        status = HttpStatus.BAD_REQUEST;
        message = `Missing a required value.`;
        break;
      case 'P2013':
        status = HttpStatus.BAD_REQUEST;
        message = `Missing a required argument.`;
        break;
      case 'P2014':
        status = HttpStatus.BAD_REQUEST;
        message = `Relational constraint violated.`;
        break;
      case 'P2015':
      case 'P2017':
      case 'P2018':
        status = HttpStatus.BAD_REQUEST;
        message = `Record relation error.`;
        break;
      case 'P2019':
        status = HttpStatus.BAD_REQUEST;
        message = `Input error.`;
        break;
      case 'P2020':
        status = HttpStatus.BAD_REQUEST;
        message = `Value out of range for type.`;
        break;
      case 'P2021':
        status = HttpStatus.NOT_FOUND;
        message = `Table does not exist.`;
        break;
      case 'P2022':
      case 'P2023':
        status = HttpStatus.BAD_REQUEST;
        message = `Column error.`;
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = `Record not found.`;
        break;
      case 'P2028':
      case 'P2034':
        status = HttpStatus.BAD_REQUEST;
        message = `Transaction failed.`;
        break;
      case 'P2030':
        status = HttpStatus.BAD_REQUEST;
        message = `Index error.`;
        break;
      case 'P2035':
        status = HttpStatus.BAD_REQUEST;
        message = `Assertion violation.`;
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Generic database error.';
    }

    // Identify Prisma error
    message = `PRISMA: ${message}`;

    const errorResponse = new ErrorResponse(status, message, request.url, request.method);
    response.status(status).json(errorResponse);
  }
}
