import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from '../../components/ui/Container';
import { SEOHead } from '../../components/SEOHead';
import { PARAGUAY_BANKS, FINANCING_TERMS, USD_TO_PYG } from '../../data/paraguayBanks';
import { calculateTotals, generateAmortizationTable, convertUsdToPyg, formatPyg, formatUsd } from '../../lib/financing';
import { Calculator, Building2, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';

export function FinancingCalculator() {
  const [searchParams] = useSearchParams();
  const initialPrice = Number(searchParams.get('price')) || 25000;

  const [vehiclePrice, setVehiclePrice] = useState(initialPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [selectedBankId, setSelectedBankId] = useState(PARAGUAY_BANKS[0].id);
  const [termMonths, setTermMonths] = useState(48);
  const [currency, setCurrency] = useState<'usd' | 'pyg'>('usd');
  const [customRate, setCustomRate] = useState<number | null>(null);
  const [showAmortization, setShowAmortization] = useState(false);

  const selectedBank = PARAGUAY_BANKS.find((b) => b.id === selectedBankId)!;
  const annualRate = customRate ?? (currency === 'usd' ? selectedBank.rateAnnualUsd : selectedBank.rateAnnualGs);

  const downPayment = vehiclePrice * (downPaymentPercent / 100);
  const financedAmount = vehiclePrice - downPayment;

  const { monthlyPayment, totalPayment, totalInterest } = useMemo(
    () => calculateTotals(financedAmount, annualRate, termMonths),
    [financedAmount, annualRate, termMonths]
  );

  const amortizationTable = useMemo(
    () => showAmortization ? generateAmortizationTable(financedAmount, annualRate, termMonths) : [],
    [financedAmount, annualRate, termMonths, showAmortization]
  );

  const fmt = (val: number) => currency === 'usd' ? formatUsd(val) : formatPyg(convertUsdToPyg(val));

  return (
    <div className="bg-bg min-h-screen py-8">
      <SEOHead
        title="Calculadora de Financiamiento"
        description="Simula tu financiamiento de vehiculo en Paraguay. Tasas reales de Banco Familiar, GNB, Itau, Continental y Vision Banco."
      />

      <Container>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calculator className="text-primary" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-text-primary">Calculadora de Financiamiento</h1>
              <p className="text-sm text-text-secondary">Tasas reales de bancos de Paraguay</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Esquerda - Inputs */}
            <div className="lg:col-span-2 space-y-5">
              {/* Valor do veiculo */}
              <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Valor del vehiculo (USD)
                </label>
                <input
                  type="number"
                  value={vehiclePrice}
                  onChange={(e) => setVehiclePrice(Math.max(0, Number(e.target.value)))}
                  className="w-full text-2xl font-bold text-text-primary bg-bg-secondary rounded-xl px-4 py-3 border-0 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-xs text-text-secondary mt-1">
                  {formatPyg(convertUsdToPyg(vehiclePrice))} (aprox. 1 USD = {USD_TO_PYG.toLocaleString()} PYG)
                </p>
              </div>

              {/* Entrada */}
              <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-text-primary">Entrada</label>
                  <span className="text-lg font-bold text-primary">{downPaymentPercent}% — {fmt(downPayment)}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>10%</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Banco */}
              <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
                <label className="block text-sm font-semibold text-text-primary mb-3">
                  <Building2 size={16} className="inline mr-1" />
                  Banco
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PARAGUAY_BANKS.map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => { setSelectedBankId(bank.id); setCustomRate(null); }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedBankId === bank.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <span className="text-sm font-medium text-text-primary block">{bank.name}</span>
                      <span className="text-xs text-text-secondary">
                        {currency === 'usd' ? bank.rateAnnualUsd : bank.rateAnnualGs}% anual
                      </span>
                    </button>
                  ))}
                  {/* Tasa personalizada */}
                  <button
                    onClick={() => setCustomRate(customRate !== null ? null : 12)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      customRate !== null
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border border-dashed hover:border-primary/40'
                    }`}
                  >
                    <span className="text-sm font-medium text-text-primary block">Tasa propia</span>
                    {customRate !== null && (
                      <input
                        type="number"
                        value={customRate}
                        onChange={(e) => setCustomRate(Number(e.target.value))}
                        className="mt-1 w-full text-xs bg-white rounded px-2 py-1 border border-border"
                        placeholder="% anual"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </button>
                </div>
                {selectedBank.note && customRate === null && (
                  <p className="text-xs text-text-secondary mt-2 italic">{selectedBank.note}</p>
                )}
              </div>

              {/* Prazo */}
              <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
                <label className="block text-sm font-semibold text-text-primary mb-3">Plazo</label>
                <div className="flex gap-2">
                  {FINANCING_TERMS.filter((t) => t <= (selectedBank.maxTermMonths || 60)).map((term) => (
                    <button
                      key={term}
                      onClick={() => setTermMonths(term)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        termMonths === term
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-bg-secondary text-text-secondary hover:bg-primary/10'
                      }`}
                    >
                      {term} meses
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle moeda */}
              <div className="flex items-center gap-3">
                <DollarSign size={16} className="text-text-secondary" />
                <button
                  onClick={() => setCurrency(currency === 'usd' ? 'pyg' : 'usd')}
                  className="text-sm font-medium text-primary hover:underline cursor-pointer"
                >
                  {currency === 'usd' ? 'Ver en Guaranies (Gs.)' : 'Ver en Dolares (USD)'}
                </button>
              </div>
            </div>

            {/* Coluna Direita - Resultado */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-border p-6 shadow-card sticky top-20">
                <h3 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Tu cuota mensual</h3>

                <div className="text-center mb-5">
                  <div className="text-4xl font-heading font-bold text-primary">
                    {fmt(monthlyPayment)}
                  </div>
                  <p className="text-sm text-text-secondary mt-1">por mes durante {termMonths} meses</p>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Valor del vehiculo</span>
                    <span className="font-medium">{fmt(vehiclePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Entrada ({downPaymentPercent}%)</span>
                    <span className="font-medium text-green-600">-{fmt(downPayment)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Monto financiado</span>
                    <span className="font-medium">{fmt(financedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Tasa anual</span>
                    <span className="font-medium">{annualRate}%</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between text-sm">
                    <span className="text-text-secondary">Total intereses</span>
                    <span className="font-medium text-red-500">{fmt(totalInterest)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total a pagar</span>
                    <span>{fmt(totalPayment)}</span>
                  </div>
                </div>

                <div className="mt-5 p-3 bg-primary/5 rounded-xl text-xs text-text-secondary">
                  Simulacion referencial. Las tasas pueden variar. Consulta directamente con {customRate === null ? selectedBank.name : 'tu banco'}.
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de amortizacao */}
          <div className="mt-8">
            <button
              onClick={() => setShowAmortization(!showAmortization)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline cursor-pointer"
            >
              {showAmortization ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showAmortization ? 'Ocultar' : 'Ver'} tabla de amortizacion
            </button>

            {showAmortization && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 overflow-x-auto"
              >
                <table className="w-full bg-white rounded-xl border border-border text-sm">
                  <thead>
                    <tr className="bg-bg-secondary/50">
                      <th className="py-2 px-3 text-left font-semibold text-text-secondary">Mes</th>
                      <th className="py-2 px-3 text-right font-semibold text-text-secondary">Cuota</th>
                      <th className="py-2 px-3 text-right font-semibold text-text-secondary">Capital</th>
                      <th className="py-2 px-3 text-right font-semibold text-text-secondary">Interes</th>
                      <th className="py-2 px-3 text-right font-semibold text-text-secondary">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortizationTable.map((row) => (
                      <tr key={row.month} className="border-t border-border/30 hover:bg-bg-secondary/20">
                        <td className="py-2 px-3">{row.month}</td>
                        <td className="py-2 px-3 text-right">{fmt(row.payment)}</td>
                        <td className="py-2 px-3 text-right text-green-600">{fmt(row.principal)}</td>
                        <td className="py-2 px-3 text-right text-red-500">{fmt(row.interest)}</td>
                        <td className="py-2 px-3 text-right font-medium">{fmt(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
