import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma.module';
import { UsersModule } from './users/users.module';
import { BusinessTypesModule } from './business-types/business-types.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { MembershipsModule } from './memberships/memberships.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { UnitsOfMeasureModule } from './units-of-measure/units-of-measure.module';
import { InventoryModule } from './inventory/inventory.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { BatchesModule } from './batches/batches.module';
import { BusinessEntitiesModule } from './business-entities/business-entities.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { SalesModule } from './sales/sales.module';
import { CashRegistersModule } from './cash-registers/cash-registers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    BusinessTypesModule,
    OrganizationsModule,
    MembershipsModule,
    ProductsModule,
    CategoriesModule,
    UnitsOfMeasureModule,
    InventoryModule,
    StockMovementsModule,
    BatchesModule,
    BusinessEntitiesModule,
    PurchaseOrdersModule,
    SalesModule,
    CashRegistersModule,
  ],
})
export class AppModule {}
