import { Controller, Get, Post, Put, Delete, Param, Body, Query, Header } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiCreatedResponse } from '@nestjs/swagger';

import { Faculty } from './entity/faculty.entity.js';
import { FacultyService } from './faculty.service.js';
import { CreateFacultyDto } from './dto/create-faculty.dto.js';
import { UpdateFacultyDto } from './dto/update-faculty.dto.js';
import { GetFacultiesQueryDto } from './dto/get-faculty.dto.js';
import { FacultyWithoutCoursesDto } from './dto/faculty-response-nocourse.dto.js';

import { Serialize } from '../../decorators/serialize.decorator.js';
import { DatabaseOperation } from '../../decorators/responses/database-operation.decorator.js';
import { Admin } from '../../decorators/auth/admin.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';
import { DeletedResponse } from '../../decorators/responses/deleted-response.decorator.js';
import { RequiresAuth } from '../../decorators/auth/auth.decorator.js';

@Controller('faculties')
@Serialize(Faculty)
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  @RequiresAuth()
  @ApiOperation({
    summary: 'ADMIN',
    description:
      'Get faculties of a university without courses. Specify universityId as query parameter',
  })
  @ApiOkResponse({
    type: FacultyWithoutCoursesDto,
    isArray: true,
    description: 'Success',
  })
  @Header('Cache-Control', 'private, max-age=14400') // 4 hours
  @DatabaseOperation()
  @Throttable(60, 20000)
  async getAll(@Query() query: GetFacultiesQueryDto) {
    return this.facultyService.getAllByUniversity(query.universityId);
  }

  @Get(':id/courses')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Get faculty by ID with courses',
  })
  @ApiOkResponse({
    type: Faculty,
    description: 'Success',
  })
  @DatabaseOperation()
  @Throttable(60, 3)
  async getOneWithCourses(@Param('id') id: string) {
    return this.facultyService.getOneWithCourses(id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'PUBLIC',
    description: 'Get faculty by ID without courses',
  })
  @ApiOkResponse({
    type: FacultyWithoutCoursesDto,
    description: 'Success',
  })
  @Header('Cache-Control', 'public, max-age=3600')
  @DatabaseOperation()
  @Throttable(60, 60000)
  async getOne(@Param('id') id: string) {
    return this.facultyService.getOne(id);
  }

  @Post()
  @Admin()
  @DatabaseOperation()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Creates a new faculty under a specific university',
  })
  @ApiCreatedResponse({
    type: FacultyWithoutCoursesDto,
    description: 'Created',
  })
  @Throttable(60, 3)
  async create(@Body() dto: CreateFacultyDto) {
    return this.facultyService.create(dto);
  }

  @Put(':id')
  @Admin()
  @ApiOperation({ summary: 'ADMIN', description: 'Update existing faculty' })
  @ApiOkResponse({ type: Faculty, description: 'Updated' })
  @DatabaseOperation()
  @Throttable(60, 3)
  async update(@Param('id') id: string, @Body() dto: UpdateFacultyDto) {
    return this.facultyService.update(id, dto);
  }

  @Delete(':id')
  @Admin()
  @ApiOperation({ summary: 'ADMIN', description: 'Delete existing faculty' })
  @DeletedResponse()
  @DatabaseOperation()
  @Throttable(60, 3)
  async remove(@Param('id') id: string) {
    return this.facultyService.remove(id);
  }
}
