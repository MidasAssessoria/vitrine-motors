/**
 * SPEC: Exportação de leads para CSV
 *
 * Sprint 3 — Define o contrato de formato do arquivo CSV.
 * A função `formatLeadsForCsv` DEVE ser criada em src/lib/leadExport.ts
 *
 * Critérios:
 * - Cabeçalhos em espanhol (idioma do produto)
 * - Dados sensíveis (phone, email) incluídos pois é exportação interna do vendedor
 * - Datas em formato legível (dd/mm/aaaa)
 * - Preço em USD com 2 casas decimais
 * - Separador: vírgula, valores com aspas quando contêm vírgulas
 * - Encoding: UTF-8 com BOM para Excel abrir corretamente (Paraguai usa Excel)
 */

import { describe, it, expect } from 'vitest';
import type { Lead, LeadStatus, LeadTemperature, LeadSource } from '../../types';

// ─── Implementação de referência ─────────────────────────────────────────────
// DEVE ser movida para src/lib/leadExport.ts na Sprint 3

const CSV_HEADERS = [
  'Nombre',
  'Teléfono',
  'Email',
  'Vehículo',
  'Fuente',
  'Estado',
  'Temperatura',
  'Valor estimado (USD)',
  'Fecha de contacto',
  'Notas',
] as const;

const STATUS_LABELS: Record<LeadStatus, string> = {
  new:         'Nuevo',
  contacted:   'Contactado',
  negotiating: 'Negociando',
  test_drive:  'Test drive',
  sold:        'Vendido',
  lost:        'Perdido',
};

const TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  hot:  'Caliente',
  warm: 'Tibio',
  cold: 'Frío',
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  whatsapp: 'WhatsApp',
  phone:    'Teléfono',
  email:    'Email',
  form:     'Formulario',
};

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDatePY(isoDate: string): string {
  const d = new Date(isoDate);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatLeadsForCsv(leads: Lead[]): string {
  const BOM = '\uFEFF'; // UTF-8 BOM para Excel
  const headerRow = CSV_HEADERS.join(',');

  const rows = leads.map(lead => {
    const listingTitle = (lead.listing as { title?: string } | undefined)?.title ?? '';
    return [
      escapeCsvField(lead.buyer_name),
      escapeCsvField(lead.buyer_phone),
      escapeCsvField(lead.buyer_email ?? ''),
      escapeCsvField(listingTitle),
      SOURCE_LABELS[lead.source],
      STATUS_LABELS[lead.status],
      TEMPERATURE_LABELS[lead.temperature],
      lead.deal_value != null ? lead.deal_value.toFixed(2) : '',
      formatDatePY(lead.created_at),
      escapeCsvField(lead.notes ?? ''),
    ].join(',');
  });

  return BOM + [headerRow, ...rows].join('\n');
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: 'lead-1',
  listing_id: 'listing-1',
  dealer_id: null,
  seller_id: 'seller-1',
  buyer_name: 'Carlos García',
  buyer_phone: '+595981000000',
  buyer_email: 'carlos@example.com',
  source: 'form' as LeadSource,
  status: 'new' as LeadStatus,
  temperature: 'warm' as LeadTemperature,
  expected_close_date: null,
  deal_value: null,
  loss_reason: '',
  notes: '',
  created_at: '2026-03-15T10:00:00.000Z',
  updated_at: '2026-03-15T10:00:00.000Z',
  ...overrides,
});

// ─── SPEC: Estrutura do CSV ───────────────────────────────────────────────────

describe('formatLeadsForCsv (formato do arquivo)', () => {
  it('começa com BOM UTF-8 para compatibilidade com Excel', () => {
    const csv = formatLeadsForCsv([]);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
  });

  it('primeira linha é o cabeçalho em espanhol', () => {
    const csv = formatLeadsForCsv([]);
    const lines = csv.replace('\uFEFF', '').split('\n');
    expect(lines[0]).toContain('Nombre');
    expect(lines[0]).toContain('Teléfono');
    expect(lines[0]).toContain('Estado');
  });

  it('cabeçalho tem exatamente 10 colunas', () => {
    const csv = formatLeadsForCsv([]);
    const headerLine = csv.replace('\uFEFF', '').split('\n')[0];
    expect(headerLine.split(',').length).toBe(10);
  });

  it('sem leads → apenas cabeçalho (1 linha)', () => {
    const csv = formatLeadsForCsv([]);
    const lines = csv.replace('\uFEFF', '').split('\n').filter(Boolean);
    expect(lines).toHaveLength(1);
  });

  it('3 leads → cabeçalho + 3 linhas de dados', () => {
    const leads = [makeLead({ id: '1' }), makeLead({ id: '2' }), makeLead({ id: '3' })];
    const csv = formatLeadsForCsv(leads);
    const lines = csv.replace('\uFEFF', '').split('\n').filter(Boolean);
    expect(lines).toHaveLength(4); // 1 header + 3 data
  });
});

// ─── SPEC: Conteúdo dos campos ────────────────────────────────────────────────

describe('formatLeadsForCsv (conteúdo dos campos)', () => {
  it('inclui nome do comprador', () => {
    const lead = makeLead({ buyer_name: 'María López' });
    const csv = formatLeadsForCsv([lead]);
    expect(csv).toContain('María López');
  });

  it('inclui telefone do comprador', () => {
    const lead = makeLead({ buyer_phone: '+595981555000' });
    const csv = formatLeadsForCsv([lead]);
    expect(csv).toContain('+595981555000');
  });

  it('status traduzido para espanhol', () => {
    const lead = makeLead({ status: 'negotiating' });
    const csv = formatLeadsForCsv([lead]);
    expect(csv).toContain('Negociando');
    expect(csv).not.toContain('negotiating');
  });

  it('temperatura traduzida para espanhol', () => {
    const lead = makeLead({ temperature: 'hot' });
    const csv = formatLeadsForCsv([lead]);
    expect(csv).toContain('Caliente');
    expect(csv).not.toContain('hot');
  });

  it('fonte traduzida para espanhol', () => {
    const lead = makeLead({ source: 'whatsapp' });
    const csv = formatLeadsForCsv([lead]);
    expect(csv).toContain('WhatsApp');
    expect(csv).not.toContain('whatsapp');
  });

  it('data em formato dd/mm/aaaa (formato Paraguay/BR)', () => {
    const lead = makeLead({ created_at: '2026-03-15T10:00:00.000Z' });
    const csv = formatLeadsForCsv([lead]);
    expect(csv).toContain('15/03/2026');
  });

  it('deal_value com 2 casas decimais quando presente', () => {
    const lead = makeLead({ deal_value: 25000 });
    const csv = formatLeadsForCsv([lead]);
    expect(csv).toContain('25000.00');
  });

  it('deal_value vazio quando null', () => {
    const lead = makeLead({ deal_value: null });
    const csv = formatLeadsForCsv([lead]);
    // Linha de dados deve ter campo vazio para deal_value
    const lines = csv.replace('\uFEFF', '').split('\n');
    const dataLine = lines[1];
    // 8 vírgulas = 9 separadores = 10 campos, valor USD é penúltimo
    expect(dataLine.split(',').length).toBe(10);
  });
});

// ─── SPEC: Escaping de campos ─────────────────────────────────────────────────

describe('escapeCsvField (segurança de dados no CSV)', () => {
  it('campo sem vírgula ou aspas → sem aspas extras', () => {
    const csv = formatLeadsForCsv([makeLead({ buyer_name: 'João' })]);
    const dataLine = csv.replace('\uFEFF', '').split('\n')[1];
    expect(dataLine.startsWith('João')).toBe(true);
  });

  it('campo com vírgula → envolto em aspas duplas', () => {
    const csv = formatLeadsForCsv([makeLead({ notes: 'Interessado, vai pensar' })]);
    expect(csv).toContain('"Interessado, vai pensar"');
  });

  it('campo com aspas duplas → aspas escapadas ("")', () => {
    const csv = formatLeadsForCsv([makeLead({ notes: 'Disse: "vou comprar"' })]);
    expect(csv).toContain('"Disse: ""vou comprar"""');
  });

  it('notas com quebra de linha → envolto em aspas', () => {
    const csv = formatLeadsForCsv([makeLead({ notes: 'Linha 1\nLinha 2' })]);
    expect(csv).toContain('"Linha 1\nLinha 2"');
  });

  it('nome com acento não causa problema de encoding', () => {
    const lead = makeLead({ buyer_name: 'José Martínez Ñoño' });
    const csv = formatLeadsForCsv([lead]);
    expect(csv).toContain('José Martínez Ñoño');
  });
});

// ─── SPEC: Casos extremos ─────────────────────────────────────────────────────

describe('formatLeadsForCsv (casos extremos)', () => {
  it('lead sem email → campo vazio (sem crash)', () => {
    const lead = makeLead({ buyer_email: '' });
    expect(() => formatLeadsForCsv([lead])).not.toThrow();
  });

  it('lead sem notas → campo vazio (sem crash)', () => {
    const lead = makeLead({ notes: '' });
    expect(() => formatLeadsForCsv([lead])).not.toThrow();
  });

  it('lead sem listing vinculado → coluna vehículo vazia', () => {
    const lead = makeLead();
    delete (lead as Partial<Lead>).listing;
    const csv = formatLeadsForCsv([lead]);
    // Não deve crashar e deve ter 10 colunas
    const dataLine = csv.replace('\uFEFF', '').split('\n')[1];
    expect(dataLine.split(',').length).toBe(10);
  });

  it('100 leads → performance aceitável (< 100ms)', () => {
    const leads = Array.from({ length: 100 }, (_, i) => makeLead({ id: `lead-${i}` }));
    const start = performance.now();
    formatLeadsForCsv(leads);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
