import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { RequiresAuth } from '../../decorators/auth/auth.decorator.js';
import { AuthUserId } from '../../decorators/auth/user-id.decorator.js';
import { Serialize } from '../../decorators/serialize.decorator.js';
import { DatabaseOperation } from '../../decorators/responses/database-operation.decorator.js';
import { DeletedResponse } from '../../decorators/responses/deleted-response.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';
import { Admin } from '../../decorators/auth/admin.decorator.js';

import { CoursePackage } from './entity/course-package.entity.js';
import { CoursePackageService } from './course-package.service.js';
import { CreateCoursePackageDto } from './dto/create-course-package.dto.js';
import { UpdateCoursePackageDto } from './dto/update-course-package.dto.js';
import { SearchCoursePackageDto } from './dto/search-course-package.dto.js';
import { SetCoursePackagePermanentDto } from './dto/set-course-package-permanent.dto.js';
import { UseCoursePackageResponseDto } from './dto/use-course-package-response.dto.js';
import { RequiresCoursePackageOwnership } from '../../decorators/auth/requires-course-package-ownership.decorator.js';

@Controller('course-packages')
@Serialize(CoursePackage)
export class CoursePackageController {
  constructor(private readonly coursePackageService: CoursePackageService) {}

  @Post()
  @RequiresAuth()
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Create a new course package for the authenticated user',
  })
  @ApiCreatedResponse({ type: CoursePackage, description: 'Created' })
  @DatabaseOperation()
  @Throttable(60, 20)
  async create(
    @AuthUserId() userId: string,
    @Body() dto: CreateCoursePackageDto
  ): Promise<CoursePackage> {
    return await this.coursePackageService.create(userId, dto);
  }

  @Get('my')
  @RequiresAuth()
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Return course packages owned by the authenticated user',
  })
  @ApiOkResponse({ type: [CoursePackage], description: 'Success' })
  @DatabaseOperation()
  @Throttable(60, 200)
  async findMine(@AuthUserId() userId: string): Promise<CoursePackage[]> {
    return await this.coursePackageService.findMine(userId);
  }

  @Get('search')
  @RequiresAuth()
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Search course packages by university, faculty, or package name',
  })
  @ApiOkResponse({ type: [CoursePackage], description: 'Success' })
  @DatabaseOperation()
  @Throttable(60, 200)
  async search(@Query() query: SearchCoursePackageDto): Promise<CoursePackage[]> {
    return await this.coursePackageService.search(query);
  }

  @Get(':id')
  @RequiresAuth()
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Get a single course package by ID',
  })
  @ApiOkResponse({ type: CoursePackage, description: 'Success' })
  @DatabaseOperation()
  @Throttable(60, 200)
  async findOne(@Param('id') id: string): Promise<CoursePackage> {
    return await this.coursePackageService.findById(id);
  }

  @Put(':id')
  @RequiresCoursePackageOwnership()
  @ApiOperation({
    summary: 'OWNER / ADMIN',
    description: 'Update an owned course package or any package as an admin',
  })
  @ApiOkResponse({ type: CoursePackage, description: 'Updated' })
  @DatabaseOperation()
  @Throttable(60, 40)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCoursePackageDto
  ): Promise<CoursePackage> {
    return await this.coursePackageService.update(id, dto);
  }

  @Post(':id/permanent')
  @Admin()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Set whether a course package is permanent',
  })
  @ApiOkResponse({ type: CoursePackage, description: 'Updated' })
  @DatabaseOperation()
  @Throttable(60, 20)
  async setPermanent(
    @Param('id') id: string,
    @Body() dto: SetCoursePackagePermanentDto
  ): Promise<CoursePackage> {
    return await this.coursePackageService.setPermanent(id, dto.isPermanent);
  }

  @Delete('cache')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Reset all course package related caches',
  })
  @DeletedResponse('Resetted')
  @DatabaseOperation()
  @Throttable(60, 1)
  deleteAllCache(): void {
    return this.coursePackageService.clearSearchQueryCache();
  }

  @Delete(':id')
  @RequiresCoursePackageOwnership()
  @ApiOperation({
    summary: 'OWNER / ADMIN',
    description: 'Delete an owned course package or any package as an admin',
  })
  @DeletedResponse()
  @DatabaseOperation()
  @Throttable(60, 20)
  async remove(@Param('id') id: string): Promise<void> {
    await this.coursePackageService.remove(id);
  }

  @Post(':id/use')
  @RequiresCoursePackageOwnership()
  @Serialize(UseCoursePackageResponseDto)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Mark a course package as used',
  })
  @ApiOkResponse({
    type: UseCoursePackageResponseDto,
    description: 'Usage timestamp updated',
  })
  @DatabaseOperation()
  @Throttable(60, 100)
  async markAsUsed(@Param('id') id: string): Promise<{ success: true }> {
    await this.coursePackageService.markAsUsed(id);

    return { success: true };
  }
}
