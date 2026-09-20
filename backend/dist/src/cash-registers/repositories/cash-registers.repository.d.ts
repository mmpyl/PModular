import { PrismaService } from '../../prisma.service';
import { CashRegister, CashRegisterMovement } from '@prisma/client';
import { CreateCashRegisterDto, UpdateCashRegisterDto, OpenCashRegisterDto, CloseCashRegisterDto, CreateCashRegisterMovementDto } from '../dto/create-cash-register.dto';
export declare class CashRegistersRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(organizationId: string): Promise<CashRegister[]>;
    findOne(id: string, organizationId: string): Promise<CashRegister | null>;
    findByStatus(organizationId: string, status: string): Promise<CashRegister[]>;
    create(data: CreateCashRegisterDto, organizationId: string): Promise<CashRegister>;
    update(id: string, data: UpdateCashRegisterDto, organizationId: string): Promise<CashRegister>;
    open(id: string, data: OpenCashRegisterDto, userId: string, organizationId: string): Promise<CashRegister>;
    close(id: string, data: CloseCashRegisterDto, userId: string, organizationId: string): Promise<CashRegister>;
    addMovement(id: string, data: CreateCashRegisterMovementDto, userId: string, organizationId: string): Promise<CashRegisterMovement>;
    getMovements(cashRegisterId: string, organizationId: string): Promise<CashRegisterMovement[]>;
    delete(id: string, organizationId: string): Promise<CashRegister>;
}
