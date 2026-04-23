import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { getAuthenticatedUserOrThrow } from './auth-user.decorator.js';

export const AuthUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  return getAuthenticatedUserOrThrow(ctx).id;
});
