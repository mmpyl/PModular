"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentOrg = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentOrg = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const organizationId = request.organizationId || request.headers['x-org-id'];
    if (!organizationId) {
        throw new Error('CurrentOrg decorator requires TenantGuard to be executed first. ' +
            'Make sure @UseGuards(TenantGuard) is applied to the controller or route.');
    }
    return organizationId;
});
//# sourceMappingURL=current-org.decorator.js.map