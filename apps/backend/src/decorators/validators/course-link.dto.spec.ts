import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CourseLink, isMicrosoftTeamsUrl } from './course-link.dto.js';

class GenericCourseLinkDto {
  @CourseLink('coursePageUrl must be a valid URL', 'https://example.com/course', 'Course page')
  link?: string;
}

class TeamsCourseLinkDto {
  @CourseLink(
    'courseTeamsUrl must be a valid URL',
    'https://teams.microsoft.com/l/team/...thread.tacv2/conversations?groupId=...&tenantId=...',
    'Teams group',
    {
      validate: isMicrosoftTeamsUrl,
      validateMessage:
        'courseTeamsUrl must match https://teams.microsoft.com/l/team/...thread.tacv2/conversations?groupId=...&tenantId=...',
    }
  )
  link?: string;
}

describe('CourseLink', () => {
  it('accepts undefined for optional links', async () => {
    const dto = new GenericCourseLinkDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid URL values', async () => {
    const dto = new GenericCourseLinkDto();
    dto.link = 'javascript:alert(1)';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.isUrl).toBe('coursePageUrl must be a valid URL');
  });

  it('accepts well-formed Microsoft Teams course links', async () => {
    const dto = new TeamsCourseLinkDto();
    dto.link =
      'https://teams.microsoft.com/l/team/19%3aabc%40thread.tacv2/conversations?groupId=group-id&tenantId=tenant-id';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects Microsoft Teams links that do not match the required structure', async () => {
    const dto = new TeamsCourseLinkDto();
    dto.link = 'https://teams.microsoft.com/l/team/19%3aabc%40thread.tacv2/conversations';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.hasCustomCourseLinkStructure).toBe(
      'courseTeamsUrl must match https://teams.microsoft.com/l/team/...thread.tacv2/conversations?groupId=...&tenantId=...'
    );
  });
});

describe('isMicrosoftTeamsUrl', () => {
  it('returns true only for URLs with the expected Teams path and query parameters', () => {
    expect(
      isMicrosoftTeamsUrl(
        'https://teams.microsoft.com/l/team/19%3aabc%40thread.tacv2/conversations?groupId=group-id&tenantId=tenant-id'
      )
    ).toBe(true);

    expect(
      isMicrosoftTeamsUrl(
        'https://teams.microsoft.com/l/team/19%3aabc%40thread.tacv2/conversations?groupId=group-id'
      )
    ).toBe(false);
  });
});
