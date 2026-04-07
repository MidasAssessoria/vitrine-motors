/**
 * leadExport.ts — Exportação de leads para CSV
 *
 * Contrato definido em src/lib/__tests__/leadExport.spec.ts
 * BOM UTF-8 incluído para compatibilidade com Excel (mercado PY/BR).
 */

import type { Lead, LeadStatus, LeadTemperature, LeadSource } from '../types';
import { LEAD_STATUS_LABELS, LEAD_TEMP_LABELS, LEAD_SOURCE_LABELS } from './leadUtils';

// ─── Cabeçalhos ───────────────────────────────────────────────────────────────

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

// ─── Helpers internos ─────────────────────────────────────────────────────────

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

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Converte uma lista de leads para CSV em formato string.
 * Inclui BOM UTF-8 para que o Excel abra corretamente sem configuração extra.
 */
export function formatLeadsForCsv(leads: Lead[]): string {
  const BOM = '\uFEFF';
  const headerRow = CSV_HEADERS.join(',');

  const rows = leads.map((lead) => {
    const listingTitle = (lead.listing as { title?: string } | undefined)?.title ?? '';
    return [
      escapeCsvField(lead.buyer_name),
      escapeCsvField(lead.buyer_phone),
      escapeCsvField(lead.buyer_email ?? ''),
      escapeCsvField(listingTitle),
      LEAD_SOURCE_LABELS[lead.source as LeadSource] ?? lead.source,
      LEAD_STATUS_LABELS[lead.status as LeadStatus] ?? lead.status,
      LEAD_TEMP_LABELS[lead.temperature as LeadTemperature] ?? lead.temperature,
      lead.deal_value != null ? lead.deal_value.toFixed(2) : '',
      formatDatePY(lead.created_at),
      escapeCsvField(lead.notes ?? ''),
    ].join(',');
  });

  return BOM + [headerRow, ...rows].join('\n');
}

/**
 * Dispara o download do CSV no browser.
 * Gera um nome de arquivo com a data atual no formato YYYY-MM-DD.
 */
export function downloadLeadsCsv(leads: Lead[], filename?: string): void {
  const csv = formatLeadsForCsv(leads);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const today = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `leads-vitrinemotors-${today}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}
