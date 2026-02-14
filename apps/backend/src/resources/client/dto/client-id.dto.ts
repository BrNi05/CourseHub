import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Matches } from 'class-validator';
import { ClientPlatform } from '../../../prisma/generated/client/client.js';

export class ClientIdDto {
  @ApiProperty({
    enum: ClientPlatform,
    description: 'Client platform',
    example: ClientPlatform.windows,
  })
  @IsEnum(ClientPlatform)
  platform!: ClientPlatform;

  @ApiProperty({
    description: 'Client version',
    example: '1.0.0',
  })
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, {
    message: 'version must be in format major.minor.patch (e.g. 1.0.0)',
  })
  version!: string;
}
