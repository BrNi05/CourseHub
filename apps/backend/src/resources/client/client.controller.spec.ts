/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientController } from './client.controller.js';
import type { ClientService } from './client.service.js';
import { ClientPlatform } from '../../prisma/generated/client/client.js';

describe('ClientController', () => {
  let controller: ClientController;
  let clientService: any;

  beforeEach(() => {
    clientService = {
      isVersionSupported: vi.fn(),
      ping: vi.fn(),
      reportError: vi.fn(),
      listErrorReports: vi.fn(),
      deleteErrorReport: vi.fn(),
    };

    controller = new ClientController(clientService as unknown as ClientService);
  });

  it('should call isVersionSupported with correct arguments', () => {
    const dto = {
      platform: ClientPlatform.windows,
      version: '1.0.0',
    };

    controller.checkVersion(dto);

    expect(clientService.isVersionSupported).toHaveBeenCalledWith(ClientPlatform.windows, '1.0.0');
  });

  it('should call clientService.ping with correct arguments', async () => {
    clientService.ping.mockResolvedValue(undefined);

    const userId = 'user-123';
    const body = {
      platform: ClientPlatform.linux,
      version: '1.2.3',
    };

    await controller.ping(userId, body);

    expect(clientService.ping).toHaveBeenCalledWith(userId, ClientPlatform.linux, '1.2.3');
  });

  it('should propagate errors from clientService.ping', async () => {
    clientService.ping.mockRejectedValue(new Error('DB failure'));

    await expect(
      controller.ping('user-1', {
        platform: ClientPlatform.windows,
        version: '1.0.0',
      })
    ).rejects.toThrow('DB failure');
  });

  it('should call clientService.reportError with correct arguments', async () => {
    clientService.reportError.mockResolvedValue(undefined);

    const userId = 'user-456';
    const body = {
      message: 'Something broke',
    };

    await controller.errorReport(userId, body as any);

    expect(clientService.reportError).toHaveBeenCalledWith(userId, body);
  });

  it('should propagate errors from clientService.reportError', async () => {
    clientService.reportError.mockRejectedValue(new Error('Write failed'));

    await expect(controller.errorReport('user-1', { message: 'x' } as any)).rejects.toThrow(
      'Write failed'
    );
  });

  it('should return error reports from service', async () => {
    const reports = [
      { userId: 'u1', message: 'err1' },
      { userId: 'u2', message: 'err2' },
    ];

    clientService.listErrorReports.mockResolvedValue(reports);

    const result = await controller.listErrorReports();

    expect(clientService.listErrorReports).toHaveBeenCalledTimes(1);
    expect(result).toEqual(reports);
  });

  it('should propagate errors from clientService.listErrorReports', async () => {
    clientService.listErrorReports.mockRejectedValue(new Error('Read failed'));

    await expect(controller.listErrorReports()).rejects.toThrow('Read failed');
  });

  it('should call clientService.deleteErrorReport with correct fileName', async () => {
    clientService.deleteErrorReport.mockResolvedValue(undefined);

    const fileName = 'report-123.json';

    await controller.deleteErrorReport(fileName);

    expect(clientService.deleteErrorReport).toHaveBeenCalledWith(fileName);
  });

  it('should propagate errors from clientService.deleteErrorReport', async () => {
    clientService.deleteErrorReport.mockRejectedValue(new Error('Delete failed'));

    await expect(controller.deleteErrorReport('bad-file.json')).rejects.toThrow('Delete failed');
  });
});
