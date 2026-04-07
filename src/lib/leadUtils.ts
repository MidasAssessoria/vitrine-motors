/**
 * leadUtils.ts — Funções puras de lógica de CRM
 *
 * Contratos definidos em src/lib/__tests__/leads.spec.ts
 * Não fazem chamadas ao banco — apenas transformações de dados.
 */

import type { Lead, LeadStatus, LeadTemperature, LeadSource } from '../types';

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export type LeadOwner =
  | { type: 'dealer'; id: string }
  | { type: 'seller'; id: string };

// ─── Máquina de estados ───────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new:         ['contacted', 'lost'],
  contacted:   ['negotiating', 'lost'],
  negotiating: ['test_drive', 'sold', 'lost'],
  test_drive:  ['negotiating', 'sold', 'lost'],
  sold:        [],
  lost:        [],
};

/**
 * Retorna os estados para os quais um lead pode transitar a partir do status atual.
 * Estados terminais (sold, lost) retornam array vazio.
 */
export function getValidLeadTransitions(status: LeadStatus): LeadStatus[] {
  return VALID_TRANSITIONS[status] ?? [];
}

/**
 * Verifica se uma transição de status é válida.
 */
export function isValidTransition(from: LeadStatus, to: LeadStatus): boolean {
  return getValidLeadTransitions(from).includes(to);
}

// ─── Lead envelhecido ─────────────────────────────────────────────────────────

/**
 * Retorna true se o lead está "new" e não foi atendido dentro do threshold.
 * Só leads com status "new" podem ser considerados envelhecidos.
 *
 * @param thresholdHours Padrão 24h. Dealers com mais volume podem usar 48h.
 */
export function isLeadAged(
  lead: Pick<Lead, 'status' | 'created_at' | 'updated_at'>,
  thresholdHours = 24,
): boolean {
  if (lead.status !== 'new') return false;
  const lastActivity = new Date(lead.updated_at ?? lead.created_at).getTime();
  const hoursElapsed = (Date.now() - lastActivity) / (1000 * 60 * 60);
  return hoursElapsed >= thresholdHours;
}

/**
 * Horas sem atendimento desde a última atualização.
 */
export function hoursWithoutContact(lead: Pick<Lead, 'updated_at' | 'created_at'>): number {
  const lastActivity = new Date(lead.updated_at ?? lead.created_at).getTime();
  return (Date.now() - lastActivity) / (1000 * 60 * 60);
}

// ─── Atribuição de lead ───────────────────────────────────────────────────────

/**
 * Resolve a quem pertence o lead: ao dealer (concessionária) ou ao vendedor individual.
 * dealer_id tem prioridade quando presente.
 */
export function resolveLeadOwner(lead: Pick<Lead, 'dealer_id' | 'seller_id'>): LeadOwner {
  if (lead.dealer_id) {
    return { type: 'dealer', id: lead.dealer_id };
  }
  return { type: 'seller', id: lead.seller_id };
}

// ─── Temperatura automática ───────────────────────────────────────────────────

/**
 * Classifica a temperatura inicial de um lead com base no canal e tempo.
 *
 * Regras:
 *   - WhatsApp → sempre hot (intenção alta, canal imediato)
 *   - Qualquer canal < 2h → hot (acabou de entrar)
 *   - 2h – 24h → warm
 *   - > 24h → cold
 */
export function classifyLeadTemperature(
  lead: Pick<Lead, 'source' | 'created_at'>,
  now = new Date(),
): LeadTemperature {
  const hoursSinceCreation =
    (now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60);

  if ((lead.source as LeadSource) === 'whatsapp') return 'hot';
  if (hoursSinceCreation <= 2) return 'hot';
  if (hoursSinceCreation <= 24) return 'warm';
  return 'cold';
}

// ─── Helpers de apresentação ──────────────────────────────────────────────────

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new:         'Nuevo',
  contacted:   'Contactado',
  negotiating: 'Negociando',
  test_drive:  'Test Drive',
  sold:        'Vendido',
  lost:        'Perdido',
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  whatsapp: 'WhatsApp',
  phone:    'Teléfono',
  email:    'Email',
  form:     'Formulario',
};

export const LEAD_TEMP_LABELS: Record<LeadTemperature, string> = {
  hot:  'Caliente',
  warm: 'Tibio',
  cold: 'Frío',
};
