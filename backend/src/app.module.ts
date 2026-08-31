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
  ],
})
export class AppModule {}
