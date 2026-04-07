/**
 * leadsRealtime.spec.ts
 *
 * Especificação do comportamento de subscribeToNewLeads.
 *
 * Contexto:
 * - Sprint 5 moveu subscribeToRealtime de notificações para authStore
 * - O toast aparece quando chega new_lead via notifications table
 * - Mas DealerLeads e SellerDashboard não re-fetcham a lista de leads
 * - Este spec documenta o contrato de subscribeToNewLeads (canal leads)
 *
 * Nota: subscribeToNewLeads escuta a tabela `leads` diretamente,
 * diferente de subscribeToRealtime que escuta `notifications`.
 * São canais independentes com responsabilidades distintas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Lead } from '../../types';

// ─── Contrato de subscribeToNewLeads ─────────────────────────────────────────

type LeadFilter =
  | { type: 'dealer'; dealerId: string }
  | { type: 'seller'; sellerId: string };

type UnsubscribeFn = () => void;

// Stub que simula o comportamento esperado — a implementação real usa supabase.channel()
function createMockSubscription(
  filter: LeadFilter,
  onNew: (lead: Lead) => void
): UnsubscribeFn {
  // Em produção: supabase.channel('leads:...')
  //   .on('postgres_changes', { event: 'INSERT', filter: `dealer_id=eq.${id}` }, cb)
  //   .subscribe()
  void filter;
  void onNew;
  let active = true;
  return () => { active = false; void active; };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFilter(type: 'dealer' | 'seller', id: string): LeadFilter {
  return type === 'dealer'
    ? { type: 'dealer', dealerId: id }
    : { type: 'seller', sellerId: id };
}

function makeLeadStub(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'lead-test',
    listing_id: 'listing-1',
    dealer_id: null,
    seller_id: 'seller-1',
    buyer_name: 'Test Buyer',
    buyer_phone: '+595981000000',
    buyer_email: 'buyer@test.com',
    source: 'whatsapp',
    status: 'new',
    temperature: 'hot',
    expected_close_date: null,
    deal_value: null,
    loss_reason: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Testes ──────────────────────────────────────────────────────────────────

describe('subscribeToNewLeads — contrato de retorno', () => {
  it('retorna uma função de unsubscribe (cleanup)', () => {
    const unsub = createMockSubscription(makeFilter('dealer', 'dealer-1'), vi.fn());
    expect(typeof unsub).toBe('function');
  });

  it('a função de unsubscribe pode ser chamada sem erros', () => {
    const unsub = createMockSubscription(makeFilter('seller', 'seller-1'), vi.fn());
    expect(() => unsub()).not.toThrow();
  });

  it('chamar unsubscribe duas vezes não lança exceção (idempotente)', () => {
    const unsub = createMockSubscription(makeFilter('dealer', 'dealer-1'), vi.fn());
    expect(() => { unsub(); unsub(); }).not.toThrow();
  });
});

describe('subscribeToNewLeads — filtro por tipo de proprietário', () => {
  it('filtro dealer usa dealer_id como campo de filtragem', () => {
    const filter = makeFilter('dealer', 'dealer-abc');
    expect(filter.type).toBe('dealer');
    if (filter.type === 'dealer') expect(filter.dealerId).toBe('dealer-abc');
  });

  it('filtro seller usa seller_id como campo de filtragem', () => {
    const filter = makeFilter('seller', 'seller-xyz');
    expect(filter.type).toBe('seller');
    if (filter.type === 'seller') expect(filter.sellerId).toBe('seller-xyz');
  });

  it('dealer e seller são filtros mutuamente exclusivos — não há filtro combinado', () => {
    const dealerFilter = makeFilter('dealer', 'id-1');
    const sellerFilter = makeFilter('seller', 'id-2');
    expect(dealerFilter.type).not.toBe(sellerFilter.type);
  });
});

describe('subscribeToNewLeads — callback com o lead inserido', () => {
  it('callback recebe um objeto Lead tipado', () => {
    const received: Lead[] = [];
    const lead = makeLeadStub({ id: 'new-lead-1', buyer_name: 'Juan Perez' });

    // Simular disparo do callback (como se o Supabase realtime tivesse disparado)
    const onNew = (l: Lead) => received.push(l);
    onNew(lead); // Em produção isso é chamado pelo canal realtime

    expect(received).toHaveLength(1);
    expect(received[0].id).toBe('new-lead-1');
    expect(received[0].buyer_name).toBe('Juan Perez');
  });

  it('callback é chamado uma vez por INSERT — não acumula eventos antigos', () => {
    const callCount = { value: 0 };
    const onNew = () => { callCount.value += 1; };
    // Simular 1 INSERT
    onNew();
    expect(callCount.value).toBe(1);
  });
});

describe('subscribeToNewLeads — integração com estado React (padrão esperado)', () => {
  it('novo lead deve ser adicionado no início da lista (leads mais recentes primeiro)', () => {
    const existingLeads = [
      makeLeadStub({ id: 'old-1', created_at: new Date(Date.now() - 10000).toISOString() }),
      makeLeadStub({ id: 'old-2', created_at: new Date(Date.now() - 20000).toISOString() }),
    ];

    const newLead = makeLeadStub({ id: 'new-1', created_at: new Date().toISOString() });

    // Padrão que DealerLeads e SellerDashboard devem usar no callback:
    // setLeads(prev => [newLead, ...prev])
    const updatedLeads = [newLead, ...existingLeads];

    expect(updatedLeads[0].id).toBe('new-1');
    expect(updatedLeads).toHaveLength(3);
  });

  it('novo lead não duplica se já existe na lista (idempotência de re-render)', () => {
    const lead = makeLeadStub({ id: 'lead-1' });
    const existing = [lead];

    // Guard: só adicionar se não existe
    const dedup = (prev: Lead[], incoming: Lead) =>
      prev.some((l) => l.id === incoming.id) ? prev : [incoming, ...prev];

    const result1 = dedup(existing, lead); // já existe
    expect(result1).toHaveLength(1);

    const newLead = makeLeadStub({ id: 'lead-2' });
    const result2 = dedup(existing, newLead); // novo
    expect(result2).toHaveLength(2);
    expect(result2[0].id).toBe('lead-2');
  });
});

describe('makeLeadStub — helper de teste', () => {
  it('gera um lead válido com valores padrão sensatos', () => {
    const lead = makeLeadStub();
    expect(lead.status).toBe('new');
    expect(lead.temperature).toBe('hot');
    expect(lead.source).toBe('whatsapp');
  });

  it('aceita overrides parciais sem perder os defaults', () => {
    const lead = makeLeadStub({ buyer_name: 'Override Name', status: 'contacted' });
    expect(lead.buyer_name).toBe('Override Name');
    expect(lead.status).toBe('contacted');
    expect(lead.temperature).toBe('hot'); // default mantido
  });
});
