/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import type { Response } from 'express';

import { AppController } from './app.controller.js';
import type { AppService } from './app.service.js';
import { HealthCheckDto } from './resources/healthcheck/health-check.response.dto.js';

describe('AppController', () => {
  let appController: AppController;
  let getHealthSpy: Mock;
  let getMetricsSpy: Mock;
  let getMetricsContentTypeSpy: Mock;

  const mockResponse = new HealthCheckDto(
    'healthy',
    'System load is within normal parameters',
    1707654321,
    '1.2.3'
  );

  beforeEach(() => {
    getHealthSpy = vi.fn().mockReturnValue(mockResponse);
    getMetricsSpy = vi
      .fn()
      .mockResolvedValue(
        '# HELP coursehub_backend_process_cpu_user_seconds_total Total user CPU time spent in seconds.'
      );
    getMetricsContentTypeSpy = vi.fn().mockReturnValue('text/plain; version=0.0.4; charset=utf-8');

    const mockAppService = {
      getHealth: getHealthSpy,
      getMetrics: getMetricsSpy,
      getMetricsContentType: getMetricsContentTypeSpy,
    } as unknown as AppService;

    appController = new AppController(mockAppService);
  });

  describe('getHealth', () => {
    it('should call AppService.getHealth exactly once', () => {
      appController.getHealth();
      expect(getHealthSpy).toHaveBeenCalledTimes(1);
    });

    it('should return the exact data provided by the service', () => {
      const result = appController.getHealth();
      expect(result).toEqual(mockResponse);
    });

    it('should return an instance of HealthCheckDto', () => {
      const result = appController.getHealth();

      expect(result).toBeInstanceOf(HealthCheckDto);
      expect(result.status).toBe('healthy');
      expect(result.version).toBe('1.2.3');
    });
  });

  describe('getMetrics', () => {
    it('should write the Prometheus response', async () => {
      const res = {
        setHeader: vi.fn(),
        send: vi.fn(),
      } as unknown as Response;

      await appController.getMetrics(res);

      expect(getMetricsContentTypeSpy).toHaveBeenCalledTimes(1);
      expect(getMetricsSpy).toHaveBeenCalledTimes(1);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain; version=0.0.4; charset=utf-8'
      );
      expect(res.send).toHaveBeenCalledWith(
        '# HELP coursehub_backend_process_cpu_user_seconds_total Total user CPU time spent in seconds.'
      );
    });
  });
});
