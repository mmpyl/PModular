"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./auth/auth.module");
const prisma_module_1 = require("./prisma.module");
const users_module_1 = require("./users/users.module");
const business_types_module_1 = require("./business-types/business-types.module");
const organizations_module_1 = require("./organizations/organizations.module");
const memberships_module_1 = require("./memberships/memberships.module");
const products_module_1 = require("./products/products.module");
const categories_module_1 = require("./categories/categories.module");
const units_of_measure_module_1 = require("./units-of-measure/units-of-measure.module");
const inventory_module_1 = require("./inventory/inventory.module");
const stock_movements_module_1 = require("./stock-movements/stock-movements.module");
const batches_module_1 = require("./batches/batches.module");
const business_entities_module_1 = require("./business-entities/business-entities.module");
const purchase_orders_module_1 = require("./purchase-orders/purchase-orders.module");
const sales_module_1 = require("./sales/sales.module");
const cash_registers_module_1 = require("./cash-registers/cash-registers.module");
const reports_module_1 = require("./reports/reports.module");
const auth_shared_module_1 = require("./auth/auth-shared.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            auth_shared_module_1.AuthSharedModule,
            prisma_module_1.PrismaModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            business_types_module_1.BusinessTypesModule,
            organizations_module_1.OrganizationsModule,
            memberships_module_1.MembershipsModule,
            products_module_1.ProductsModule,
            categories_module_1.CategoriesModule,
            units_of_measure_module_1.UnitsOfMeasureModule,
            inventory_module_1.InventoryModule,
            stock_movements_module_1.StockMovementsModule,
            batches_module_1.BatchesModule,
            business_entities_module_1.BusinessEntitiesModule,
            purchase_orders_module_1.PurchaseOrdersModule,
            sales_module_1.SalesModule,
            cash_registers_module_1.CashRegistersModule,
            reports_module_1.ReportsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map