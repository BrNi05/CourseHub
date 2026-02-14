import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// /statistics/users response DTO

/**
 * Example JSON response:
 * [
 *   {
 *     "uniAbbrev": "BME",
 *     "allUsers": 456,
 *     "faculties": [
 *       { "facultyName": "Faculty of Informatics", "allUsersOfFacultyCourses": 123 },
 *       { "facultyName": "Faculty of Electrical Engineering", "allUsersOfFacultyCourses": 200 }
 *     ]
 *   },
 *   {
 *     "uniAbbrev": "ELTE",
 *     "allUsers": 789,
 *     "faculties": [
 *       { "facultyName": "Faculty of Science", "allUsersOfFacultyCourses": 300 },
 *       { "facultyName": "Faculty of Arts", "allUsersOfFacultyCourses": 400 }
 *     ]
 *   }
 * ]
 */

// DTO for each faculty in the "faculties" array of each university
export class FacultyUsersDto {
  @ApiProperty({ description: 'Name of the faculty', example: 'Faculty of Informatics' })
  facultyName!: string;

  @ApiProperty({
    description: 'Number of all users affiliated with courses of the faculty',
    example: 123,
  })
  allUsersOfFacultyCourses!: number;
}

// DTO for each university in the "universities" array
export class UniversityUsersDto {
  @ApiProperty({
    description: 'Abbreviated name of the university',
    example: 'BME',
  })
  uniAbbrev!: string;

  @ApiProperty({
    description: 'Number of all users affiliated with the university',
    example: 456,
  })
  allUsers!: number;

  @ApiProperty({
    description: 'List of faculties with their user statistics',
    type: [FacultyUsersDto],
  })
  @Type(() => FacultyUsersDto)
  faculties!: FacultyUsersDto[];
}
