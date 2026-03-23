import { Injectable } from '@nestjs/common';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as os from 'node:os';
import { Registry, collectDefaultMetrics } from 'prom-client';

import { HealthCheckDto } from './resources/healthcheck/health-check.response.dto.js';

import { ContextualLogger, LoggerService } from './logger/logger.service.js';

@Injectable()
export class AppService {
  private readonly packageVersion: string;
  private readonly cores: number;
  private readonly logger: ContextualLogger;
  private readonly metricsRegistry: Registry;

  constructor(logger: LoggerService) {
    this.logger = logger.forContext(AppService.name);

    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    this.packageVersion = packageJson.version || 'unknown';
    this.cores = os.cpus().length;
    this.metricsRegistry = new Registry();

    collectDefaultMetrics({
      prefix: 'coursehub_backend_',
      register: this.metricsRegistry,
    });
  }

  getHealth(): HealthCheckDto {
    const [load1, load5, load15] = os.loadavg();
    const avgRealLoad = ((load1 + load5) / 2 / this.cores) * 100;
    const realLoad1 = (load1 / this.cores) * 100;
    const realLoad5 = (load5 / this.cores) * 100;
    const realLoad15 = (load15 / this.cores) * 100;

    let status = 'healthy';

    if (avgRealLoad > 130) status = 'critical';
    else if (avgRealLoad > 100) status = 'unhealthy';
    else if (avgRealLoad > 70) status = 'degraded';

    return new HealthCheckDto(
      status,
      this.interpretLoad(realLoad1, realLoad5, realLoad15),
      Math.floor(Date.now() / 1000),
      this.packageVersion
    );
  }

  getMetrics(): Promise<string> {
    return this.metricsRegistry.metrics();
  }

  getMetricsContentType(): string {
    return this.metricsRegistry.contentType;
  }

  // Heuristics to interpret system load
  private interpretLoad(l1: number, l5: number, l15: number): string {
    const HIGH = 70;

    if (l1 > HIGH && l5 < HIGH && l15 < HIGH) {
      return 'Short term load spike';
    }

    if (l1 > l5 && l5 > l15 && l1 > HIGH) {
      return 'Load increasing over time';
    }

    if (l1 > HIGH && l5 > HIGH && l15 > HIGH) {
      this.logger.debug(
        `Sustained high load detected: 1min=${l1.toFixed(2)}%, 5min=${l5.toFixed(2)}%, 15min=${l15.toFixed(2)}%`
      );
      return 'Sustained high system load';
    }

    if (l1 < l5 && l5 < l15 && l15 > HIGH) {
      return 'System recovering from sustained load';
    }

    return 'System load is within normal parameters';
  }
}
