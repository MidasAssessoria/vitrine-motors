/**
 * SPEC: Interações de lead (histórico de contatos)
 *
 * Sprint 3 — Define o contrato de validação e apresentação
 * do histórico de interações no CRM.
 *
 * A tabela `lead_interactions` já existe no banco.
 * Este spec define o que a UI deve aceitar e rejeitar.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import type { InteractionType, LeadInteraction } from '../../types';

// ─── Schema de validação (contrato de entrada) ───────────────────────────────
// Este schema DEVE ser criado em src/lib/validation.ts como `leadInteractionSchema`

const leadInteractionSchema = z.object({
  lead_id: z.string().uuid('ID do lead inválido'),

  type: z.enum(['call', 'whatsapp', 'email', 'note', 'visit'], {
    errorMap: () => ({ message: 'Tipo de interação inválido' }),
  }),

  content: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),

  outcome: z.string().max(500).optional(),

  next_action_date: z
    .string()
    .datetime({ message: 'Data inválida' })
    .nullable()
    .optional(),
});

type LeadInteractionInput = z.infer<typeof leadInteractionSchema>;

// ─── Helpers de apresentação ─────────────────────────────────────────────────
// Estas funções DEVEM ser criadas em src/lib/leadUtils.ts

const INTERACTION_LABELS: Record<InteractionType, string> = {
  call:     'Llamada',
  whatsapp: 'WhatsApp',
  email:    'Email',
  note:     'Nota interna',
  visit:    'Visita',
};

function getInteractionLabel(type: InteractionType): string {
  return INTERACTION_LABELS[type] ?? type;
}

function sortInteractionsByDate(interactions: LeadInteraction[]): LeadInteraction[] {
  return [...interactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function getLastInteractionSummary(interactions: LeadInteraction[]): string {
  if (interactions.length === 0) return 'Sin contacto previo';
  const sorted = sortInteractionsByDate(interactions);
  const last = sorted[0];
  const label = getInteractionLabel(last.type);
  return `Último contacto: ${label}`;
}

// ─── SPEC: Schema de validação ───────────────────────────────────────────────

describe('leadInteractionSchema (validação de entrada)', () => {
  const validInput: LeadInteractionInput = {
    lead_id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'call',
    content: 'Chamada realizada, cliente interessado.',
    outcome: 'Agendou visita para sexta',
    next_action_date: null,
  };

  it('aceita input válido completo', () => {
    const result = leadInteractionSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('aceita sem outcome (campo opcional)', () => {
    const { outcome, ...partial } = validInput;
    const result = leadInteractionSchema.safeParse(partial);
    expect(result.success).toBe(true);
  });

  it('aceita sem next_action_date (campo opcional)', () => {
    const { next_action_date, ...partial } = validInput;
    const result = leadInteractionSchema.safeParse(partial);
    expect(result.success).toBe(true);
  });

  it('rejeita content vazio', () => {
    const result = leadInteractionSchema.safeParse({ ...validInput, content: '' });
    expect(result.success).toBe(false);
  });

  it('rejeita content com menos de 3 caracteres', () => {
    const result = leadInteractionSchema.safeParse({ ...validInput, content: 'ok' });
    expect(result.success).toBe(false);
  });

  it('rejeita content com mais de 2000 caracteres', () => {
    const result = leadInteractionSchema.safeParse({ ...validInput, content: 'a'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('rejeita tipo inválido', () => {
    const result = leadInteractionSchema.safeParse({ ...validInput, type: 'sms' });
    expect(result.success).toBe(false);
  });

  it('aceita todos os tipos válidos', () => {
    const types: InteractionType[] = ['call', 'whatsapp', 'email', 'note', 'visit'];
    for (const type of types) {
      const result = leadInteractionSchema.safeParse({ ...validInput, type });
      expect(result.success, `type "${type}" deve ser aceito`).toBe(true);
    }
  });

  it('rejeita lead_id que não é UUID', () => {
    const result = leadInteractionSchema.safeParse({ ...validInput, lead_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('aceita next_action_date em formato ISO 8601', () => {
    const result = leadInteractionSchema.safeParse({
      ...validInput,
      next_action_date: new Date('2026-06-01T10:00:00.000Z').toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it('rejeita next_action_date em formato inválido', () => {
    const result = leadInteractionSchema.safeParse({
      ...validInput,
      next_action_date: '01/06/2026', // formato BR — inválido
    });
    expect(result.success).toBe(false);
  });
});

// ─── SPEC: Labels e apresentação ─────────────────────────────────────────────

describe('getInteractionLabel (exibição na UI)', () => {
  it('call → "Llamada"', () => {
    expect(getInteractionLabel('call')).toBe('Llamada');
  });

  it('whatsapp → "WhatsApp"', () => {
    expect(getInteractionLabel('whatsapp')).toBe('WhatsApp');
  });

  it('email → "Email"', () => {
    expect(getInteractionLabel('email')).toBe('Email');
  });

  it('note → "Nota interna"', () => {
    expect(getInteractionLabel('note')).toBe('Nota interna');
  });

  it('visit → "Visita"', () => {
    expect(getInteractionLabel('visit')).toBe('Visita');
  });
});

// ─── SPEC: Ordenação de histórico ────────────────────────────────────────────

describe('sortInteractionsByDate (mais recente primeiro)', () => {
  const makeInteraction = (id: string, daysAgo: number): LeadInteraction => ({
    id,
    lead_id: 'lead-1',
    type: 'note',
    outcome: '',
    next_action_date: null,
    content: 'teste',
    created_by: 'user-1',
    created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  });

  it('ordena do mais recente para o mais antigo', () => {
    const interactions = [
      makeInteraction('antigo', 5),
      makeInteraction('recente', 1),
      makeInteraction('medio', 3),
    ];
    const sorted = sortInteractionsByDate(interactions);
    expect(sorted[0].id).toBe('recente');
    expect(sorted[2].id).toBe('antigo');
  });

  it('não muta o array original', () => {
    const interactions = [
      makeInteraction('b', 2),
      makeInteraction('a', 1),
    ];
    const originalFirst = interactions[0].id;
    sortInteractionsByDate(interactions);
    expect(interactions[0].id).toBe(originalFirst); // sem mutação
  });

  it('array vazio retorna array vazio', () => {
    expect(sortInteractionsByDate([])).toHaveLength(0);
  });
});

// ─── SPEC: Resumo do último contato ──────────────────────────────────────────

describe('getLastInteractionSummary (exibido no card de lead)', () => {
  const makeInteraction = (type: InteractionType, daysAgo: number): LeadInteraction => ({
    id: 'i-1',
    lead_id: 'lead-1',
    type,
    outcome: '',
    next_action_date: null,
    content: 'teste',
    created_by: 'user-1',
    created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  });

  it('sem interações → "Sin contacto previo"', () => {
    expect(getLastInteractionSummary([])).toBe('Sin contacto previo');
  });

  it('com chamada → inclui "Llamada"', () => {
    const result = getLastInteractionSummary([makeInteraction('call', 1)]);
    expect(result).toContain('Llamada');
  });

  it('usa a interação mais recente, não a primeira', () => {
    const interactions = [
      makeInteraction('note', 5),    // mais antiga
      makeInteraction('visit', 1),   // mais recente
    ];
    const result = getLastInteractionSummary(interactions);
    expect(result).toContain('Visita');
    expect(result).not.toContain('Nota');
  });
});
