import { Module } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './users.service';
<<<<<<< HEAD
import { PrismaModule } from '../prisma.module';
import { PlatformUsersController } from './platform-users.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PlatformUsersController],
=======
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
  providers: [UsersRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
