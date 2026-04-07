import { USD_TO_PYG } from '../data/paraguayBanks';

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

/**
 * Calcula a parcela mensal usando amortizacao francesa (cuota fija)
 * @param principal - Valor financiado (valor - entrada)
 * @param annualRate - Taxa anual (ex: 10.5 para 10.5%)
 * @param termMonths - Prazo em meses
 * @returns Parcela mensal
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate <= 0) return principal / termMonths;

  const monthlyRate = annualRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * Gera a tabela de amortizacao completa
 */
export function generateAmortizationTable(
  principal: number,
  annualRate: number,
  termMonths: number
): AmortizationRow[] {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const monthlyRate = annualRate / 100 / 12;
  const rows: AmortizationRow[] = [];
  let balance = principal;

  for (let month = 1; month <= termMonths; month++) {
    const interest = balance * monthlyRate;
    const principalPart = monthlyPayment - interest;
    balance = Math.max(0, balance - principalPart);

    rows.push({
      month,
      payment: monthlyPayment,
      principal: principalPart,
      interest,
      balance,
    });
  }

  return rows;
}

/**
 * Calcula totais da amortizacao
 */
export function calculateTotals(
  principal: number,
  annualRate: number,
  termMonths: number
): { totalPayment: number; totalInterest: number; monthlyPayment: number } {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const totalPayment = monthlyPayment * termMonths;
  const totalInterest = totalPayment - principal;

  return { totalPayment, totalInterest, monthlyPayment };
}

/**
 * Converte USD para Guaranies
 */
export function convertUsdToPyg(usd: number): number {
  return Math.round(usd * USD_TO_PYG);
}

/**
 * Formata valor em Guaranies
 */
export function formatPyg(amount: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formata valor em USD
 */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
