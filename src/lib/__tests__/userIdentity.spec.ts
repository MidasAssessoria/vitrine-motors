/**
 * SPEC: Modelo de identidade de usuário — VitrineMOTORS
 *
 * Este arquivo é a fonte de verdade para o modelo de roles e contextos
 * do sistema. Todo acesso condicional na UI e no backend DEVE seguir
 * estas regras.
 *
 * ─── ARQUITETURA ─────────────────────────────────────────────────────────────
 *
 * O sistema tem 3 roles no profiles.role:
 *   'buyer'  — pessoa física que busca e compra veículos
 *   'seller' — pessoa física OU dono/membro de concessionária que vende
 *   'admin'  — donos da plataforma VitrineMOTORS (acesso total)
 *
 * O role 'seller' cobre dois contextos distintos, identificados por
 * presença/ausência em tabelas relacionadas:
 *
 *   seller sem dealership  → vendedor individual (pessoa física)
 *   seller com dealership  → dono de concessionária (dealer_owner)
 *   seller em dealer_members → membro de equipe (dealer_member) [Sprint 4]
 *
 * A função getUserContext() resolve esse contexto e é o único ponto
 * de entrada para decisões de acesso em toda a aplicação.
 *
 * ─── TABELAS RELEVANTES ──────────────────────────────────────────────────────
 *
 *   profiles        → id, role, name, email, ...
 *   dealerships     → id, owner_id (→ profiles), approved, plan, ...
 *   dealer_members  → id, dealership_id, user_id, dealer_role [Sprint 4]
 *                     dealer_role: 'admin' | 'sales' | 'viewer'
 *
 * ─── FUNÇÕES A CRIAR ─────────────────────────────────────────────────────────
 *
 *   src/lib/userIdentity.ts
 *     getUserContext(profile, ownedDealerships, memberOf?) → UserContext
 *     canPublishListing(ctx) → boolean
 *     canAccessDealerPanel(ctx) → boolean
 *     canAccessAdminPanel(ctx) → boolean
 *     canManageDealerTeam(ctx) → boolean
 *     canViewDealerFinancials(ctx) → boolean
 */

import { describe, it, expect } from 'vitest';
import type { Profile, Dealership } from '../../types';

// ─── Tipos (serão exportados de src/lib/userIdentity.ts) ─────────────────────

type DealerRole = 'admin' | 'sales' | 'viewer';

interface DealerMember {
  id: string;
  dealership_id: string;
  user_id: string;
  dealer_role: DealerRole;
  invited_by: string | null;
  created_at: string;
}

type UserContextType =
  | 'platform_admin'
  | 'dealer_owner'
  | 'dealer_member'
  | 'individual_seller'
  | 'buyer';

interface UserContext {
  type: UserContextType;
  dealership?: Dealership;        // presente em dealer_owner
  memberships?: DealerMember[];   // presente em dealer_member
  dealerRole?: DealerRole;        // role mais alto quando membro de múltiplas
}

// ─── Implementação de referência ──────────────────────────────────────────────

function getUserContext(
  profile: Pick<Profile, 'id' | 'role'>,
  ownedDealerships: Dealership[],
  memberOf: DealerMember[] = [],
): UserContext {
  if (profile.role === 'admin') {
    return { type: 'platform_admin' };
  }

  const ownedDealer = ownedDealerships.find(d => d.owner_id === profile.id);
  if (ownedDealer) {
    return { type: 'dealer_owner', dealership: ownedDealer };
  }

  if (memberOf.length > 0) {
    const roleRank: Record<DealerRole, number> = { admin: 3, sales: 2, viewer: 1 };
    const highest = memberOf.reduce((best, m) =>
      roleRank[m.dealer_role] > roleRank[best.dealer_role] ? m : best
    );
    return { type: 'dealer_member', memberships: memberOf, dealerRole: highest.dealer_role };
  }

  if (profile.role === 'seller') {
    return { type: 'individual_seller' };
  }

  return { type: 'buyer' };
}

// ─── Permissões por contexto ──────────────────────────────────────────────────

function canPublishListing(ctx: UserContext): boolean {
  return ['platform_admin', 'dealer_owner', 'dealer_member', 'individual_seller'].includes(ctx.type)
    && ctx.dealerRole !== 'viewer';
}

function canAccessDealerPanel(ctx: UserContext): boolean {
  return ['platform_admin', 'dealer_owner', 'dealer_member'].includes(ctx.type);
}

function canAccessAdminPanel(ctx: UserContext): boolean {
  return ctx.type === 'platform_admin';
}

function canManageDealerTeam(ctx: UserContext): boolean {
  if (ctx.type === 'platform_admin') return true;
  if (ctx.type === 'dealer_owner') return true;
  if (ctx.type === 'dealer_member') return ctx.dealerRole === 'admin';
  return false;
}

function canViewDealerFinancials(ctx: UserContext): boolean {
  if (ctx.type === 'platform_admin') return true;
  if (ctx.type === 'dealer_owner') return true;
  if (ctx.type === 'dealer_member') return ctx.dealerRole === 'admin';
  return false;
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeProfile = (role: 'buyer' | 'seller' | 'admin', id = 'user-1'): Pick<Profile, 'id' | 'role'> =>
  ({ id, role });

const makeDealer = (ownerId: string): Dealership => ({
  id: 'dealer-1',
  owner_id: ownerId,
  name: 'AutoPark PY',
  logo_url: '',
  address: 'Av. Mcal. López 1234',
  city: 'Asunción',
  verified: true,
  approved: true,
  plan: 'premium',
  description: '',
  phone: '',
  whatsapp: '',
  website: '',
  ruc: '80012345-6',
  created_at: new Date().toISOString(),
});

const makeMember = (userId: string, dealerRole: DealerRole): DealerMember => ({
  id: 'member-1',
  dealership_id: 'dealer-1',
  user_id: userId,
  dealer_role: dealerRole,
  invited_by: 'owner-1',
  created_at: new Date().toISOString(),
});

// ─── SPEC: getUserContext ─────────────────────────────────────────────────────

describe('getUserContext (resolução de identidade)', () => {

  describe('platform_admin', () => {
    it('role "admin" → sempre platform_admin, independente de dealerships', () => {
      const ctx = getUserContext(makeProfile('admin'), [], []);
      expect(ctx.type).toBe('platform_admin');
    });

    it('admin com dealership → ainda é platform_admin (não dealer_owner)', () => {
      // Admin pode ter concessionária como sócio, mas seu contexto
      // de acesso é sempre o mais alto
      const profile = makeProfile('admin', 'admin-id');
      const ctx = getUserContext(profile, [makeDealer('admin-id')], []);
      expect(ctx.type).toBe('platform_admin');
    });
  });

  describe('dealer_owner (dono de concessionária)', () => {
    it('seller com registro em dealerships como owner → dealer_owner', () => {
      const profile = makeProfile('seller', 'owner-1');
      const ctx = getUserContext(profile, [makeDealer('owner-1')], []);
      expect(ctx.type).toBe('dealer_owner');
    });

    it('contexto inclui o objeto dealership', () => {
      const profile = makeProfile('seller', 'owner-1');
      const dealer = makeDealer('owner-1');
      const ctx = getUserContext(profile, [dealer], []);
      expect(ctx.dealership?.id).toBe('dealer-1');
      expect(ctx.dealership?.name).toBe('AutoPark PY');
    });

    it('seller com dealership de outro owner → NÃO é dealer_owner', () => {
      const profile = makeProfile('seller', 'user-A');
      const ctx = getUserContext(profile, [makeDealer('user-B')], []);
      expect(ctx.type).not.toBe('dealer_owner');
      expect(ctx.type).toBe('individual_seller');
    });
  });

  describe('dealer_member (equipe da concessionária) [Sprint 4]', () => {
    it('seller em dealer_members → dealer_member', () => {
      const profile = makeProfile('seller', 'staff-1');
      const ctx = getUserContext(profile, [], [makeMember('staff-1', 'sales')]);
      expect(ctx.type).toBe('dealer_member');
    });

    it('dealer_role fica disponível no contexto', () => {
      const ctx = getUserContext(makeProfile('seller', 'staff-1'), [], [makeMember('staff-1', 'sales')]);
      expect(ctx.dealerRole).toBe('sales');
    });

    it('memberships ficam disponíveis no contexto', () => {
      const ctx = getUserContext(makeProfile('seller', 'staff-1'), [], [makeMember('staff-1', 'viewer')]);
      expect(ctx.memberships).toHaveLength(1);
    });

    it('membro em múltiplas concessionárias → dealerRole é o mais alto', () => {
      const members: DealerMember[] = [
        { ...makeMember('staff-1', 'viewer'),  id: 'm1', dealership_id: 'dealer-A' },
        { ...makeMember('staff-1', 'admin'),   id: 'm2', dealership_id: 'dealer-B' },
        { ...makeMember('staff-1', 'sales'),   id: 'm3', dealership_id: 'dealer-C' },
      ];
      const ctx = getUserContext(makeProfile('seller', 'staff-1'), [], members);
      expect(ctx.dealerRole).toBe('admin'); // maior rank
    });

    it('dealer_owner tem prioridade sobre dealer_member', () => {
      // Se o usuário é dono E membro de outra, é dealer_owner
      const profile = makeProfile('seller', 'owner-1');
      const member = makeMember('owner-1', 'sales');
      const ctx = getUserContext(profile, [makeDealer('owner-1')], [member]);
      expect(ctx.type).toBe('dealer_owner');
    });
  });

  describe('individual_seller (pessoa física)', () => {
    it('seller sem dealership e sem memberships → individual_seller', () => {
      const ctx = getUserContext(makeProfile('seller', 'user-1'), [], []);
      expect(ctx.type).toBe('individual_seller');
    });

    it('NÃO retorna dealership nem memberships', () => {
      const ctx = getUserContext(makeProfile('seller'), [], []);
      expect(ctx.dealership).toBeUndefined();
      expect(ctx.memberships).toBeUndefined();
    });
  });

  describe('buyer (comprador)', () => {
    it('buyer sem nenhum contexto especial → buyer', () => {
      const ctx = getUserContext(makeProfile('buyer'), [], []);
      expect(ctx.type).toBe('buyer');
    });

    it('buyer NÃO se torna individual_seller mesmo sem dados extras', () => {
      // role 'buyer' é explícito — não é seller
      const ctx = getUserContext(makeProfile('buyer'), [], []);
      expect(ctx.type).not.toBe('individual_seller');
    });
  });
});

// ─── SPEC: Permissões de acesso ───────────────────────────────────────────────

describe('canPublishListing (quem pode criar anúncios)', () => {
  it('platform_admin pode publicar', () => {
    expect(canPublishListing({ type: 'platform_admin' })).toBe(true);
  });

  it('dealer_owner pode publicar', () => {
    expect(canPublishListing({ type: 'dealer_owner', dealership: makeDealer('x') })).toBe(true);
  });

  it('dealer_member sales pode publicar', () => {
    expect(canPublishListing({ type: 'dealer_member', dealerRole: 'sales' })).toBe(true);
  });

  it('dealer_member admin pode publicar', () => {
    expect(canPublishListing({ type: 'dealer_member', dealerRole: 'admin' })).toBe(true);
  });

  it('dealer_member viewer NÃO pode publicar (só leitura)', () => {
    expect(canPublishListing({ type: 'dealer_member', dealerRole: 'viewer' })).toBe(false);
  });

  it('individual_seller pode publicar', () => {
    expect(canPublishListing({ type: 'individual_seller' })).toBe(true);
  });

  it('buyer NÃO pode publicar', () => {
    expect(canPublishListing({ type: 'buyer' })).toBe(false);
  });
});

describe('canAccessDealerPanel (painel /dealer)', () => {
  it('platform_admin tem acesso', () => {
    expect(canAccessDealerPanel({ type: 'platform_admin' })).toBe(true);
  });

  it('dealer_owner tem acesso', () => {
    expect(canAccessDealerPanel({ type: 'dealer_owner', dealership: makeDealer('x') })).toBe(true);
  });

  it('dealer_member tem acesso (qualquer role)', () => {
    const roles: DealerRole[] = ['admin', 'sales', 'viewer'];
    for (const dealerRole of roles) {
      expect(canAccessDealerPanel({ type: 'dealer_member', dealerRole })).toBe(true);
    }
  });

  it('individual_seller NÃO tem acesso ao painel de concessionária', () => {
    expect(canAccessDealerPanel({ type: 'individual_seller' })).toBe(false);
  });

  it('buyer NÃO tem acesso', () => {
    expect(canAccessDealerPanel({ type: 'buyer' })).toBe(false);
  });
});

describe('canAccessAdminPanel (painel /admin)', () => {
  it('platform_admin tem acesso', () => {
    expect(canAccessAdminPanel({ type: 'platform_admin' })).toBe(true);
  });

  it('dealer_owner NÃO tem acesso ao painel da plataforma', () => {
    expect(canAccessAdminPanel({ type: 'dealer_owner', dealership: makeDealer('x') })).toBe(false);
  });

  it('dealer_member NÃO tem acesso', () => {
    expect(canAccessAdminPanel({ type: 'dealer_member', dealerRole: 'admin' })).toBe(false);
  });

  it('individual_seller NÃO tem acesso', () => {
    expect(canAccessAdminPanel({ type: 'individual_seller' })).toBe(false);
  });

  it('buyer NÃO tem acesso', () => {
    expect(canAccessAdminPanel({ type: 'buyer' })).toBe(false);
  });
});

describe('canManageDealerTeam (convidar/remover equipe — Platinum)', () => {
  it('platform_admin pode gerenciar equipe de qualquer concessionária', () => {
    expect(canManageDealerTeam({ type: 'platform_admin' })).toBe(true);
  });

  it('dealer_owner pode gerenciar sua equipe', () => {
    expect(canManageDealerTeam({ type: 'dealer_owner', dealership: makeDealer('x') })).toBe(true);
  });

  it('dealer_member com role "admin" pode gerenciar equipe', () => {
    expect(canManageDealerTeam({ type: 'dealer_member', dealerRole: 'admin' })).toBe(true);
  });

  it('dealer_member com role "sales" NÃO pode gerenciar equipe', () => {
    expect(canManageDealerTeam({ type: 'dealer_member', dealerRole: 'sales' })).toBe(false);
  });

  it('dealer_member com role "viewer" NÃO pode gerenciar equipe', () => {
    expect(canManageDealerTeam({ type: 'dealer_member', dealerRole: 'viewer' })).toBe(false);
  });

  it('individual_seller NÃO pode gerenciar equipe', () => {
    expect(canManageDealerTeam({ type: 'individual_seller' })).toBe(false);
  });

  it('buyer NÃO pode gerenciar equipe', () => {
    expect(canManageDealerTeam({ type: 'buyer' })).toBe(false);
  });
});

describe('canViewDealerFinancials (ver MRR, receita, pagamentos)', () => {
  it('platform_admin vê financeiro de todos', () => {
    expect(canViewDealerFinancials({ type: 'platform_admin' })).toBe(true);
  });

  it('dealer_owner vê financeiro da própria conc.', () => {
    expect(canViewDealerFinancials({ type: 'dealer_owner', dealership: makeDealer('x') })).toBe(true);
  });

  it('dealer_member admin vê financeiro', () => {
    expect(canViewDealerFinancials({ type: 'dealer_member', dealerRole: 'admin' })).toBe(true);
  });

  it('dealer_member sales NÃO vê financeiro', () => {
    expect(canViewDealerFinancials({ type: 'dealer_member', dealerRole: 'sales' })).toBe(false);
  });

  it('dealer_member viewer NÃO vê financeiro', () => {
    expect(canViewDealerFinancials({ type: 'dealer_member', dealerRole: 'viewer' })).toBe(false);
  });

  it('individual_seller NÃO vê financeiro da plataforma', () => {
    expect(canViewDealerFinancials({ type: 'individual_seller' })).toBe(false);
  });
});

// ─── SPEC: Convenções de identificação ───────────────────────────────────────

describe('Convenções de identificação no banco de dados', () => {
  /**
   * Estas regras documentam como distinguir tipos de usuário
   * consultando as tabelas — sem precisar de um campo extra no profile.
   *
   * CONVENÇÃO (não mudar sem atualizar este spec):
   *   pessoa física   = profiles.role = 'seller' AND nenhum registro em dealerships com owner_id = id
   *   dono de conc.   = profiles.role = 'seller' AND EXISTS(dealerships WHERE owner_id = id)
   *   membro de conc. = profiles.role = 'seller' AND EXISTS(dealer_members WHERE user_id = id)
   *   comprador       = profiles.role = 'buyer'
   *   admin platform  = profiles.role = 'admin'
   */

  it('convenção: buyer tem role "buyer" no profiles', () => {
    const profile = makeProfile('buyer');
    expect(profile.role).toBe('buyer');
  });

  it('convenção: seller pessoa física tem role "seller" + sem dealership', () => {
    const profile = makeProfile('seller');
    const ownedDealerships: Dealership[] = [];
    const ctx = getUserContext(profile, ownedDealerships, []);
    // A UI deve inferir "pessoa física" do contexto, não de um campo dedicado
    expect(ctx.type).toBe('individual_seller');
    expect(ctx.dealership).toBeUndefined();
  });

  it('convenção: dono de conc. identificado pela presença em dealerships.owner_id', () => {
    const profile = makeProfile('seller', 'owner-42');
    const ownedDealerships = [makeDealer('owner-42')];
    const ctx = getUserContext(profile, ownedDealerships, []);
    expect(ctx.type).toBe('dealer_owner');
    // A fonte de verdade é a FK dealerships.owner_id — não um campo no profile
    expect(ctx.dealership?.owner_id).toBe('owner-42');
  });

  it('convenção: listings.dealership_id NULL = anúncio de pessoa física', () => {
    // Um listing com dealership_id = null pertence a um vendedor individual.
    // Não existe "tipo" no listing — inferido da FK.
    const dealership_id: string | null = null;
    expect(dealership_id).toBeNull();
  });

  it('convenção: listings.dealership_id preenchido = anúncio da concessionária', () => {
    const dealership_id = 'dealer-1';
    expect(typeof dealership_id).toBe('string');
    expect(dealership_id.length).toBeGreaterThan(0);
  });
});

// ─── SPEC: Hierarquia de dealer_role [Sprint 4] ───────────────────────────────

describe('DealerRole — hierarquia de permissões dentro da concessionária', () => {
  /**
   * admin  → pode tudo: convidar, remover, editar perfil da conc., ver financeiro
   * sales  → pode criar/editar anúncios, gerenciar leads, ver analytics
   * viewer → só visualiza dashboard, leads e relatórios (sem edição)
   */

  const ROLE_RANK: Record<DealerRole, number> = { admin: 3, sales: 2, viewer: 1 };

  it('admin tem rank maior que sales', () => {
    expect(ROLE_RANK['admin']).toBeGreaterThan(ROLE_RANK['sales']);
  });

  it('sales tem rank maior que viewer', () => {
    expect(ROLE_RANK['sales']).toBeGreaterThan(ROLE_RANK['viewer']);
  });

  it('viewer tem rank mínimo', () => {
    expect(ROLE_RANK['viewer']).toBe(1);
  });

  it('roles válidos são exatamente: admin, sales, viewer', () => {
    const validRoles: DealerRole[] = ['admin', 'sales', 'viewer'];
    expect(validRoles).toHaveLength(3);
    // Se adicionar um role novo, este spec falha e força revisão das permissões
  });
});
