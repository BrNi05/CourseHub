import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { OAuthStateStore } from './oauth-state.store.js';

import { JwtStrategy } from './strategies/jwt.stretegy.js';
import { GoogleStrategy } from './strategies/google.strategy.js';

import { JwtAuthGuard } from './guards/jwt.guard.js';
import { AdminGuard } from './guards/admin.guard.js';
import { UserOwnershipGuard } from './guards/ownership.guard.js';

import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
    PrismaModule,
  ],
  providers: [
    AuthService,
    OAuthStateStore,
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
