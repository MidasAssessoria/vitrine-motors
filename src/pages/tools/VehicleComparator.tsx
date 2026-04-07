import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { SEOHead } from '../../components/SEOHead';
import { useComparisonStore } from '../../stores/comparisonStore';
import { fetchListingById } from '../../lib/listings';
import { formatPrice, formatMileage, getFuelLabel, getTransmissionLabel } from '../../utils/formatters';
import type { Listing } from '../../types';
import { X, Plus, ArrowLeft, Scale, ExternalLink } from 'lucide-react';

interface CompareSpec {
  label: string;
  getValue: (l: Listing) => string;
}

const SPECS: CompareSpec[] = [
  { label: 'Precio', getValue: (l) => formatPrice(l.price_usd) },
  { label: 'Ano', getValue: (l) => String(l.year) },
  { label: 'Kilometraje', getValue: (l) => formatMileage(l.mileage) },
  { label: 'Combustible', getValue: (l) => getFuelLabel(l.fuel) },
  { label: 'Transmision', getValue: (l) => getTransmissionLabel(l.transmission) },
  { label: 'Condicion', getValue: (l) => l.condition === '0km' ? '0 km' : 'Usado' },
  { label: 'Color', getValue: (l) => l.color || '—' },
  { label: 'Puertas', getValue: (l) => l.doors ? String(l.doors) : '—' },
  { label: 'Ciudad', getValue: (l) => l.city },
  { label: 'Motor (cc)', getValue: (l) => l.engine_cc ? `${l.engine_cc} cc` : '—' },
];

export function VehicleComparator() {
  const [searchParams] = useSearchParams();
  const { comparedIds, removeFromCompare, clearComparison } = useComparisonStore();
  const [listings, setListings] = useState<(Listing | null)[]>([]);
  const [loading, setLoading] = useState(true);

  // Pre-carregar IDs da URL se existirem
  const urlIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];
  const idsToLoad = urlIds.length > 0 ? urlIds : comparedIds;

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      const results = await Promise.all(
        idsToLoad.map((id) => fetchListingById(id))
      );
      setListings(results);
      setLoading(false);
    };

    if (idsToLoad.length > 0) {
      loadListings();
    } else {
      setListings([]);
      setLoading(false);
    }
  }, [idsToLoad.join(',')]);

  const validListings = listings.filter((l): l is Listing => l !== null);
  const emptySlots = 3 - validListings.length;

  // Detectar diferencas entre valores
  const isDifferent = (spec: CompareSpec): boolean => {
    if (validListings.length < 2) return false;
    const values = validListings.map((l) => spec.getValue(l));
    return new Set(values).size > 1;
  };

  // URL compartilhavel
  const shareUrl = validListings.length > 0
    ? `${window.location.origin}/comparar?ids=${validListings.map((l) => l.id).join(',')}`
    : '';

  return (
    <div className="bg-bg min-h-screen py-8">
      <SEOHead
        title="Comparar Vehiculos"
        description="Compara vehiculos lado a lado en VitrineMotors. Hasta 3 vehiculos al mismo tiempo."
      />

      <Container>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Scale className="text-primary" size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-text-primary">Comparar Vehiculos</h1>
                <p className="text-sm text-text-secondary">{validListings.length} de 3 vehiculos seleccionados</p>
              </div>
            </div>
            <div className="flex gap-2">
              {shareUrl && (
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(shareUrl)}>
                  Copiar enlace
                </Button>
              )}
              {validListings.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearComparison}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-text-secondary">Cargando vehiculos...</div>
          ) : validListings.length === 0 ? (
            /* Estado vacio */
            <div className="text-center py-20">
              <Scale size={48} className="mx-auto text-text-secondary/30 mb-4" />
              <h2 className="text-lg font-semibold text-text-primary mb-2">No hay vehiculos para comparar</h2>
              <p className="text-sm text-text-secondary mb-6">
                Agrega vehiculos desde la pagina de listado o detalle usando el boton de comparar.
              </p>
              <Link to="/comprar">
                <Button variant="primary">
                  <ArrowLeft size={16} className="mr-2" />
                  Ir a buscar vehiculos
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Cards de veiculos no topo */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {validListings.map((listing) => {
                  const cover = listing.photos?.find((p) => p.is_cover)?.url || listing.photos?.[0]?.url;
                  return (
                    <div key={listing.id} className="bg-white rounded-2xl border border-border overflow-hidden shadow-card relative">
                      <button
                        onClick={() => removeFromCompare(listing.id)}
                        className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 cursor-pointer"
                      >
                        <X size={14} className="text-red-500" />
                      </button>
                      {cover && (
                        <img src={cover} alt={listing.title} className="w-full h-36 object-cover" />
                      )}
                      <div className="p-3">
                        <h3 className="text-sm font-bold text-text-primary truncate">{listing.title}</h3>
                        <p className="text-lg font-heading font-bold text-primary">{formatPrice(listing.price_usd)}</p>
                        <Link to={`/vehiculo/${listing.id}`} className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline">
                          Ver detalle <ExternalLink size={10} />
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* Slots vazios */}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <Link
                    key={`empty-${i}`}
                    to="/comprar"
                    className="bg-white rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center min-h-[200px] hover:border-primary/40 transition-colors"
                  >
                    <Plus size={24} className="text-text-secondary/40 mb-2" />
                    <span className="text-sm text-text-secondary">Agregar vehiculo</span>
                  </Link>
                ))}
              </div>

              {/* Tabela de comparacao */}
              {validListings.length >= 2 && (
                <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-card">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-bg-secondary/50 border-b border-border">
                          <th className="py-3 px-4 text-left text-sm font-semibold text-text-secondary w-1/4">Especificacion</th>
                          {validListings.map((l) => (
                            <th key={l.id} className="py-3 px-4 text-center text-sm font-bold text-text-primary">
                              {l.brand} {l.model}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {SPECS.map((spec) => {
                          const different = isDifferent(spec);
                          return (
                            <tr key={spec.label} className="border-b border-border/30 hover:bg-bg-secondary/20">
                              <td className="py-2.5 px-4 text-sm text-text-secondary font-medium">{spec.label}</td>
                              {validListings.map((l) => {
                                const val = spec.getValue(l);
                                // Destaque para o melhor preco (menor) ou menor km
                                const isBest = different && validListings.length >= 2 && (
                                  (spec.label === 'Precio' && l.price_usd === Math.min(...validListings.map((v) => v.price_usd))) ||
                                  (spec.label === 'Kilometraje' && l.mileage === Math.min(...validListings.map((v) => v.mileage))) ||
                                  (spec.label === 'Ano' && l.year === Math.max(...validListings.map((v) => v.year)))
                                );
                                return (
                                  <td
                                    key={l.id}
                                    className={`py-2.5 px-4 text-sm text-center ${
                                      isBest ? 'font-bold text-green-600 bg-green-50/50' :
                                      different ? 'font-medium text-text-primary' : 'text-text-secondary'
                                    }`}
                                  >
                                    {val}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </Container>
    </div>
  );
}
