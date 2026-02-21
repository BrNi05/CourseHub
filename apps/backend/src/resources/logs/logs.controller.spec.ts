/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LogsController } from './logs.controller.js';
import type { LogsService } from './logs.service.js';

describe('LogsController', () => {
  let controller: LogsController;
  let logsService: any;

  beforeEach(() => {
    logsService = {
      getLogStream: vi.fn(),
      clearLogs: vi.fn(),
    };

    controller = new LogsController(logsService as LogsService);
  });

  describe('downloadLogs', () => {
    it('should set headers and pipe stream to response', async () => {
      const pipe = vi.fn();
      const mockStream = { pipe };

      logsService.getLogStream.mockResolvedValueOnce(mockStream);

      const res: any = {
        setHeader: vi.fn(),
      };

      await controller.downloadLogs(res);

      expect(logsService.getLogStream).toHaveBeenCalledTimes(1);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="CourseHub-Backend.log"'
      );

      expect(pipe).toHaveBeenCalledWith(res);
    });

    it('should propagate error if getLogStream fails', async () => {
      logsService.getLogStream.mockRejectedValueOnce(new Error('stream error'));

      const res: any = {
        setHeader: vi.fn(),
      };

      await expect(controller.downloadLogs(res)).rejects.toThrow('stream error');
    });
  });

  describe('clearLogs', () => {
    it('should call logsService.clearLogs', async () => {
      logsService.clearLogs.mockResolvedValueOnce(undefined);

      await controller.clearLogs();

      expect(logsService.clearLogs).toHaveBeenCalledTimes(1);
    });

    it('should propagate error if clearLogs fails', async () => {
      logsService.clearLogs.mockRejectedValueOnce(new Error('clear error'));

      await expect(controller.clearLogs()).rejects.toThrow('clear error');
    });
  });
});
