/**
 * userIdentity.ts — Fonte de verdade para identidade e permissões
 *
 * MODELO DE ROLES:
 *   profiles.role = 'buyer' | 'seller' | 'admin'
 *
 * O role 'seller' cobre três contextos distintos resolvidos por getUserContext():
 *   individual_seller → seller sem dealership
 *   dealer_owner      → seller com registro em dealerships (owner_id = profile.id)
 *   dealer_member     → seller em dealer_members [Sprint 4]
 *
 * CONVENÇÃO DE IDENTIFICAÇÃO (não adicionar campos redundantes no profile):
 *   pessoa física   = role 'seller' + ausência em dealerships como owner
 *   dono de conc.   = role 'seller' + EXISTS(dealerships WHERE owner_id = id)
 *   membro de conc. = role 'seller' + EXISTS(dealer_members WHERE user_id = id)
 */

import type { Profile, Dealership } from '../types';

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export type DealerRole = 'admin' | 'sales' | 'viewer';

export interface DealerMember {
  id: string;
  dealership_id: string;
  user_id: string;
  dealer_role: DealerRole;
  invited_by: string | null;
  created_at: string;
}

export type UserContextType =
  | 'platform_admin'
  | 'dealer_owner'
  | 'dealer_member'
  | 'individual_seller'
  | 'buyer';

export interface UserContext {
  type: UserContextType;
  dealership?: Dealership;
  memberships?: DealerMember[];
  /** Role mais alto quando membro de múltiplas concessionárias */
  dealerRole?: DealerRole;
}

// ─── Hierarquia de dealer_role ────────────────────────────────────────────────

const DEALER_ROLE_RANK: Record<DealerRole, number> = {
  admin:  3,
  sales:  2,
  viewer: 1,
};

// ─── Resolução de contexto ────────────────────────────────────────────────────

/**
 * Resolve o contexto de identidade do usuário.
 *
 * Deve ser chamada uma vez após o login e o resultado armazenado
 * no authStore ou em um hook. Não fazer chamada ao banco aqui —
 * os dados devem vir já carregados.
 */
export function getUserContext(
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
    const highest = memberOf.reduce((best, m) =>
      DEALER_ROLE_RANK[m.dealer_role] > DEALER_ROLE_RANK[best.dealer_role] ? m : best
    );
    return {
      type: 'dealer_member',
      memberships: memberOf,
      dealerRole: highest.dealer_role,
    };
  }

  if (profile.role === 'seller') {
    return { type: 'individual_seller' };
  }

  return { type: 'buyer' };
}

// ─── Permissões ───────────────────────────────────────────────────────────────

/** Pode criar e editar anúncios */
export function canPublishListing(ctx: UserContext): boolean {
  if (ctx.type === 'buyer') return false;
  if (ctx.type === 'dealer_member') return ctx.dealerRole !== 'viewer';
  return true;
}

/** Pode acessar o painel /dealer */
export function canAccessDealerPanel(ctx: UserContext): boolean {
  return ctx.type === 'platform_admin'
    || ctx.type === 'dealer_owner'
    || ctx.type === 'dealer_member';
}

/** Pode acessar o painel /admin (só donos da plataforma) */
export function canAccessAdminPanel(ctx: UserContext): boolean {
  return ctx.type === 'platform_admin';
}

/** Pode convidar/remover membros da equipe (Platinum) */
export function canManageDealerTeam(ctx: UserContext): boolean {
  if (ctx.type === 'platform_admin') return true;
  if (ctx.type === 'dealer_owner') return true;
  if (ctx.type === 'dealer_member') return ctx.dealerRole === 'admin';
  return false;
}

/** Pode ver financeiro da concessionária */
export function canViewDealerFinancials(ctx: UserContext): boolean {
  if (ctx.type === 'platform_admin') return true;
  if (ctx.type === 'dealer_owner') return true;
  if (ctx.type === 'dealer_member') return ctx.dealerRole === 'admin';
  return false;
}

/** Pode editar o perfil/dados da concessionária */
export function canEditDealerProfile(ctx: UserContext): boolean {
  if (ctx.type === 'platform_admin') return true;
  if (ctx.type === 'dealer_owner') return true;
  if (ctx.type === 'dealer_member') return ctx.dealerRole === 'admin';
  return false;
}
