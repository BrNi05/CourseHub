import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// /statistics/courses response DTO

/**
 * Example JSON response:
 * [
 *   {
 *     "universityAbbrevName": "BME",
 *     "courseCount": 50,
 *     "faculties": [
 *       { "facultyName": "Faculty of Informatics", "courseCount": 10 },
 *       { "facultyName": "Faculty of Electrical Engineering", "courseCount": 20 }
 *     ]
 *   },
 *   {
 *     "universityAbbrevName": "ELTE",
 *     "courseCount": 30,
 *     "faculties": [
 *       { "facultyName": "Faculty of Science", "courseCount": 15 },
 *       { "facultyName": "Faculty of Arts", "courseCount": 15 }
 *     ]
 *   }
 * ]
 */

// DTO for each faculty in the "faculties" array of each university
export class FacultyCoursesDto {
  @ApiProperty({ description: 'Name of the faculty', example: 'Faculty of Informatics' })
  facultyName!: string;

  @ApiProperty({ description: 'Number of courses offered by the faculty', example: 10 })
  courseCount!: number;
}

export class UniversityCoursesDto {
  @ApiProperty({ description: 'Abbreviated name of the university', example: 'BME' })
  universityAbbrevName!: string;

  @ApiProperty({ description: 'Number of courses offered by the university', example: 50 })
  courseCount!: number;

  @ApiProperty({
    description: 'List of faculties with their course statistics',
    type: [FacultyCoursesDto],
  })
  @Type(() => FacultyCoursesDto)
  faculties!: FacultyCoursesDto[];
}
