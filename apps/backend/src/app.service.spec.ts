/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Registry } from 'prom-client';
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
    expect(typeof result.interpretation).toBe('string');
    expect(typeof result.timestamp).toBe('number');
    expect(typeof result.version).toBe('string');
  });

  it('getMetrics should expose prefixed default Prometheus metrics only', async () => {
    const metrics = await service.getMetrics();

    expect(metrics).toContain('coursehub_backend_process_cpu_user_seconds_total');
    expect(metrics).not.toContain('coursehub_backend_system_load_percent');
    expect(metrics).not.toContain('coursehub_backend_build_info');
  });

  it('getMetricsContentType should match the Prometheus registry content type', () => {
    expect(service.getMetricsContentType()).toBe(Registry.PROMETHEUS_CONTENT_TYPE);
  });
});
