import { applyDecorators, UseGuards } from '@nestjs/common';
import { RequiresAuth } from './auth.decorator.js';
import { UserOwnershipGuard } from '../auth/guards/ownership.guard.js';

// Marks endpoint as requiring authentication and ownership of resource (or admin rights)
// Also used to track (and validate) userId (eg. for error reporting or pinging)
export function RequiresAuthAndOwnership() {
  return applyDecorators(RequiresAuth(), UseGuards(UserOwnershipGuard));
}
