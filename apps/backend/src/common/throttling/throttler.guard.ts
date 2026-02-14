import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ThrottleGuard extends ThrottlerGuard {
  // eslint-disable-next-line @typescript-eslint/require-await
  protected async getTracker(req: Request): Promise<string> {
    // First try Cloudflare header, fallback to standard Express IP
    // Docs: https://developers.cloudflare.com/fundamentals/reference/http-headers/#cf-connecting-ip
    const ip =
      (req.headers['cf-connecting-ip'] as string) ?? // This header contains the public IP, which is not an ideal candidate for rate limiting
      req.ip ??
      req.socket.remoteAddress;
    return ip;
  }
}
