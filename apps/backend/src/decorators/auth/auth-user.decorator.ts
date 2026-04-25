import { UnauthorizedException, createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { IAuthenticatedUser, RequestWithAuthenticatedUser } from '../../auth/interfaces.js';

export function getAuthenticatedUserOrThrow(ctx: ExecutionContext): IAuthenticatedUser {
  const request = ctx.switchToHttp().getRequest<RequestWithAuthenticatedUser>();

  if (!request.user) throw new UnauthorizedException('Missing authenticated session.');

  return request.user;
}

export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IAuthenticatedUser => {
    return getAuthenticatedUserOrThrow(ctx);
  }
);
