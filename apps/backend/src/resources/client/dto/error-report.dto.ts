import { ClientPlatform } from '../../../prisma/generated/client/client.js';
import { SemverVersion } from '../../../decorators/validators/semver.dto.js';
import { IsClientPlatform } from '../../../decorators/validators/client-platform.dto.js';
import { IsValidString } from '../../../decorators/validators/string.dto.js';

export class ErrorReportDto {
  @SemverVersion()
  version!: string;

  @IsClientPlatform()
  platform!: ClientPlatform;

  @IsValidString('route', '/courses/:id', 'Route where the error occurred', 4, 128)
  route!: string;

  @IsValidString(
    'userAction',
    'Loading course details, Submitting assignment, etc.',
    'Action the user was performing when the error occurred',
    4,
    256
  )
  userAction!: string;

  @IsValidString(
    'trace',
    'Error: Something went wrong at Object.<anonymous> (/app/src/main.ts:10:15)',
    'Stack trace of the error',
    0,
    1024
  )
  trace!: string;

  @IsValidString('message', 'Something went wrong', 'Error message', 0, 256)
  message!: string;
}

// User ID is saved from :id param
// Timestamp is generated on receive
