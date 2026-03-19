import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const AuthUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  if (!request.user?.id) {
    throw new Error('AuthUserId decorator used without JWT authentication');
  }
  return request.user.id as string;
});
