import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { IAuthenticatedUser } from '../../auth/interfaces.js';

export const AuthUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ user?: IAuthenticatedUser }>();

  // req.user is populate by auth strategy
  if (!request.user?.id) {
    throw new Error('AuthUserId decorator used without an authenticated session');
  }
  return request.user.id;
});
