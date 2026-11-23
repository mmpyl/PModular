import { Module } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma.module';
import { PlatformUsersController } from './platform-users.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PlatformUsersController],
  providers: [UsersRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
