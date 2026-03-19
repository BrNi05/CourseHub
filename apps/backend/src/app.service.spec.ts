/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppService } from './app.service.js';
import { HealthCheckDto } from './resources/healthcheck/health-check.response.dto.js';

describe('AppService', () => {
  let service: AppService;
  let mockLogger: any;

  beforeEach(() => {
    const scopedLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    mockLogger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    };

    service = new AppService(mockLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getHealth should return a HealthCheckDto', () => {
    const result = service.getHealth();
    expect(result).toBeInstanceOf(HealthCheckDto);
    expect(typeof result.status).toBe('string');
    expect(typeof result.timestamp).toBe('number');
    expect(typeof result.version).toBe('string');
  });
});
