/**
 * inspection.spec.ts
 *
 * Especificação do ciclo de inspeção de veículos.
 *
 * Ciclo completo:
 *   Seller: none → pending  (requestInspection)
 *   Admin:  pending → approved | rejected  (updateInspectionStatus — Sprint 5)
 *
 * Regras de negócio:
 * - Só anúncios com status 'active' podem solicitar inspeção
 * - Só anúncios com inspection_status 'none' podem solicitar
 * - Aprovação eleva o quality_score (verificado via computeQualityScore)
 */

import { describe, it, expect } from 'vitest';
import type { InspectionStatus } from '../../types';

// ─── Máquina de transições de inspeção ───────────────────────────────────────

type ListingStatus = 'pending' | 'active' | 'paused' | 'rejected';

interface InspectionContext {
  listingStatus: ListingStatus;
  inspectionStatus: InspectionStatus;
}

function canRequestInspection(ctx: InspectionContext): boolean {
  return ctx.listingStatus === 'active' && ctx.inspectionStatus === 'none';
}

function getValidInspectionTransitions(
  current: InspectionStatus,
  actor: 'seller' | 'admin'
): InspectionStatus[] {
  if (actor === 'seller') {
    return current === 'none' ? ['pending'] : [];
  }
  // admin
  if (current === 'pending') return ['approved', 'rejected'];
  return [];
}

// ─── Impacto no quality_score ─────────────────────────────────────────────────

function inspectionBonus(status: InspectionStatus): number {
  return status === 'approved' ? 20 : 0;
}

// ─── Testes ──────────────────────────────────────────────────────────────────

describe('canRequestInspection (seller)', () => {
  it('permite solicitar quando anúncio está active e inspection none', () => {
    expect(canRequestInspection({ listingStatus: 'active', inspectionStatus: 'none' })).toBe(true);
  });

  it('bloqueia se anúncio está pending (aguardando aprovação)', () => {
    expect(canRequestInspection({ listingStatus: 'pending', inspectionStatus: 'none' })).toBe(false);
  });

  it('bloqueia se anúncio está paused', () => {
    expect(canRequestInspection({ listingStatus: 'paused', inspectionStatus: 'none' })).toBe(false);
  });

  it('bloqueia se anúncio está rejected', () => {
    expect(canRequestInspection({ listingStatus: 'rejected', inspectionStatus: 'none' })).toBe(false);
  });

  it('bloqueia se inspeção já está pending (não re-solicitar)', () => {
    expect(canRequestInspection({ listingStatus: 'active', inspectionStatus: 'pending' })).toBe(false);
  });

  it('bloqueia se inspeção já foi approved', () => {
    expect(canRequestInspection({ listingStatus: 'active', inspectionStatus: 'approved' })).toBe(false);
  });

  it('bloqueia se inspeção foi rejected (fluxo de re-solicitação não implementado)', () => {
    expect(canRequestInspection({ listingStatus: 'active', inspectionStatus: 'rejected' })).toBe(false);
  });
});

describe('getValidInspectionTransitions', () => {
  describe('seller', () => {
    it('none → [pending] é a única transição disponível para o seller', () => {
      expect(getValidInspectionTransitions('none', 'seller')).toEqual(['pending']);
    });

    it('seller não pode transicionar de pending', () => {
      expect(getValidInspectionTransitions('pending', 'seller')).toEqual([]);
    });

    it('seller não pode transicionar de approved', () => {
      expect(getValidInspectionTransitions('approved', 'seller')).toEqual([]);
    });

    it('seller não pode transicionar de rejected', () => {
      expect(getValidInspectionTransitions('rejected', 'seller')).toEqual([]);
    });
  });

  describe('admin', () => {
    it('pending → [approved, rejected] disponível para admin', () => {
      const transitions = getValidInspectionTransitions('pending', 'admin');
      expect(transitions).toContain('approved');
      expect(transitions).toContain('rejected');
    });

    it('admin não pode transicionar de none (precisa de solicitação do seller)', () => {
      expect(getValidInspectionTransitions('none', 'admin')).toEqual([]);
    });

    it('admin não pode transicionar de approved (estado terminal)', () => {
      expect(getValidInspectionTransitions('approved', 'admin')).toEqual([]);
    });

    it('admin não pode transicionar de rejected (estado terminal)', () => {
      expect(getValidInspectionTransitions('rejected', 'admin')).toEqual([]);
    });
  });
});

describe('inspectionBonus (impacto no quality_score)', () => {
  it('approved adiciona 20 pontos ao quality_score', () => {
    expect(inspectionBonus('approved')).toBe(20);
  });

  it('none não adiciona pontos', () => {
    expect(inspectionBonus('none')).toBe(0);
  });

  it('pending não adiciona pontos (ainda não confirmado)', () => {
    expect(inspectionBonus('pending')).toBe(0);
  });

  it('rejected não adiciona pontos', () => {
    expect(inspectionBonus('rejected')).toBe(0);
  });
});

describe('estados terminais de inspeção', () => {
  const terminalStates: InspectionStatus[] = ['approved', 'rejected'];
  const nonTerminalStates: InspectionStatus[] = ['none', 'pending'];

  it.each(terminalStates)('%s é estado terminal — nenhum ator pode transicionar', (status) => {
    expect(getValidInspectionTransitions(status, 'seller')).toEqual([]);
    expect(getValidInspectionTransitions(status, 'admin')).toEqual([]);
  });

  it.each(nonTerminalStates)('%s não é estado terminal', (status) => {
    const sellerTransitions = getValidInspectionTransitions(status, 'seller');
    const adminTransitions = getValidInspectionTransitions(status, 'admin');
    const hasAnyTransition = sellerTransitions.length > 0 || adminTransitions.length > 0;
    expect(hasAnyTransition).toBe(true);
  });
});
