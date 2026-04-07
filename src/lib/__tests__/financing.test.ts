import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyPayment,
  generateAmortizationTable,
  calculateTotals,
  convertUsdToPyg,
} from '../financing';

describe('calculateMonthlyPayment', () => {
  it('calcula parcela mensal corretamente (caso basico)', () => {
    // USD 20.000, 10% anual, 48 meses
    const payment = calculateMonthlyPayment(20000, 10, 48);
    // Esperado ~507.25
    expect(payment).toBeCloseTo(507.25, 0);
  });

  it('calcula parcela para taxa zero', () => {
    const payment = calculateMonthlyPayment(12000, 0, 12);
    expect(payment).toBe(1000); // 12000 / 12
  });

  it('retorna 0 para principal zero', () => {
    expect(calculateMonthlyPayment(0, 10, 48)).toBe(0);
  });

  it('retorna 0 para prazo zero', () => {
    expect(calculateMonthlyPayment(20000, 10, 0)).toBe(0);
  });

  it('calcula com taxa real do Banco Familiar (10.5% anual Gs)', () => {
    // USD 15.000, 10.5% anual, 60 meses
    const payment = calculateMonthlyPayment(15000, 10.5, 60);
    expect(payment).toBeGreaterThan(300);
    expect(payment).toBeLessThan(400);
  });

  it('calcula com taxa real do Itau PY (14% anual Gs)', () => {
    // USD 25.000, 14% anual, 36 meses
    const payment = calculateMonthlyPayment(25000, 14, 36);
    expect(payment).toBeGreaterThan(800);
    expect(payment).toBeLessThan(950);
  });
});

describe('generateAmortizationTable', () => {
  it('gera tabela com numero correto de linhas', () => {
    const table = generateAmortizationTable(10000, 12, 24);
    expect(table).toHaveLength(24);
  });

  it('saldo final e zero (ou proximo de zero)', () => {
    const table = generateAmortizationTable(10000, 12, 24);
    const lastRow = table[table.length - 1];
    expect(lastRow.balance).toBeCloseTo(0, 0);
  });

  it('soma de capital pago = principal', () => {
    const table = generateAmortizationTable(10000, 12, 24);
    const totalPrincipal = table.reduce((sum, row) => sum + row.principal, 0);
    expect(totalPrincipal).toBeCloseTo(10000, 0);
  });

  it('todas as cuotas sao iguais (amortizacao francesa)', () => {
    const table = generateAmortizationTable(10000, 12, 24);
    const firstPayment = table[0].payment;
    for (const row of table) {
      expect(row.payment).toBeCloseTo(firstPayment, 2);
    }
  });

  it('juros decrescem ao longo do tempo', () => {
    const table = generateAmortizationTable(10000, 12, 24);
    expect(table[0].interest).toBeGreaterThan(table[23].interest);
  });
});

describe('calculateTotals', () => {
  it('total = parcela x prazo', () => {
    const { monthlyPayment, totalPayment } = calculateTotals(10000, 12, 24);
    expect(totalPayment).toBeCloseTo(monthlyPayment * 24, 0);
  });

  it('juros total = total - principal', () => {
    const { totalPayment, totalInterest } = calculateTotals(10000, 12, 24);
    expect(totalInterest).toBeCloseTo(totalPayment - 10000, 0);
  });

  it('juros total > 0 para taxa > 0', () => {
    const { totalInterest } = calculateTotals(10000, 12, 24);
    expect(totalInterest).toBeGreaterThan(0);
  });

  it('juros total = 0 para taxa zero', () => {
    const { totalInterest } = calculateTotals(10000, 0, 24);
    expect(totalInterest).toBeCloseTo(0, 2);
  });
});

describe('convertUsdToPyg', () => {
  it('converte corretamente', () => {
    // USD_TO_PYG = 7300
    expect(convertUsdToPyg(100)).toBe(730000);
  });

  it('converte zero', () => {
    expect(convertUsdToPyg(0)).toBe(0);
  });

  it('arredonda para inteiro', () => {
    const result = convertUsdToPyg(1.5);
    expect(Number.isInteger(result)).toBe(true);
  });
});
