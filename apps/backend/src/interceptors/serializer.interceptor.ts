import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { SERIALIZE_KEY } from '../decorators/serialize.decorator.js';

@Injectable()
export class SerializerInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const dto = this.reflector.getAllAndOverride(SERIALIZE_KEY, [ctx.getHandler(), ctx.getClass()]);

    if (!dto) return next.handle();

    return next.handle().pipe(
      map((data) =>
        plainToInstance(dto, data, {
          enableImplicitConversion: true,
        })
      )
    );
  }
}
