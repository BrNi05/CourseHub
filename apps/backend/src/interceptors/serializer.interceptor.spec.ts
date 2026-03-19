import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { of, lastValueFrom } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { SerializerInterceptor } from './serializer.interceptor.js';

class SerializedDto {
  value!: string;
}

function createContext(): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class TestController {},
  } as unknown as ExecutionContext;
}

describe('SerializerInterceptor', () => {
  it('returns the original stream when no serialization DTO metadata is present', async () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const interceptor = new SerializerInterceptor(reflector);
    const next: CallHandler = {
      handle: () => of({ value: 'plain' }),
    };

    const result = await lastValueFrom(interceptor.intercept(createContext(), next));

    expect(result).toEqual({ value: 'plain' });
  });

  it('serializes the response into the configured DTO class', async () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(SerializedDto),
    } as unknown as Reflector;
    const interceptor = new SerializerInterceptor(reflector);
    const next: CallHandler = {
      handle: () => of({ value: 'serialized' }),
    };

    const result = await lastValueFrom(interceptor.intercept(createContext(), next));

    expect(result).toBeInstanceOf(SerializedDto);
    expect(result).toEqual(expect.objectContaining({ value: 'serialized' }));
  });
});
