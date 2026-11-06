import { loginSchema } from '../login-schema';

describe('loginSchema', () => {
  it('debe validar credenciales correctas', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const result = loginSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it('debe rechazar email inválido', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'password123',
    };

    const result = loginSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email');
    }
  });

  it('debe rechazar contraseña menor a 8 caracteres', () => {
    const invalidData = {
      email: 'test@example.com',
      password: 'short',
    };

    const result = loginSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('8');
    }
  });

  it('debe rechazar email vacío', () => {
    const invalidData = {
      email: '',
      password: 'password123',
    };

    const result = loginSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  it('debe rechazar contraseña vacía', () => {
    const invalidData = {
      email: 'test@example.com',
      password: '',
    };

    const result = loginSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });
});
