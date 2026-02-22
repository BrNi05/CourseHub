import { ClientPlatform } from '../../../prisma/generated/client/client.js';
import { SemverVersion } from '../../../decorators/validators/semver.dto.js';
import { IsClientPlatform } from '../../../decorators/validators/client-platform.dto.js';

export class ClientIdDto {
  @IsClientPlatform()
  platform!: ClientPlatform;

  @SemverVersion()
  version!: string;
}
