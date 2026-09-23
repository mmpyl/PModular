import { Prisma, User, PlatformRole } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
export declare class UsersRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.UserCreateInput): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    updatePlatformRole(userId: string, role: PlatformRole | null): Promise<User>;
    countPlatformAdmins(): Promise<number>;
}
