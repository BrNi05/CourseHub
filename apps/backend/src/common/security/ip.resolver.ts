// ip.util.ts
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export function getClientIp(contextOrRequest: ExecutionContext | Request): string {
  const req: Request =
    'switchToHttp' in contextOrRequest
      ? contextOrRequest.switchToHttp().getRequest<Request>()
      : contextOrRequest;

  let ip: string =
    (req.headers['cf-connecting-ip'] as string) ??
    (Array.isArray(req.ips) && req.ips.length ? req.ips[0] : undefined) ??
    req.ip ??
    req.socket?.remoteAddress ??
    'unknown';

  if (ip.startsWith('::ffff:')) return ip.slice(7); // Handle IPv4-mapped IPv6 addresses

  return ip;
}
