/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaService } from './prisma.service.js';
import type { LoggerService } from '../logger/logger.service.js';

describe('PrismaService', () => {
  let service: PrismaService;

  const mockConnect = vi.fn();
  const mockDisconnect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    const scopedLogger = {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const mockLogger = {
      forContext: vi.fn().mockReturnValue(scopedLogger),
    } as unknown as LoggerService;

    class TestPrismaService extends PrismaService {
      $connect = mockConnect;
      $disconnect = mockDisconnect;
    }

    service = new TestPrismaService(mockLogger);
  });

  describe('onModuleInit', () => {
    it('should connect to the database successfully', async () => {
      mockConnect.mockResolvedValueOnce(undefined);
      await service.onModuleInit();

      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and exit after 3 attempts', async () => {
      mockConnect.mockRejectedValue(new Error('DB error'));

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit called');
      }) as any);

      await expect(service.onModuleInit()).rejects.toThrow('process.exit called');
      expect(mockConnect).toHaveBeenCalledTimes(3);

      exitSpy.mockRestore();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from the database', async () => {
      mockDisconnect.mockResolvedValueOnce(undefined);
      await service.onModuleDestroy();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});
