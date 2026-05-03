import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { Admin } from '../../decorators/auth/admin.decorator.js';
import { RequiresAuth } from '../../decorators/auth/auth.decorator.js';
import { AuthUserId } from '../../decorators/auth/user-id.decorator.js';
import { DatabaseOperation } from '../../decorators/responses/database-operation.decorator.js';
import { DeletedResponse } from '../../decorators/responses/deleted-response.decorator.js';
import { Serialize } from '../../decorators/serialize.decorator.js';
import { Throttable } from '../../common/throttling/throttler.decorator.js';

import { AveragesCalculation, CREDIT_PROFILE_BODY_SCHEMA } from './entity/average.entity.js';
import { AveragesService } from './averages.service.js';

@Controller('averages')
@Serialize(AveragesCalculation)
export class AveragesController {
  constructor(private readonly averagesService: AveragesService) {}

  @Get()
  @RequiresAuth()
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Return the authenticated users saved average calculator JSON',
  })
  @ApiOkResponse({ type: AveragesCalculation, description: 'Success' })
  @DatabaseOperation()
  @Throttable(60, 2000)
  async findOwnCredits(@AuthUserId() userId: string): Promise<AveragesCalculation> {
    return await this.averagesService.findMine(userId);
  }

  @Get(':id')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Return a users saved average calculator JSON',
  })
  @ApiOkResponse({ type: AveragesCalculation, description: 'Success' })
  @DatabaseOperation()
  @Throttable(60, 2)
  async findCreditsByUserId(@Param('id') id: string): Promise<AveragesCalculation> {
    return await this.averagesService.findByUserId(id);
  }

  @Put()
  @RequiresAuth()
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Replace the authenticated users saved average calculator JSON',
  })
  @ApiBody({ schema: CREDIT_PROFILE_BODY_SCHEMA })
  @ApiOkResponse({ type: AveragesCalculation, description: 'Updated' })
  @DatabaseOperation()
  @Throttable(60, 20000)
  async updateOwnCredits(
    @AuthUserId() userId: string,
    @Body() payload: unknown
  ): Promise<AveragesCalculation> {
    return await this.averagesService.saveMine(userId, payload);
  }

  @Delete()
  @RequiresAuth()
  @ApiOperation({
    summary: 'USER AUTH',
    description: 'Delete the authenticated users saved average calculator JSON',
  })
  @DeletedResponse()
  @DatabaseOperation()
  @Throttable(60, 200)
  async deleteOwnCredits(@AuthUserId() userId: string): Promise<void> {
    await this.averagesService.deleteMine(userId);
  }

  @Delete('cache/:id')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Reset a users average calculator cache entry',
  })
  @DeletedResponse('Resetted')
  @DatabaseOperation()
  @Throttable(60, 2)
  async deleteCreditsCacheByUserId(@Param('id') id: string): Promise<void> {
    await this.averagesService.clearCacheForUser(id);
  }

  @Delete(':id')
  @Admin()
  @ApiOperation({
    summary: 'ADMIN',
    description: 'Delete a users saved average calculator JSON',
  })
  @DeletedResponse()
  @DatabaseOperation()
  @Throttable(60, 2)
  async deleteCreditsByUserId(@Param('id') id: string): Promise<void> {
    await this.averagesService.deleteForUser(id);
  }
}
