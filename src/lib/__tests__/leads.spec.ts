/**
 * SPEC: Lógica de negócio de leads
 *
 * Sprint 3 — Define os contratos das funções puras de CRM antes da implementação.
 * Cada describe é um requisito de produto. Cada it é uma regra.
 *
 * Funções que AINDA NÃO EXISTEM (serão criadas em Sprint 3):
 *   - isLeadAged(lead, thresholdHours)
 *   - getValidLeadTransitions(status)
 *   - resolveLeadOwner(lead)
 *   - classifyLeadTemperature(lead)
 */

import { describe, it, expect } from 'vitest';
import type { Lead, LeadStatus, LeadTemperature, LeadSource } from '../../types';

// ─── Tipos locais para specs ──────────────────────────────────────────────────

type LeadOwner =
  | { type: 'dealer'; id: string }
  | { type: 'seller'; id: string };

// ─── Implementações de referência (definem o contrato) ───────────────────────
// Essas funções DEVEM ser extraídas para src/lib/leadUtils.ts na Sprint 3.
// Os specs passam quando a implementação real for importada no lugar dessas.

function isLeadAged(lead: Pick<Lead, 'status' | 'created_at' | 'updated_at'>, thresholdHours = 24): boolean {
  if (lead.status !== 'new') return false;
  const lastActivity = new Date(lead.updated_at ?? lead.created_at).getTime();
  const hoursElapsed = (Date.now() - lastActivity) / (1000 * 60 * 60);
  return hoursElapsed >= thresholdHours;
}

function getValidLeadTransitions(status: LeadStatus): LeadStatus[] {
  const transitions: Record<LeadStatus, LeadStatus[]> = {
    new:         ['contacted', 'lost'],
    contacted:   ['negotiating', 'lost'],
    negotiating: ['test_drive', 'sold', 'lost'],
    test_drive:  ['negotiating', 'sold', 'lost'],
    sold:        [], // terminal — sem transições
    lost:        [], // terminal — sem transições
  };
  return transitions[status] ?? [];
}

function resolveLeadOwner(lead: Pick<Lead, 'dealer_id' | 'seller_id'>): LeadOwner {
  if (lead.dealer_id) {
    return { type: 'dealer', id: lead.dealer_id };
  }
  return { type: 'seller', id: lead.seller_id };
}

function classifyLeadTemperature(
  lead: Pick<Lead, 'source' | 'created_at'>,
  now = new Date()
): LeadTemperature {
  const hoursSinceCreation = (now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60);

  if (lead.source === 'whatsapp') return 'hot';
  if (hoursSinceCreation <= 2) return 'hot';
  if (hoursSinceCreation <= 24) return 'warm';
  return 'cold';
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: 'lead-1',
  listing_id: 'listing-1',
  dealer_id: null,
  seller_id: 'seller-1',
  buyer_name: 'Carlos',
  buyer_phone: '+595981000000',
  buyer_email: '',
  source: 'form' as LeadSource,
  status: 'new' as LeadStatus,
  temperature: 'warm' as LeadTemperature,
  expected_close_date: null,
  deal_value: null,
  loss_reason: '',
  notes: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const hoursAgo = (h: number): string =>
  new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

// ─── SPEC: Lead envelhecido ───────────────────────────────────────────────────

describe('isLeadAged (lead sem atendimento)', () => {
  it('lead "new" com mais de 24h é considerado envelhecido', () => {
    const lead = makeLead({ status: 'new', created_at: hoursAgo(25), updated_at: hoursAgo(25) });
    expect(isLeadAged(lead, 24)).toBe(true);
  });

  it('lead "new" com menos de 24h NÃO é envelhecido', () => {
    const lead = makeLead({ status: 'new', created_at: hoursAgo(12), updated_at: hoursAgo(12) });
    expect(isLeadAged(lead, 24)).toBe(false);
  });

  it('lead "new" exatamente no limiar (24h) é envelhecido', () => {
    const lead = makeLead({ status: 'new', created_at: hoursAgo(24), updated_at: hoursAgo(24) });
    expect(isLeadAged(lead, 24)).toBe(true);
  });

  it('lead "contacted" NÃO é envelhecido mesmo com 48h', () => {
    // Só "new" pode ser envelhecido — o vendedor já atendeu
    const lead = makeLead({ status: 'contacted', created_at: hoursAgo(48), updated_at: hoursAgo(48) });
    expect(isLeadAged(lead, 24)).toBe(false);
  });

  it('lead "lost" não é considerado envelhecido (já encerrado)', () => {
    const lead = makeLead({ status: 'lost', created_at: hoursAgo(100), updated_at: hoursAgo(100) });
    expect(isLeadAged(lead, 24)).toBe(false);
  });

  it('threshold customizável — 48h para dealers com mais volume', () => {
    const lead = makeLead({ status: 'new', created_at: hoursAgo(30), updated_at: hoursAgo(30) });
    expect(isLeadAged(lead, 48)).toBe(false); // 30h < 48h → não envelhecido
    expect(isLeadAged(lead, 24)).toBe(true);  // 30h > 24h → envelhecido
  });
});

// ─── SPEC: Transições de status ──────────────────────────────────────────────

describe('getValidLeadTransitions (máquina de estados do CRM)', () => {
  it('"new" pode ir para "contacted" ou "lost"', () => {
    const transitions = getValidLeadTransitions('new');
    expect(transitions).toContain('contacted');
    expect(transitions).toContain('lost');
  });

  it('"new" NÃO pode ir direto para "sold"', () => {
    const transitions = getValidLeadTransitions('new');
    expect(transitions).not.toContain('sold');
  });

  it('"new" NÃO pode ir direto para "negotiating"', () => {
    const transitions = getValidLeadTransitions('new');
    expect(transitions).not.toContain('negotiating');
  });

  it('"contacted" pode ir para "negotiating" ou "lost"', () => {
    const transitions = getValidLeadTransitions('contacted');
    expect(transitions).toContain('negotiating');
    expect(transitions).toContain('lost');
  });

  it('"negotiating" pode ir para "test_drive", "sold" ou "lost"', () => {
    const transitions = getValidLeadTransitions('negotiating');
    expect(transitions).toContain('test_drive');
    expect(transitions).toContain('sold');
    expect(transitions).toContain('lost');
  });

  it('"test_drive" pode voltar para "negotiating" (negociação continua)', () => {
    const transitions = getValidLeadTransitions('test_drive');
    expect(transitions).toContain('negotiating');
  });

  it('"sold" é estado terminal — sem transições', () => {
    expect(getValidLeadTransitions('sold')).toHaveLength(0);
  });

  it('"lost" é estado terminal — sem transições', () => {
    expect(getValidLeadTransitions('lost')).toHaveLength(0);
  });
});

// ─── SPEC: Atribuição de lead (seller vs dealer) ──────────────────────────────

describe('resolveLeadOwner (atribuição de responsabilidade)', () => {
  it('lead com dealer_id → pertence ao dealer', () => {
    const lead = makeLead({ dealer_id: 'dealer-1', seller_id: 'seller-1' });
    const owner = resolveLeadOwner(lead);
    expect(owner.type).toBe('dealer');
    expect(owner.id).toBe('dealer-1');
  });

  it('lead SEM dealer_id → pertence ao vendedor individual', () => {
    const lead = makeLead({ dealer_id: null, seller_id: 'seller-1' });
    const owner = resolveLeadOwner(lead);
    expect(owner.type).toBe('seller');
    expect(owner.id).toBe('seller-1');
  });

  it('dealer_id vence seller_id — dealer tem prioridade', () => {
    const lead = makeLead({ dealer_id: 'dealer-99', seller_id: 'seller-99' });
    const owner = resolveLeadOwner(lead);
    expect(owner.type).toBe('dealer');
    expect(owner.id).toBe('dealer-99');
    expect(owner.id).not.toBe('seller-99');
  });

  it('owner sempre retorna um id não-vazio', () => {
    const lead = makeLead({ dealer_id: null, seller_id: 'seller-abc' });
    const owner = resolveLeadOwner(lead);
    expect(owner.id.length).toBeGreaterThan(0);
  });
});

// ─── SPEC: Classificação automática de temperatura ───────────────────────────

describe('classifyLeadTemperature (temperatura inicial do lead)', () => {
  it('WhatsApp sempre começa como "hot" (intenção alta)', () => {
    const lead = makeLead({ source: 'whatsapp', created_at: hoursAgo(0) });
    expect(classifyLeadTemperature(lead)).toBe('hot');
  });

  it('WhatsApp com 48h ainda é "hot" (canal, não tempo)', () => {
    const lead = makeLead({ source: 'whatsapp', created_at: hoursAgo(48) });
    expect(classifyLeadTemperature(lead)).toBe('hot');
  });

  it('form com menos de 2h → "hot" (acabou de entrar)', () => {
    const lead = makeLead({ source: 'form', created_at: hoursAgo(1) });
    expect(classifyLeadTemperature(lead)).toBe('hot');
  });

  it('form com 2-24h → "warm"', () => {
    const lead = makeLead({ source: 'form', created_at: hoursAgo(12) });
    expect(classifyLeadTemperature(lead)).toBe('warm');
  });

  it('form com mais de 24h → "cold"', () => {
    const lead = makeLead({ source: 'form', created_at: hoursAgo(36) });
    expect(classifyLeadTemperature(lead)).toBe('cold');
  });

  it('phone com menos de 2h → "hot"', () => {
    const lead = makeLead({ source: 'phone', created_at: hoursAgo(0.5) });
    expect(classifyLeadTemperature(lead)).toBe('hot');
  });
});
