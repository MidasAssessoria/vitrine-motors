export interface ParaguayBank {
  id: string;
  name: string;
  logo?: string;
  /** Taxa anual em Guaranies para vehiculos de combustao */
  rateAnnualGs: number;
  /** Taxa anual em USD para vehiculos de combustao */
  rateAnnualUsd: number;
  /** Taxa anual em Gs para hibridos/electricos (se diferenciada) */
  rateAnnualGsHybrid?: number;
  /** Taxa anual em USD para hibridos/electricos */
  rateAnnualUsdHybrid?: number;
  /** Prazo maximo em meses */
  maxTermMonths: number;
  /** Financiamento maximo (% do valor) */
  maxFinancingPercent: number;
  /** Requisitos basicos */
  requirements: string[];
  /** URL do site */
  url: string;
  /** Nota/observacao */
  note?: string;
}

// Taxas pesquisadas em Marco/2026
// Fontes: sites oficiais dos bancos, BCP (taxa basica 5.75%)
export const PARAGUAY_BANKS: ParaguayBank[] = [
  {
    id: 'familiar',
    name: 'Banco Familiar',
    rateAnnualGs: 10.50,
    rateAnnualUsd: 8.00,
    rateAnnualGsHybrid: 8.95,
    rateAnnualUsdHybrid: 7.70,
    maxTermMonths: 60,
    maxFinancingPercent: 80,
    requirements: ['Cedula de identidad', 'Comprobante de ingresos', 'Antiguedad laboral minima'],
    url: 'https://www.familiar.com.py/prestamo-vehiculos',
    note: 'Tasas preferenciales para hibridos y electricos',
  },
  {
    id: 'gnb',
    name: 'Banco GNB',
    rateAnnualGs: 10.90,
    rateAnnualUsd: 9.00,
    maxTermMonths: 60,
    maxFinancingPercent: 80,
    requirements: ['Cedula de identidad', 'Recibo de sueldo', 'Referencia bancaria'],
    url: 'https://www.bancognb.com.py/public/prestamos-auto.jsp',
    note: 'Tasa promocional vigente',
  },
  {
    id: 'itau',
    name: 'Itau Paraguay',
    rateAnnualGs: 14.00,
    rateAnnualUsd: 10.50,
    maxTermMonths: 60,
    maxFinancingPercent: 100,
    requirements: ['Cedula de identidad', 'A sola firma para 0km'],
    url: 'https://www.miauto.itau.com.py/',
    note: 'Financia hasta 100% del valor en 0km',
  },
  {
    id: 'continental',
    name: 'Banco Continental',
    rateAnnualGs: 12.00,
    rateAnnualUsd: 9.50,
    maxTermMonths: 60,
    maxFinancingPercent: 80,
    requirements: ['Cedula de identidad', 'Comprobante de ingresos', 'Antiguedad 1 ano'],
    url: 'https://www.continental.com.py',
    note: 'Tasa estimada — consultar sucursal',
  },
  {
    id: 'vision',
    name: 'Vision Banco',
    rateAnnualGs: 13.00,
    rateAnnualUsd: 10.00,
    maxTermMonths: 48,
    maxFinancingPercent: 70,
    requirements: ['Cedula de identidad', 'IPS o comprobante de ingresos'],
    url: 'https://www.visionbanco.com',
    note: 'Tasa estimada — consultar sucursal',
  },
  {
    id: 'sudameris',
    name: 'Sudameris Bank',
    rateAnnualGs: 11.50,
    rateAnnualUsd: 9.00,
    maxTermMonths: 60,
    maxFinancingPercent: 80,
    requirements: ['Cedula de identidad', 'Comprobante de ingresos'],
    url: 'https://www.sudameris.com.py/prestamo-vehiculo',
  },
];

/** Taxa de cambio aproximada USD -> PYG */
export const USD_TO_PYG = 7300;

/** Prazos disponiveis */
export const FINANCING_TERMS = [12, 24, 36, 48, 60];
