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
});
