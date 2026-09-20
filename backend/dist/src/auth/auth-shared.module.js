"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSharedModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const org_roles_guard_1 = require("./guards/org-roles.guard");
const tenant_guard_1 = require("./guards/tenant.guard");
const jwt_strategy_1 = require("./jwt.strategy");
let AuthSharedModule = class AuthSharedModule {
};
exports.AuthSharedModule = AuthSharedModule;
exports.AuthSharedModule = AuthSharedModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.getOrThrow('JWT_SECRET'),
                }),
            }),
        ],
        providers: [jwt_strategy_1.JwtStrategy, jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard],
        exports: [jwt_1.JwtModule, jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard],
    })
], AuthSharedModule);
//# sourceMappingURL=auth-shared.module.js.map