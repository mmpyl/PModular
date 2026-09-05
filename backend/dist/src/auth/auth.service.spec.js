"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const testing_1 = require("@nestjs/testing");
const bcrypt = require("bcrypt");
const users_service_1 = require("../users/users.service");
const auth_service_1 = require("./auth.service");
describe('AuthService', () => {
    let service;
    let usersService;
    let jwtService;
    const password = bcrypt.hashSync('correct-password', 4);
    const user = {
        id: 'user-1',
        email: 'demo@pymen.dev',
        password,
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: users_service_1.UsersService,
                    useValue: { create: jest.fn(), findByEmail: jest.fn() },
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: { signAsync: jest.fn().mockResolvedValue('signed-jwt') },
                },
                {
                    provide: config_1.ConfigService,
                    useValue: { get: jest.fn().mockReturnValue('1h') },
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        usersService = module.get(users_service_1.UsersService);
        jwtService = module.get(jwt_1.JwtService);
    });
    it('devuelve accessToken y usuario sin password en un login válido', async () => {
        usersService.findByEmail.mockResolvedValue(user);
        const result = await service.login({ email: user.email, password: 'correct-password' });
        expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: user.id, email: user.email }, { expiresIn: '1h' });
        expect(result.accessToken).toBe('signed-jwt');
        expect(result.user).not.toHaveProperty('password');
    });
    it('rechaza login con contraseña incorrecta', async () => {
        usersService.findByEmail.mockResolvedValue(user);
        await expect(service.login({ email: user.email, password: 'wrong-password' })).rejects.toBeInstanceOf(common_1.UnauthorizedException);
    });
    it('rechaza login si el usuario no existe', async () => {
        usersService.findByEmail.mockResolvedValue(null);
        await expect(service.login({ email: 'nope@pymen.dev', password: 'whatever1' })).rejects.toBeInstanceOf(common_1.UnauthorizedException);
    });
});
//# sourceMappingURL=auth.service.spec.js.map