/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoggerService } from './logger.service.js';

vi.mock('node:fs');

describe('LoggerService', () => {
  let logger: LoggerService;
  const testContext = 'TestContext';

  beforeEach(() => {
    vi.clearAllMocks();
    logger = new LoggerService(testContext);

    // Spy on ConsoleLogger methods (superclass)
    vi.spyOn(logger as any, 'log' as any);
    vi.spyOn(logger as any, 'error' as any);
    vi.spyOn(logger as any, 'warn' as any);
    vi.spyOn(logger as any, 'debug' as any);
  });

  it('should log info messages', () => {
    const message = 'Hello info';
    const writeSpy = vi.spyOn(logger as any, 'writeToFile');

    logger.log(message);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
  });

  it('should log error messages with trace', () => {
    const message = 'Error occurred';
    const trace = 'Stack trace';
    const writeSpy = vi.spyOn(logger as any, 'writeToFile');

    logger.error(message, trace);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
  });

  it('should log warnings', () => {
    const message = 'Warning here';
    const writeSpy = vi.spyOn(logger as any, 'writeToFile');

    logger.warn(message);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'));
  });

  it('should log debug messages', () => {
    const message = { debug: true };
    const writeSpy = vi.spyOn(logger as any, 'writeToFile');

    logger.debug(message);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
  });

  it('should log verbose messages', () => {
    const message = 'Verbose message';
    const writeSpy = vi.spyOn(logger as any, 'writeToFile');

    logger.verbose(message);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('[VERBOSE]'));
  });
});
