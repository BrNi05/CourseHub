import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';

import { UniversityService } from './university.service.js';
import { University } from './entity/university.entity.js';
import { CreateUniversityDto } from './dto/create-university.dto.js';
import { UpdateUniversityDto } from './dto/update-university.dto.js';
import { UniversityWithoutFacultiesDto } from './dto/uni-reponse-nofaculty.dto.js';

import { Serialize } from '../../decorators/serialize.decorator.js';
import { DatabaseOperation } from '../../decorators/responses/database-operation.decorator.js';
import { Admin } from '../../decorators/auth/admin.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';
import { DeletedResponse } from '../../decorators/responses/deleted-response.decorator.js';

@Controller('universities')
@Serialize(University)
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Get()
  @ApiOperation({
    summary: 'PUBLIC',
    description: 'Returns a list of all universities without their faculties',
  })
  @ApiOkResponse({
    type: UniversityWithoutFacultiesDto,
    isArray: true,
    description: 'Success',
  })
  @DatabaseOperation()
  @Throttable(60, 10000)
  findAll() {
    return this.universityService.findAll();
  }

  @Get('faculties')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Returns a list of all universities with their faculties',
  })
  @ApiOkResponse({
    type: University,
    isArray: true,
    description: 'Success',
  })
  @DatabaseOperation()
  @Throttable(60, 3)
  findAllWithFaculties() {
    return this.universityService.findAllWithFaculties();
  }

  @Post()
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Creates a new university with the provided data',
  })
  @ApiCreatedResponse({ type: University, description: 'Created' })
  @DatabaseOperation()
  @Throttable(60, 3)
  create(@Body() dto: CreateUniversityDto) {
    return this.universityService.create(dto);
  }

  @Put(':id')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Updates an existing university with the provided data',
  })
  @ApiOkResponse({ type: University, description: 'Updated' })
  @DatabaseOperation()
  @Throttable(60, 3)
  update(@Param('id') id: string, @Body() dto: UpdateUniversityDto) {
    return this.universityService.update(id, dto);
  }

  @Delete('cache')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Reset all university related caches',
  })
  @DeletedResponse('Resetted')
  @DatabaseOperation()
  @Throttable(60, 1)
  async deleteAll(): Promise<void> {
    return await this.universityService.resetAllCache();
  }

  @Delete(':id')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Deletes an existing university',
  })
  @DeletedResponse()
  @DatabaseOperation()
  @Throttable(60, 3)
  async remove(@Param('id') id: string): Promise<void> {
    await this.universityService.remove(id);
  }
}
