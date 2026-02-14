import { ApiProperty } from '@nestjs/swagger';

// /statistics/pins response DTO

/**
 * Example JSON response:
 * [
 *   {
 *     "name": "Introduction to Computer Science",
 *     "universityAbbrev": "BME",
 *     "courseCode": "CS101",
 *     "pinCount": 456
 *   },
 *   {
 *     "name": "Data Structures",
 *     "universityAbbrev": "BME",
 *     "courseCode": "CS102",
 *     "pinCount": 123
 *   }
 * ]
 */

export class CoursesPinnedDto {
  @ApiProperty({ description: 'Name of the course', example: 'Introduction to Computer Science' })
  name!: string;

  @ApiProperty({ description: 'Abbreviation of the university', example: 'BME' })
  universityAbbrev!: string;

  @ApiProperty({ description: 'Course code', example: 'CS101' })
  courseCode!: string;

  @ApiProperty({ description: 'Number of all user pins for the course', example: 123 })
  pinCount!: number;
}
