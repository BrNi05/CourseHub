import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { isIP } from 'node:net';
import type { Request } from 'express';

const ALLOWED_INTERNAL_CIDRS = ['172.40.0.0/24']; // Docker network

@Injectable()
export class InternalOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const remoteAddress = this.normalizeIp(request.socket.remoteAddress);
    const cfConnectingIp = request.headers?.['cf-connecting-ip'];

    if (
      !cfConnectingIp &&
      remoteAddress &&
      ALLOWED_INTERNAL_CIDRS.some((cidr) => this.matchesCidr(remoteAddress, cidr))
    ) {
      return true;
    }

    throw new ForbiddenException(
      'This endpoint is only accessible from the configured internal networks.'
    );
  }

  private normalizeIp(remoteAddress?: string): string | null {
    if (!remoteAddress) return null;
    if (remoteAddress.startsWith('::ffff:')) return remoteAddress.slice(7);
    return remoteAddress;
  }

  private matchesCidr(ip: string, cidr: string): boolean {
    const [range, prefixLengthRaw] = cidr.split('/');

    if (isIP(ip) !== 4 || isIP(range) !== 4) return ip === range;

    const prefixLength = Number(prefixLengthRaw);
    if (!Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > 32) return false;

    const ipInt = this.ipv4ToInt(ip);
    const rangeInt = this.ipv4ToInt(range);
    const mask = prefixLength === 0 ? 0 : (0xffffffff << (32 - prefixLength)) >>> 0;

    return (ipInt & mask) === (rangeInt & mask);
  }

  private ipv4ToInt(ip: string): number {
    return ip.split('.').reduce((acc, octet) => ((acc << 8) | Number(octet)) >>> 0, 0);
  }
}
