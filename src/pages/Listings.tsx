import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Container } from '../components/ui/Container';
import {
  Search,
  SlidersHorizontal,
  X,
  Home,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { RangeSlider } from '../components/ui/RangeSlider';
import { ListingCard } from '../components/listings/ListingCard';
import { useListingsStore } from '../stores/listingsStore';
import {
  CITIES,
  CATEGORIES_BY_TYPE,
  FUELS_BY_TYPE,
  TRANSMISSIONS,
  CONDITIONS,
  VEHICLE_TYPE_LABELS,
} from '../data/constants';
import { fetchBrands } from '../lib/catalog';
import { SEOHead } from '../components/SEOHead';
import { SkeletonCar } from '../components/admin/SkeletonCar';
import type { VehicleType, Brand } from '../types';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'year_desc', label: 'Año: más nuevo' },
  { value: 'mileage_asc', label: 'Menor kilometraje' },
];

interface ListingsProps {
  vehicleType?: VehicleType;
}

export function Listings({ vehicleType }: ListingsProps) {
  const [searchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sliderPrice, setSliderPrice] = useState<[number, number]>([0, 100000]);
  const [sliderKm, setSliderKm] = useState<[number, number]>([0, 300000]);
  const currentYear = new Date().getFullYear();
  const [sliderYear, setSliderYear] = useState<[number, number]>([2000, currentYear]);
  const priceDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const kmDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const yearDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { filters, setFilter, resetFilters, getFilteredListings, hasMore, loadMore, loading: storeLoading } =
    useListingsStore();

  const activeVehicleType = vehicleType || filters.vehicleType || 'auto';
  const typeLabel = VEHICLE_TYPE_LABELS[activeVehicleType];

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilter('search', value);
    }, 300);
  }, [setFilter]);

  // Set vehicleType filter when prop changes
  useEffect(() => {
    if (vehicleType) {
      setFilter('vehicleType', vehicleType);
    }
  }, [vehicleType, setFilter]);

  // Load brands from Supabase filtered by vehicle type
  useEffect(() => {
    fetchBrands(activeVehicleType).then(setBrands);
  }, [activeVehicleType]);

  // Read URL search params on mount to pre-fill filters
  useEffect(() => {
    const condicion = searchParams.get('condicion');
    const tipo = searchParams.get('tipo');
    const marca = searchParams.get('marca');
    const combustible = searchParams.get('combustible');
    const transmision = searchParams.get('transmision');
    const ciudad = searchParams.get('ciudad');
    const priceMax = searchParams.get('priceMax');

    if (condicion) setFilter('condition', condicion);
    if (tipo) setFilter('category', tipo);
    if (marca) setFilter('brand', marca);
    if (combustible) setFilter('fuel', combustible);
    if (transmision) setFilter('transmission', transmision);
    if (ciudad) setFilter('city', ciudad);
    if (priceMax) setFilter('priceMax', Number(priceMax));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredListings = useMemo(() => getFilteredListings(), [
    filters,
    getFilteredListings,
  ]);

  const brandOptions = [
    { value: '', label: 'Todas las marcas' },
    ...brands.map((b) => ({ value: b.name, label: b.name })),
  ];

  const conditionOptions = [
    { value: '', label: 'Todas' },
    ...CONDITIONS.map((c) => ({ value: c.value, label: c.label })),
  ];

  const currentCategories = CATEGORIES_BY_TYPE[activeVehicleType] || CATEGORIES_BY_TYPE.auto;
  const categoryOptions = currentCategories.map((c) => ({
    value: c.value,
    label: c.label,
  }));

  const currentFuels = FUELS_BY_TYPE[activeVehicleType] || FUELS_BY_TYPE.auto;
  const fuelOptions = [
    { value: '', label: 'Todos' },
    ...currentFuels.map((f) => ({ value: f.value, label: f.label })),
  ];

  const transmissionOptions = [
    { value: '', label: 'Todas' },
    ...TRANSMISSIONS.map((t) => ({ value: t.value, label: t.label })),
  ];

  const cityOptions = [
    { value: '', label: 'Todas las ciudades' },
    ...CITIES.map((c) => ({ value: c, label: c })),
  ];

  const activeFilterCount = [
    filters.brand,
    filters.condition,
    filters.category,
    filters.fuel,
    filters.transmission,
    filters.priceMax,
    filters.city,
    filters.tier,
    filters.inspected,
  ].filter(Boolean).length;

  const filterPanel = (
    <div className="flex flex-col divide-y divide-border">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <h2 className="text-lg font-heading font-bold text-text-primary">
          Filtros
        </h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm text-primary hover:text-primary-dark font-medium"
          >
            Limpiar todo
          </button>
        )}
      </div>

      <div className="py-4 first:pt-0 last:pb-0">
        <Select
          label="Marca"
          options={brandOptions}
          value={filters.brand}
          onChange={(e) => setFilter('brand', e.target.value)}
        />
      </div>

      <div className="py-4 first:pt-0 last:pb-0">
        <Select
          label="Condición"
          options={conditionOptions}
          value={filters.condition}
          onChange={(e) => setFilter('condition', e.target.value)}
        />
      </div>

      <div className="py-4 first:pt-0 last:pb-0">
        <Select
          label="Categoría"
          options={categoryOptions}
          value={filters.category}
          onChange={(e) => setFilter('category', e.target.value)}
        />
      </div>

      <div className="py-4 first:pt-0 last:pb-0">
        <Select
          label="Combustible"
          options={fuelOptions}
          value={filters.fuel}
          onChange={(e) => setFilter('fuel', e.target.value)}
        />
      </div>

      <div className="py-4 first:pt-0 last:pb-0">
        <Select
          label="Transmisión"
          options={transmissionOptions}
          value={filters.transmission}
          onChange={(e) => setFilter('transmission', e.target.value)}
        />
      </div>

      <div className="py-4 first:pt-0 last:pb-0">
        <RangeSlider
          label="Precio (USD)"
          min={0} max={100000} step={1000}
          valueMin={sliderPrice[0]}
          valueMax={sliderPrice[1]}
          format={(v) => v === 0 ? 'Sin min' : v === 100000 ? 'Sin max' : `$${(v/1000).toFixed(0)}k`}
          onChangeMin={(v) => {
            setSliderPrice([v, sliderPrice[1]]);
            clearTimeout(priceDebounce.current);
            priceDebounce.current = setTimeout(() => setFilter('priceMin', v > 0 ? v : null), 300);
          }}
          onChangeMax={(v) => {
            setSliderPrice([sliderPrice[0], v]);
            clearTimeout(priceDebounce.current);
            priceDebounce.current = setTimeout(() => setFilter('priceMax', v < 100000 ? v : null), 300);
          }}
        />
      </div>

      <div className="py-4 first:pt-0 last:pb-0">
        <RangeSlider
          label="Año"
          min={2000} max={currentYear} step={1}
          valueMin={sliderYear[0]}
          valueMax={sliderYear[1]}
          format={(v) => String(v)}
          onChangeMin={(v) => {
            setSliderYear([v, sliderYear[1]]);
            clearTimeout(yearDebounce.current);
            yearDebounce.current = setTimeout(() => setFilter('yearMin', v > 2000 ? v : null), 300);
          }}
          onChangeMax={(v) => {
            setSliderYear([sliderYear[0], v]);
            clearTimeout(yearDebounce.current);
            yearDebounce.current = setTimeout(() => setFilter('yearMax', v < currentYear ? v : null), 300);
          }}
        />
      </div>

      {activeVehicleType !== 'barco' && (
        <div className="py-4 first:pt-0 last:pb-0">
          <RangeSlider
            label="Kilometraje máximo"
            min={0} max={300000} step={5000}
            valueMin={0}
            valueMax={sliderKm[1]}
            format={(v) => v === 0 ? '0 km' : v >= 300000 ? 'Sin max' : `${(v/1000).toFixed(0)}k km`}
            onChangeMin={() => {}}
            onChangeMax={(v) => {
              setSliderKm([0, v]);
              clearTimeout(kmDebounce.current);
              kmDebounce.current = setTimeout(() => setFilter('mileageMax', v < 300000 ? v : null), 300);
            }}
          />
        </div>
      )}

      <div className="py-4 first:pt-0 last:pb-0">
        <Select
          label="Ciudad"
          options={cityOptions}
          value={filters.city}
          onChange={(e) => setFilter('city', e.target.value)}
        />
      </div>

      <div className="py-4 first:pt-0 last:pb-0">
        <Select
          label="Nivel de anuncio"
          options={[
            { value: '', label: 'Todos' },
            { value: 'gold', label: 'Gold' },
            { value: 'silver', label: 'Silver' },
            { value: 'free', label: 'Estándar' },
          ]}
          value={filters.tier}
          onChange={(e) => setFilter('tier', e.target.value)}
        />
      </div>

      <div className="py-4 first:pt-0 last:pb-0">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inspected}
            onChange={(e) => setFilter('inspected', e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
          />
          <span className="text-sm font-medium text-text-primary">Solo inspeccionados</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      <SEOHead title={`Comprar ${typeLabel.plural}`} description={`Compra ${typeLabel.plural.toLowerCase()} nuevos y usados en Paraguay. Las mejores ofertas en VitrineMotors.`} />
      <Container className="py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-6 text-sm text-text-secondary">
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Home size={14} />
            Inicio
          </Link>
          <ChevronRight size={14} className="text-text-secondary/50" />
          <span className="text-text-primary font-medium">
            Comprar {typeLabel.plural}
          </span>
        </nav>

        {/* Top bar: title, count, sort, mobile filter toggle */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary">
              Comprar {typeLabel.plural}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              <span className="font-bold text-text-primary">
                {filteredListings.length}
              </span>{' '}
              vehículo
              {filteredListings.length !== 1 ? 's' : ''} encontrado
              {filteredListings.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Buscar marca, modelo..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-full border border-border bg-white pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-bg-secondary transition-colors"
            >
              <SlidersHorizontal size={16} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <div className="w-52">
              <Select
                options={SORT_OPTIONS}
                value={filters.sortBy}
                onChange={(e) => setFilter('sortBy', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.brand && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {filters.brand}
                <button
                  type="button"
                  onClick={() => setFilter('brand', '')}
                  className="hover:text-primary-dark"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.condition && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {filters.condition === '0km' ? '0 km' : 'Usado'}
                <button
                  type="button"
                  onClick={() => setFilter('condition', '')}
                  className="hover:text-primary-dark"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {categoryOptions.find((c) => c.value === filters.category)?.label || filters.category}
                <button
                  type="button"
                  onClick={() => setFilter('category', '')}
                  className="hover:text-primary-dark"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.fuel && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {fuelOptions.find((f) => f.value === filters.fuel)?.label || filters.fuel}
                <button
                  type="button"
                  onClick={() => setFilter('fuel', '')}
                  className="hover:text-primary-dark"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.transmission && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {transmissionOptions.find((t) => t.value === filters.transmission)?.label || filters.transmission}
                <button
                  type="button"
                  onClick={() => setFilter('transmission', '')}
                  className="hover:text-primary-dark"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.priceMax && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                Hasta ${filters.priceMax.toLocaleString()}
                <button
                  type="button"
                  onClick={() => setFilter('priceMax', null)}
                  className="hover:text-primary-dark"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.city && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {filters.city}
                <button
                  type="button"
                  onClick={() => setFilter('city', '')}
                  className="hover:text-primary-dark"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Main layout: sidebar + grid */}
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-20 rounded-xl border border-border bg-white p-5">
              {filterPanel}
            </div>
          </aside>

          {/* Listings grid */}
          <main className="flex-1 min-w-0">
            {storeLoading && filteredListings.length === 0 ? (
              <SkeletonCar count={6} />
            ) : filteredListings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={storeLoading}
                    >
                      {storeLoading ? 'Cargando...' : 'Cargar mas vehiculos'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl bg-gradient-to-b from-bg-secondary/30 to-bg-secondary/60 border border-border/40">
                <div className="w-20 h-20 rounded-full bg-white shadow-card flex items-center justify-center mb-5">
                  <Search size={32} className="text-primary/40" />
                </div>
                <h3 className="text-xl font-heading font-bold text-text-primary mb-2">
                  No se encontraron {typeLabel.plural.toLowerCase()}
                </h3>
                <p className="text-sm text-text-secondary mb-6 max-w-md leading-relaxed">
                  No hay resultados para tu búsqueda. Probá modificar los filtros
                  o ampliar los criterios.
                </p>
                <Button variant="outline" onClick={resetFilters}>
                  Limpiar filtros
                </Button>
              </div>
            )}
          </main>
        </div>
      </Container>

      {/* Mobile filter bottom sheet overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />

          {/* Bottom sheet */}
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl bg-white shadow-xl flex flex-col">
            {/* Drag handle */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto my-3" />

            {/* Sheet header */}
            <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
              <h2 className="text-lg font-heading font-bold text-text-primary">
                Filtros
              </h2>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-bg-secondary transition-colors"
                aria-label="Cerrar filtros"
              >
                <X size={20} className="text-text-primary" />
              </button>
            </div>

            {/* Sheet body */}
            <div className="flex-1 overflow-y-auto p-4">{filterPanel}</div>

            {/* Sheet footer */}
            <div className="p-4 border-t border-border">
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="w-full rounded-xl bg-primary px-5 py-3.5 text-base font-bold text-white hover:bg-primary-dark transition-colors"
              >
                Ver {filteredListings.length} resultado
                {filteredListings.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
