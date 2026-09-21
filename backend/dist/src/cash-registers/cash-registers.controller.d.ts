import { CashRegistersService } from './cash-registers.service';
import { CreateCashRegisterDto, UpdateCashRegisterDto, OpenCashRegisterDto, CloseCashRegisterDto, CreateCashRegisterMovementDto } from './dto/create-cash-register.dto';
interface AuthRequest extends Request {
    user: {
        sub: string;
        email: string;
        organizationId?: string;
        orgRole?: string;
    };
}
export declare class CashRegistersController {
    private readonly cashRegistersService;
    constructor(cashRegistersService: CashRegistersService);
    create(createCashRegisterDto: CreateCashRegisterDto, req: AuthRequest): Promise<CashRegister>;
    findAll(req: AuthRequest): Promise<CashRegister[]>;
    findOne(id: string, req: AuthRequest): Promise<any>;
    getMovements(id: string, req: AuthRequest): Promise<CashRegisterMovement[]>;
    update(id: string, updateCashRegisterDto: UpdateCashRegisterDto, req: AuthRequest): Promise<CashRegister>;
    open(id: string, openCashRegisterDto: OpenCashRegisterDto, req: AuthRequest): Promise<CashRegister>;
    close(id: string, closeCashRegisterDto: CloseCashRegisterDto, req: AuthRequest): Promise<CashRegister>;
    addMovement(id: string, createMovementDto: CreateCashRegisterMovementDto, req: AuthRequest): Promise<CashRegisterMovement>;
    remove(id: string, req: AuthRequest): Promise<CashRegister>;
}
export {};
