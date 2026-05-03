import { ApiProperty } from '@nestjs/swagger';

export const CREDIT_PROFILE_BODY_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  example: {
    semesters: [
      {
        id: 'semester-1',
        name: '2026 tavasz',
        courses: [
          {
            name: 'Adatbazisok',
            code: 'BMEVITMAB04',
            credits: 5,
            grade: 5,
            completed: true,
          },
        ],
      },
    ],
  },
} as const;

export class AveragesCalculation {
  @ApiProperty({
    example: 'uuid-of-user',
    description: 'ID of the owner user.',
  })
  userId!: string;

  @ApiProperty({
    ...CREDIT_PROFILE_BODY_SCHEMA,
    description:
      'Saved average calculator JSON. Course names, codes, and credits are copied into this object instead of linked to Course rows.',
  })
  data!: Record<string, unknown>;

  constructor(profile: Partial<AveragesCalculation>) {
    Object.assign(this, profile);
  }
}
