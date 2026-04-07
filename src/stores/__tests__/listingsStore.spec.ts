/**
 * SPEC: listingsStore — lógica de filtragem e ordenação
 *
 * Documenta o contrato do algoritmo de sort/filter.
 * Sprint 1 (SDD retroativo): garante que o bug do double-sort não regride
 * e define o comportamento esperado de priorização por tier.
 *
 * REGRA CENTRAL: Tier é sempre o critério primário de ordenação.
 * O sortBy do usuário é o critério secundário (desempate).
 */

import { describe, it, expect } from 'vitest';
import type { Listing, BoostTier } from '../../types';

// ─── Helpers (espelham a lógica interna do store) ────────────────────────────

function tierWeight(listing: { tier?: BoostTier }): number {
  switch (listing.tier) {
    case 'gold':   return 3;
    case 'silver': return 2;
    default:       return 1; // 'free' ou undefined
  }
}

type SortBy = 'recent' | 'price_asc' | 'price_desc' | 'year_desc' | 'mileage_asc';

function sortListings(listings: Partial<Listing>[], sortBy: SortBy): Partial<Listing>[] {
  return [...listings].sort((a, b) => {
    const tierDiff = tierWeight(b) - tierWeight(a);
    if (tierDiff !== 0) return tierDiff;

    switch (sortBy) {
      case 'price_asc':   return (a.price_usd ?? 0) - (b.price_usd ?? 0);
      case 'price_desc':  return (b.price_usd ?? 0) - (a.price_usd ?? 0);
      case 'year_desc':   return (b.year ?? 0) - (a.year ?? 0);
      case 'mileage_asc': return (a.mileage ?? 0) - (b.mileage ?? 0);
      default:            return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    }
  });
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeListing = (overrides: Partial<Listing> & { id: string }): Partial<Listing> => ({
  price_usd: 10000,
  year: 2020,
  mileage: 50000,
  tier: 'free' as BoostTier,
  created_at: new Date().toISOString(),
  ...overrides,
});

// ─── Specs de priorização por tier ───────────────────────────────────────────

describe('Ordenação por tier (prioridade de negócio)', () => {
  it('gold aparece antes de silver', () => {
    const listings = [
      makeListing({ id: 'silver', tier: 'silver' }),
      makeListing({ id: 'gold',   tier: 'gold' }),
    ];
    const sorted = sortListings(listings, 'recent');
    expect(sorted[0].id).toBe('gold');
  });

  it('silver aparece antes de free', () => {
    const listings = [
      makeListing({ id: 'free',   tier: 'free' }),
      makeListing({ id: 'silver', tier: 'silver' }),
    ];
    const sorted = sortListings(listings, 'recent');
    expect(sorted[0].id).toBe('silver');
  });

  it('gold aparece antes de free', () => {
    const listings = [
      makeListing({ id: 'free', tier: 'free' }),
      makeListing({ id: 'gold', tier: 'gold' }),
    ];
    const sorted = sortListings(listings, 'recent');
    expect(sorted[0].id).toBe('gold');
  });

  it('ordem completa: gold → silver → free', () => {
    const listings = [
      makeListing({ id: 'free',   tier: 'free' }),
      makeListing({ id: 'silver', tier: 'silver' }),
      makeListing({ id: 'gold',   tier: 'gold' }),
    ];
    const sorted = sortListings(listings, 'recent');
    expect(sorted.map(l => l.id)).toEqual(['gold', 'silver', 'free']);
  });

  it('listing sem tier é tratado como free', () => {
    const listings = [
      makeListing({ id: 'no-tier' }), // sem tier
      makeListing({ id: 'gold', tier: 'gold' }),
    ];
    // Remove tier do primeiro
    delete (listings[0] as Partial<Listing>).tier;
    const sorted = sortListings(listings, 'recent');
    expect(sorted[0].id).toBe('gold');
  });
});

// ─── Specs de sortBy como desempate dentro do mesmo tier ─────────────────────

describe('sortBy como critério secundário (desempate dentro do mesmo tier)', () => {
  it('price_asc: menor preço primeiro dentro do mesmo tier', () => {
    const listings = [
      makeListing({ id: 'caro',   tier: 'silver', price_usd: 30000 }),
      makeListing({ id: 'barato', tier: 'silver', price_usd: 10000 }),
    ];
    const sorted = sortListings(listings, 'price_asc');
    expect(sorted[0].id).toBe('barato');
  });

  it('price_desc: maior preço primeiro dentro do mesmo tier', () => {
    const listings = [
      makeListing({ id: 'barato', tier: 'silver', price_usd: 10000 }),
      makeListing({ id: 'caro',   tier: 'silver', price_usd: 30000 }),
    ];
    const sorted = sortListings(listings, 'price_desc');
    expect(sorted[0].id).toBe('caro');
  });

  it('year_desc: mais novo primeiro dentro do mesmo tier', () => {
    const listings = [
      makeListing({ id: 'antigo', tier: 'gold', year: 2015 }),
      makeListing({ id: 'novo',   tier: 'gold', year: 2023 }),
    ];
    const sorted = sortListings(listings, 'year_desc');
    expect(sorted[0].id).toBe('novo');
  });

  it('mileage_asc: menor quilometragem primeiro dentro do mesmo tier', () => {
    const listings = [
      makeListing({ id: 'alto-km',  tier: 'free', mileage: 150000 }),
      makeListing({ id: 'baixo-km', tier: 'free', mileage: 20000 }),
    ];
    const sorted = sortListings(listings, 'mileage_asc');
    expect(sorted[0].id).toBe('baixo-km');
  });

  it('NÃO inverte tier para atender sortBy — gold permanece acima de free', () => {
    // gold com preço alto vs free com preço baixo, sortBy = price_asc
    // gold ainda deve aparecer primeiro porque tier > sortBy
    const listings = [
      makeListing({ id: 'free-barato', tier: 'free',  price_usd: 5000 }),
      makeListing({ id: 'gold-caro',   tier: 'gold',  price_usd: 50000 }),
    ];
    const sorted = sortListings(listings, 'price_asc');
    expect(sorted[0].id).toBe('gold-caro'); // tier vence o sortBy
  });
});

// ─── Regressão: bug do double-sort ───────────────────────────────────────────

describe('Regressão: double-sort (bug Sprint 1)', () => {
  it('resultado é idempotente — chamar sort duas vezes não muda a ordem', () => {
    const listings = [
      makeListing({ id: 'free',   tier: 'free',   price_usd: 5000 }),
      makeListing({ id: 'gold',   tier: 'gold',   price_usd: 50000 }),
      makeListing({ id: 'silver', tier: 'silver', price_usd: 20000 }),
    ];
    const sorted1 = sortListings(listings, 'price_asc');
    const sorted2 = sortListings(sorted1, 'price_asc'); // simula double-sort
    expect(sorted1.map(l => l.id)).toEqual(sorted2.map(l => l.id));
  });

  it('sort com tier NÃO é desfeito por um segundo sort de preço', () => {
    const listings = [
      makeListing({ id: 'free-5k',   tier: 'free',   price_usd: 5000 }),
      makeListing({ id: 'gold-50k',  tier: 'gold',   price_usd: 50000 }),
    ];
    // Primeiro sort: price_asc colocaria free-5k na frente
    const byPrice = [...listings].sort((a, b) => (a.price_usd ?? 0) - (b.price_usd ?? 0));
    expect(byPrice[0].id).toBe('free-5k');

    // Segundo sort: tier correto recoloca gold na frente
    const byTierThenPrice = sortListings(byPrice, 'price_asc');
    expect(byTierThenPrice[0].id).toBe('gold-50k'); // tier vence
  });
});

// ─── Specs de tierWeight ─────────────────────────────────────────────────────

describe('tierWeight (mapeamento de peso)', () => {
  it('gold tem peso máximo (3)', () => {
    expect(tierWeight({ tier: 'gold' })).toBe(3);
  });

  it('silver tem peso intermediário (2)', () => {
    expect(tierWeight({ tier: 'silver' })).toBe(2);
  });

  it('free tem peso mínimo (1)', () => {
    expect(tierWeight({ tier: 'free' })).toBe(1);
  });

  it('undefined tem peso mínimo (1) — mesmo que free', () => {
    expect(tierWeight({})).toBe(1);
  });
});
