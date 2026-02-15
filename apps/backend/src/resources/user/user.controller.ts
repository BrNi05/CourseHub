import { Controller, Get, Put, Delete, Param, Body, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { User } from './entity/user.entity.js';
import { UserService } from './user.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdatePinnedCoursesDto } from './dto/update-pinned.dto.js';
import { UserResponseWithoutPinnedDto } from './dto/user-response-nopinned.dto.js';

import { Serialize } from '../../decorators/serialize.decorator.js';
import { Admin } from '../../decorators/admin.decorator.js';
import { DatabaseOperation } from '../../decorators/database-operation.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';
import { RequiresAuthAndOwnership } from '../../decorators/ownership.decorator.js';

@Controller('users')
@Serialize(User)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Returns a list of all users in the DB without their pinned courses',
  })
  @ApiOkResponse({ type: UserResponseWithoutPinnedDto, isArray: true, description: 'Success' })
  @DatabaseOperation()
  @Throttable(60, 3)
  async readAll(): Promise<UserResponseWithoutPinnedDto[]> {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  @RequiresAuthAndOwnership()
  @ApiOperation({
    summary: 'USER AUTH / ADMIN',
    description: 'Returns the user its own data including pinned courses',
  })
  @ApiOkResponse({
    type: User,
    description: 'Success',
  })
  @DatabaseOperation()
  @Throttable(60, 10000)
  async readOne(@Param('id') id: string): Promise<User> {
    return this.userService.getUserById(id);
  }

  @Post(':id')
  @RequiresAuthAndOwnership()
  @ApiOperation({
    summary: 'USER AUTH / ADMIN',
    description: 'Update pinned courses of the user. Supposed to be used by the client apps.',
  })
  @ApiCreatedResponse({ type: User, description: 'Created' })
  @DatabaseOperation()
  @Throttable(60, 10000)
  async updatePinnedCourses(
    @Param('id') id: string,
    @Body() dto: UpdatePinnedCoursesDto
  ): Promise<User> {
    return this.userService.updateUser(id, dto);
  }

  @Put(':id')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Updates user data (admin state, pinned courses) of an existing user',
  })
  @ApiOkResponse({ type: User, description: 'Updated' })
  @DatabaseOperation()
  @Throttable(60, 3)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<User> {
    return this.userService.updateUser(id, dto);
  }

  @Delete(':id')
  @RequiresAuthAndOwnership()
  @ApiOperation({
    summary: 'USER AUTH / ADMIN',
    description: 'Deletes an existing user from the database',
  })
  @ApiNoContentResponse({ description: 'Deleted' })
  @DatabaseOperation()
  @Throttable(60, 3)
  async delete(@Param('id') id: string): Promise<void> {
    return this.userService.deleteUser(id);
  }
}
