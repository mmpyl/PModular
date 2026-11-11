import { SetMetadata } from '@nestjs/common';

export const REQUIRED_MODULES_KEY = 'requiredModules';
export const RequiredModules = (...modules: string[]) => SetMetadata(REQUIRED_MODULES_KEY, modules);