import { UseInterceptors, applyDecorators, SetMetadata } from '@nestjs/common';
import type { ClassConstructor } from 'class-transformer';
import { SerializerInterceptor } from '../interceptors/serializer.interceptor.js';

export const SERIALIZE_KEY = 'SERIALIZE_IT';

export function Serialize(dto: ClassConstructor<unknown>) {
  return applyDecorators(SetMetadata(SERIALIZE_KEY, dto), UseInterceptors(SerializerInterceptor));
}
