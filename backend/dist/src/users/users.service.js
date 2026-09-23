"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const users_repository_1 = require("./repositories/users.repository");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async create(dto) {
        const existingUser = await this.usersRepository.findByEmail(dto.email);
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        const password = await bcrypt.hash(dto.password, 12);
        return this.usersRepository.create({
            email: dto.email.toLowerCase(),
            password,
            name: dto.name ?? null,
        });
    }
    findByEmail(email) {
        return this.usersRepository.findByEmail(email.toLowerCase());
    }
    findById(id) {
        return this.usersRepository.findById(id);
    }
    async assignPlatformRole(userId, role, currentAdminId) {
        const user = await this.usersRepository.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException(`Usuario con ID ${userId} no encontrado`);
        }
        if (user.platformRole === client_1.PlatformRole.PLATFORM_ADMIN &&
            (role === null || role === client_1.PlatformRole.SUPPORT)) {
            const adminCount = await this.usersRepository.countPlatformAdmins();
            if (adminCount <= 1 && user.id === currentAdminId) {
                throw new common_1.ForbiddenException('No es posible remover el rol PLATFORM_ADMIN del último administrador de plataforma');
            }
            if (adminCount <= 1 && user.id !== currentAdminId) {
                throw new common_1.ForbiddenException('No es posible remover el rol PLATFORM_ADMIN porque quedaría la plataforma sin administradores');
            }
        }
        return this.usersRepository.updatePlatformRole(userId, role);
    }
    async getPlatformAdminCount() {
        return this.usersRepository.countPlatformAdmins();
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository])
], UsersService);
//# sourceMappingURL=users.service.js.map