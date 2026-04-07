import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerBaseSchema,
  contactFormSchema,
  listingTextSchema,
  profileEditSchema,
  reviewSchema,
  getFirstZodError,
} from '../validation';

describe('loginSchema', () => {
  it('aceita dados validos', () => {
    const result = loginSchema.safeParse({ email: 'test@email.com', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('rejeita email invalido', () => {
    const result = loginSchema.safeParse({ email: 'invalid', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('rejeita senha vazia', () => {
    const result = loginSchema.safeParse({ email: 'test@email.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('registerBaseSchema', () => {
  const validData = {
    name: 'Juan Perez',
    email: 'juan@email.com',
    phone: '+595 981 123 456',
    password: '123456',
    confirmPassword: '123456',
  };

  it('aceita dados validos', () => {
    const result = registerBaseSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejeita senhas que nao coincidem', () => {
    const result = registerBaseSchema.safeParse({ ...validData, confirmPassword: 'different' });
    expect(result.success).toBe(false);
  });

  it('rejeita nome muito curto', () => {
    const result = registerBaseSchema.safeParse({ ...validData, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejeita telefone invalido', () => {
    const result = registerBaseSchema.safeParse({ ...validData, phone: '12' });
    expect(result.success).toBe(false);
  });

  it('rejeita senha muito curta', () => {
    const result = registerBaseSchema.safeParse({ ...validData, password: '123', confirmPassword: '123' });
    expect(result.success).toBe(false);
  });
});

describe('contactFormSchema', () => {
  it('aceita dados validos com campos opcionais', () => {
    const result = contactFormSchema.safeParse({ name: 'Maria', phone: '+595 981 456 789' });
    expect(result.success).toBe(true);
  });

  it('aceita com email e mensagem opcionais', () => {
    const result = contactFormSchema.safeParse({
      name: 'Maria',
      phone: '+595 981 456 789',
      email: 'maria@email.com',
      message: 'Hola, me interesa el vehiculo',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita nome vazio', () => {
    const result = contactFormSchema.safeParse({ name: '', phone: '+595 981 456 789' });
    expect(result.success).toBe(false);
  });

  it('rejeita mensagem muito longa', () => {
    const result = contactFormSchema.safeParse({
      name: 'Maria',
      phone: '+595 981 456 789',
      message: 'x'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe('listingTextSchema', () => {
  const validListing = {
    title: 'Toyota Hilux 2023 4x4',
    description: 'Excelente estado, unico dueño. Nunca chocada, mantenimiento al dia.',
    city: 'Asuncion',
    whatsapp_contact: '+595 981 123 456',
    price_usd: 35000,
    year: 2023,
    mileage: 45000,
  };

  it('aceita listing valido', () => {
    const result = listingTextSchema.safeParse(validListing);
    expect(result.success).toBe(true);
  });

  it('rejeita titulo muito curto', () => {
    const result = listingTextSchema.safeParse({ ...validListing, title: 'Hi' });
    expect(result.success).toBe(false);
  });

  it('rejeita descricao muito curta', () => {
    const result = listingTextSchema.safeParse({ ...validListing, description: 'Corto' });
    expect(result.success).toBe(false);
  });

  it('rejeita preco zero', () => {
    const result = listingTextSchema.safeParse({ ...validListing, price_usd: 0 });
    expect(result.success).toBe(false);
  });

  it('rejeita ano no futuro distante', () => {
    const result = listingTextSchema.safeParse({ ...validListing, year: 2050 });
    expect(result.success).toBe(false);
  });

  it('rejeita km negativo', () => {
    const result = listingTextSchema.safeParse({ ...validListing, mileage: -100 });
    expect(result.success).toBe(false);
  });
});

describe('profileEditSchema', () => {
  it('aceita perfil valido', () => {
    const result = profileEditSchema.safeParse({ name: 'Juan Perez', phone: '+595 981 123 456' });
    expect(result.success).toBe(true);
  });

  it('aceita campos opcionais vazios', () => {
    const result = profileEditSchema.safeParse({ name: 'Juan', bio: '', city: '' });
    expect(result.success).toBe(true);
  });

  it('rejeita bio muito longa', () => {
    const result = profileEditSchema.safeParse({ name: 'Juan', bio: 'x'.repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe('reviewSchema', () => {
  it('aceita review valido', () => {
    const result = reviewSchema.safeParse({ rating: 5, comment: 'Excelente atencion, recomiendo mucho.' });
    expect(result.success).toBe(true);
  });

  it('rejeita rating 0', () => {
    const result = reviewSchema.safeParse({ rating: 0, comment: 'Buen servicio.' });
    expect(result.success).toBe(false);
  });

  it('rejeita rating > 5', () => {
    const result = reviewSchema.safeParse({ rating: 6, comment: 'Excelente.' });
    expect(result.success).toBe(false);
  });
});

describe('getFirstZodError', () => {
  it('retorna a primeira mensagem de erro', () => {
    const result = loginSchema.safeParse({ email: 'bad', password: '' });
    if (!result.success) {
      const msg = getFirstZodError(result.error);
      expect(msg).toBeTruthy();
      expect(typeof msg).toBe('string');
    }
  });
});
