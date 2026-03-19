import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUrl, Length, registerDecorator } from 'class-validator';

// Teams URL validation function
export function isMicrosoftTeamsUrl(value: string) {
  return (
    value.startsWith('https://teams.microsoft.com/l/team/') &&
    value.includes('thread.tacv2') &&
    value.includes('conversations') &&
    value.includes('groupId=') &&
    value.includes('tenantId=')
  );
}

// Options for custom course link validation
type CourseLinkOptions = {
  validate?: (value: string) => boolean;
  validateMessage?: string;
};

// Custom decorator for course links with optional custom validation
function HasCustomCourseLinkStructure(
  validate: (value: string) => boolean,
  message: string
): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'hasCustomCourseLinkStructure',
      target: target.constructor,
      propertyName: propertyName.toString(),
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' || value.length === 0) return true;
          return validate(value);
        },
        defaultMessage() {
          return message;
        },
      },
    });
  };
}

export function CourseLink(
  message: string,
  example: string,
  description: string,
  options?: CourseLinkOptions
) {
  return applyDecorators(
    IsOptional(),
    Length(15, 256, { message: `A link hossza min. $constraint1 és max. $constraint2 karakter.` }),
    IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message }), // Against invalid URLs and internal XSS attempts
    ...(options?.validate
      ? [HasCustomCourseLinkStructure(options.validate, options.validateMessage ?? message)]
      : []),
    ApiProperty({
      example,
      description,
      required: false,
    })
  );
}
