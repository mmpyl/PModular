import { User, PlatformRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './repositories/users.repository';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: UsersRepository);
    create(dto: CreateUserDto): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    assignPlatformRole(userId: string, role: PlatformRole | null, currentAdminId: string): Promise<User>;
    getPlatformAdminCount(): Promise<number>;
}
