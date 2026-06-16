import { Controller, Get, Put, Delete, Param, Body, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { User } from './entity/user.entity.js';
import { UserService } from './user.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdatePinnedCoursesDto } from './dto/update-pinned.dto.js';
import { UserResponseWithoutPinnedDto } from './dto/user-response-nopinned.dto.js';

import { Serialize } from '../../decorators/serialize.decorator.js';
import { Admin } from '../../decorators/auth/admin.decorator.js';
import { DatabaseOperation } from '../../decorators/responses/database-operation.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';
import { RequiresAuthAndOwnership } from '../../decorators/auth/ownership.decorator.js';
import { DeletedResponse } from '../../decorators/responses/deleted-response.decorator.js';
import { RequiresAuth } from '../../decorators/auth/auth.decorator.js';
import { AuthUserId } from '../../decorators/auth/user-id.decorator.js';

import {
  ONE_DAY_THROTTLE_TTL,
  ONE_MINUTE_THROTTLE_TTL,
  ADMIN_USER_DELETE_THROTTLE_LIMIT,
  ME_OPERATION_THROTTLE_LIMIT,
  THROTTLE_LIMIT_ONE,
  USER_DELETE_THROTTLE_LIMIT,
} from '../../common/throttling/throttling.constants.js';

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
  @Throttable(ONE_DAY_THROTTLE_TTL, THROTTLE_LIMIT_ONE)
  async readAll(): Promise<UserResponseWithoutPinnedDto[]> {
    return this.userService.getAllUsers();
  }

  @Get('me')
  @RequiresAuth()
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Returns the authenticated user data including pinned courses',
  })
  @ApiOkResponse({
    type: User,
    description: 'Success',
  })
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, ME_OPERATION_THROTTLE_LIMIT)
  async readOwnOne(@AuthUserId() userId: string): Promise<User> {
    return this.userService.getUserById(userId);
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
  @Throttable(ONE_MINUTE_THROTTLE_TTL, ME_OPERATION_THROTTLE_LIMIT)
  async readOne(@Param('id') id: string): Promise<User> {
    return this.userService.getUserById(id);
  }

  @Post('me')
  @RequiresAuth()
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Update pinned courses of the authenticated user.',
  })
  @ApiCreatedResponse({ type: User, description: 'Created' })
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, ME_OPERATION_THROTTLE_LIMIT)
  async updateOwnPinnedCourses(
    @AuthUserId() userId: string,
    @Body() dto: UpdatePinnedCoursesDto
  ): Promise<User> {
    return this.userService.updateUser(userId, dto);
  }

  @Post(':id')
  @RequiresAuthAndOwnership()
  @ApiOperation({
    summary: 'USER AUTH / ADMIN',
    description: 'Update pinned courses of the user.',
  })
  @ApiCreatedResponse({ type: User, description: 'Created' })
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, ME_OPERATION_THROTTLE_LIMIT)
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
  @Throttable(ONE_MINUTE_THROTTLE_TTL, THROTTLE_LIMIT_ONE)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<User> {
    return this.userService.updateUser(id, dto);
  }

  @Delete('cache')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Reset all user related caches',
  })
  @DeletedResponse('Resetted')
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, THROTTLE_LIMIT_ONE)
  async deleteAll(): Promise<void> {
    return await this.userService.resetAllUsersCache();
  }

  @Delete('me')
  @RequiresAuth()
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Deletes the authenticated user from the database',
  })
  @DeletedResponse()
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, USER_DELETE_THROTTLE_LIMIT)
  async deleteOwn(@AuthUserId() userId: string): Promise<void> {
    return this.userService.deleteUser(userId);
  }

  @Delete(':id')
  @RequiresAuthAndOwnership()
  @ApiOperation({
    summary: 'USER AUTH / ADMIN',
    description: 'Deletes an existing user from the database',
  })
  @DeletedResponse()
  @DatabaseOperation()
  @Throttable(ONE_MINUTE_THROTTLE_TTL, ADMIN_USER_DELETE_THROTTLE_LIMIT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.userService.deleteUser(id);
  }
}
