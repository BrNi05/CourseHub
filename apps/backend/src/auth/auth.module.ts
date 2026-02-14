import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

import { JwtStrategy } from './strategies/jwt.stretegy.js';
import { GoogleStrategy } from './strategies/google.strategy.js';

import { JwtAuthGuard } from './guards/jwt.guard.js';
import { AdminGuard } from './guards/admin.guard.js';
import { UserOwnershipGuard } from './guards/ownership.guard.js';

import { LoggerModule } from '../logger/logger.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    LoggerModule.forRoot('AuthModule'),
    PrismaModule,
  ],
  providers: [
    AuthService,
    GoogleStrategy,
    JwtStrategy,
    JwtAuthGuard,
    AdminGuard,
    UserOwnershipGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, UserOwnershipGuard, AdminGuard, JwtAuthGuard],
})
export class AuthModule {}
