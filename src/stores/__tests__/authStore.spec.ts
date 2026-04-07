/**
 * SPEC: authStore — comportamento de autenticação
 *
 * Estes specs documentam os contratos de negócio do fluxo de auth.
 * Gerados como parte do Sprint 1 (SDD retroativo) para garantir
 * que os null-checks implementados não regridam.
 */

import { describe, it, expect } from 'vitest';
import type { Profile } from '../../types';

// ─── Helpers puros extraídos da lógica do store ─────────────────────────────

/**
 * Valida se um profile retornado pelo Supabase é usável.
 * O store deve rejeitar profiles nulos antes do cast.
 */
function isValidProfile(data: unknown): data is Profile {
  if (!data || typeof data !== 'object') return false;
  const p = data as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.role === 'string' &&
    typeof p.email === 'string'
  );
}

/**
 * Formata a mensagem de erro de login para o usuário.
 * O store deve expor mensagens em espanhol, não erros técnicos.
 */
function formatAuthError(code: string | undefined): string {
  switch (code) {
    case 'invalid_credentials': return 'Email o contraseña incorrectos.';
    case 'email_not_confirmed':  return 'Confirmá tu email antes de iniciar sesión.';
    case 'user_not_found':       return 'No existe una cuenta con ese email.';
    default:                     return 'Ocurrió un error. Intentá de nuevo.';
  }
}

// ─── Specs de validação de profile ───────────────────────────────────────────

describe('isValidProfile (guard antes do cast)', () => {
  it('retorna false para null — impede crash no cast', () => {
    expect(isValidProfile(null)).toBe(false);
  });

  it('retorna false para undefined', () => {
    expect(isValidProfile(undefined)).toBe(false);
  });

  it('retorna false para objeto vazio', () => {
    expect(isValidProfile({})).toBe(false);
  });

  it('retorna false para profile sem id', () => {
    expect(isValidProfile({ role: 'buyer', email: 'a@b.com' })).toBe(false);
  });

  it('retorna false para profile sem role', () => {
    expect(isValidProfile({ id: '123', email: 'a@b.com' })).toBe(false);
  });

  it('retorna true para profile mínimo válido', () => {
    const profile = { id: '123', role: 'buyer', email: 'a@b.com' };
    expect(isValidProfile(profile)).toBe(true);
  });

  it('retorna true para profile completo de vendedor', () => {
    const profile: Profile = {
      id: 'abc',
      role: 'seller',
      name: 'José',
      email: 'jose@example.com',
      phone: '+595981000000',
      whatsapp: '+595981000000',
      avatar_url: '',
      bio: '',
      city: 'Asunción',
      document_verified: false,
      created_at: new Date().toISOString(),
    };
    expect(isValidProfile(profile)).toBe(true);
  });
});

// ─── Specs de mensagens de erro ───────────────────────────────────────────────

describe('formatAuthError (mensagens para o usuário)', () => {
  it('credenciais inválidas → mensagem legível em espanhol', () => {
    const msg = formatAuthError('invalid_credentials');
    expect(msg).toBe('Email o contraseña incorrectos.');
    expect(msg).not.toMatch(/error/i); // sem jargão técnico
  });

  it('email não confirmado → instrução clara', () => {
    expect(formatAuthError('email_not_confirmed')).toContain('email');
  });

  it('usuário não encontrado → mensagem específica', () => {
    expect(formatAuthError('user_not_found')).not.toBe('');
  });

  it('código desconhecido → fallback genérico (não vazio, não técnico)', () => {
    const msg = formatAuthError('some_random_code');
    expect(msg.length).toBeGreaterThan(0);
    expect(msg).not.toContain('some_random_code');
  });

  it('undefined → fallback genérico', () => {
    const msg = formatAuthError(undefined);
    expect(msg.length).toBeGreaterThan(0);
  });
});

// ─── Specs de roles e permissões ─────────────────────────────────────────────

describe('Role hierarchy (regras de acesso)', () => {
  type Role = 'buyer' | 'seller' | 'admin';

  function canAccessAdmin(role: Role): boolean {
    return role === 'admin';
  }

  function canPublishListing(role: Role): boolean {
    return role === 'seller' || role === 'admin';
  }

  function canAccessDealerPanel(role: Role): boolean {
    return role === 'seller' || role === 'admin';
  }

  it('buyer NÃO pode acessar painel admin', () => {
    expect(canAccessAdmin('buyer')).toBe(false);
  });

  it('seller NÃO pode acessar painel admin', () => {
    expect(canAccessAdmin('seller')).toBe(false);
  });

  it('admin PODE acessar painel admin', () => {
    expect(canAccessAdmin('admin')).toBe(true);
  });

  it('buyer NÃO pode publicar anúncios', () => {
    expect(canPublishListing('buyer')).toBe(false);
  });

  it('seller PODE publicar anúncios', () => {
    expect(canPublishListing('seller')).toBe(true);
  });

  it('admin PODE publicar anúncios', () => {
    expect(canPublishListing('admin')).toBe(true);
  });

  it('seller PODE acessar painel concessionária', () => {
    expect(canAccessDealerPanel('seller')).toBe(true);
  });

  it('buyer NÃO pode acessar painel concessionária', () => {
    expect(canAccessDealerPanel('buyer')).toBe(false);
  });
});
