import 'reflect-metadata';

import { InvoicingController } from '../invoicing/invoicing.controller';
import { OrganizationsController } from '../organizations/organizations.controller';

describe('Business settings permissions', () => {
  it('allows ADMIN to manage billing provider settings', () => {
    const roles = Reflect.getMetadata('orgRoles', InvoicingController.prototype.getNubefactSettings);
    expect(roles).toEqual(['OWNER', 'ADMIN']);
  });

  it('allows ADMIN to update organization settings', () => {
    const roles = Reflect.getMetadata('orgRoles', OrganizationsController.prototype.update);
    expect(roles).toEqual(['OWNER', 'ADMIN']);
  });
});