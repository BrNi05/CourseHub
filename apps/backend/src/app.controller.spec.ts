import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { AppController } from './app.controller.js';
import type { AppService } from './app.service.js';
import { HealthCheckDto } from './resources/healthcheck/health-check.response.dto.js';

describe('AppController', () => {
  let appController: AppController;
  let getHealthSpy: Mock;

  const mockResponse = new HealthCheckDto(
    'healthy',
    'System load is within normal parameters',
    1707654321,
    '1.2.3',
    10.5,
    8.2,
    5.1
  );

  beforeEach(() => {
    getHealthSpy = vi.fn().mockReturnValue(mockResponse);

    const mockAppService = {
      getHealth: getHealthSpy,
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
});
