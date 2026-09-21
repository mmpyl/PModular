import { CashRegistersRepository } from './repositories/cash-registers.repository';
import { CreateCashRegisterDto, UpdateCashRegisterDto, OpenCashRegisterDto, CloseCashRegisterDto, CreateCashRegisterMovementDto } from './dto/create-cash-register.dto';
export declare class CashRegistersService {
    private readonly cashRegistersRepository;
    constructor(cashRegistersRepository: CashRegistersRepository);
    findAll(organizationId: string): Promise<CashRegister[]>;
    findOne(id: string, organizationId: string): Promise<any>;
    create(data: CreateCashRegisterDto, organizationId: string): Promise<CashRegister>;
    update(id: string, data: UpdateCashRegisterDto, organizationId: string): Promise<CashRegister>;
    open(id: string, data: OpenCashRegisterDto, userId: string, organizationId: string): Promise<CashRegister>;
    close(id: string, data: CloseCashRegisterDto, userId: string, organizationId: string): Promise<CashRegister>;
    addMovement(id: string, data: CreateCashRegisterMovementDto, userId: string, organizationId: string): Promise<CashRegisterMovement>;
    getMovements(id: string, organizationId: string): Promise<CashRegisterMovement[]>;
    remove(id: string, organizationId: string): Promise<CashRegister>;
}
