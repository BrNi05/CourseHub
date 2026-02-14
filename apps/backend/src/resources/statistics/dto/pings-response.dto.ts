import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Example JSON response:
 * {
 *   "allInMonth": 12345,
 *   "allInWeek": 1234,
 *   "allInDay": 123,
 *   "desktopShareMonthly": 30,
 *   "mobileShareMonthly": 70,
 *   "windowsShareMonthly": 30,
 *   "macosShareMonthly": 20,
 *   "linuxShareMonthly": 5,
 *   "androidShareMonthly": 30,
 *   "iosShareMonthly": 15,
 *   "allPingsOnWeeks": [
 *     { "week": "2026.02.23.-2026.03.01.", "count": 456 }
 *     { "week": "2026.02.16.-2026.02.22.", "count": 123 },
 *   ]
 * }
 */

// DTO for the sub-object in the "allPingsOnWeeks" array
export class WeeklyPingDto {
  @ApiProperty({
    description: 'Week identifier',
    example: '2026.02.16.-2026.02.22.',
  })
  week!: string;

  @ApiProperty({ description: 'Number of all pings in the week', example: 123 })
  count!: number;
}

// /statistics/pings response DTO
export class PingsStatisticsResponseDto {
  @ApiProperty({
    description: 'Total number of pings recorded in the current month',
    example: 12345,
  })
  allInMonth!: number;

  @ApiProperty({ description: 'Total number of pings recorded in the current week', example: 1234 })
  allInWeek!: number;

  @ApiProperty({ description: 'Total number of pings recorded in the current day', example: 123 })
  allInDay!: number;

  @ApiProperty({
    description: 'Share of pings (0-100) from desktop devices in the current month',
    example: 30,
  })
  desktopShareMonthly!: number;

  @ApiProperty({
    description: 'Share of pings (0-100) from mobile devices in the current month',
    example: 70,
  })
  mobileShareMonthly!: number;

  @ApiProperty({
    description: 'Share of pings (0-100) from Windows devices in the current month',
    example: 30,
  })
  windowsShareMonthly!: number;

  @ApiProperty({
    description: 'Share of pings (0-100) from macOS devices in the current month',
    example: 20,
  })
  macosShareMonthly!: number;

  @ApiProperty({
    description: 'Share of pings (0-100) from Linux devices in the current month',
    example: 5,
  })
  linuxShareMonthly!: number;

  @ApiProperty({
    description: 'Share of pings (0-100) from Android devices in the current month',
    example: 30,
  })
  androidShareMonthly!: number;

  @ApiProperty({
    description: 'Share of pings (0-100) from iOS devices in the current month',
    example: 15,
  })
  iosShareMonthly!: number;

  @ApiProperty({
    description: 'Number of pings recorded each week',
    type: () => [WeeklyPingDto],
  })
  @Type(() => WeeklyPingDto)
  allPingsOnWeeks!: WeeklyPingDto[];
}
