import type { VehicleType } from '../types';

// ─── Marcas (legacy — preferir Supabase) ───
/** @deprecated Usar fetchBrands() de lib/catalog.ts */
export const BRANDS = [
  'Toyota', 'Volkswagen', 'Honda', 'Ford', 'Chevrolet',
  'Nissan', 'Hyundai', 'Kia', 'Mitsubishi', 'Renault',
  'Fiat', 'BMW', 'Mercedes-Benz', 'Audi', 'Jeep',
] as const;

export const CITIES = [
  'Asunción', 'San Lorenzo', 'Luque', 'Fernando de la Mora',
  'Lambaré', 'Capiatá', 'Mariano Roque Alonso', 'Ñemby',
] as const;

// ─── Categorías por tipo de vehículo ───

export const AUTO_CATEGORIES = [
  { value: '', label: 'Todos', icon: 'LayoutGrid' },
  { value: 'suv', label: 'SUVs', icon: 'Car' },
  { value: 'pickup', label: 'Pickups', icon: 'Truck' },
  { value: 'sedan', label: 'Sedanes', icon: 'CarFront' },
  { value: 'hatchback', label: 'Hatchbacks', icon: 'CarFront' },
  { value: 'coupe', label: 'Coupés', icon: 'Zap' },
  { value: 'van', label: 'Vans', icon: 'Bus' },
  { value: 'camion', label: 'Camiones', icon: 'Truck' },
] as const;

export const MOTO_CATEGORIES = [
  { value: '', label: 'Todas', icon: 'LayoutGrid' },
  { value: 'scooter', label: 'Scooter', icon: 'Bike' },
  { value: 'street', label: 'Street', icon: 'Bike' },
  { value: 'sport', label: 'Sport', icon: 'Zap' },
  { value: 'touring', label: 'Touring', icon: 'Compass' },
  { value: 'adventure', label: 'Adventure', icon: 'Mountain' },
  { value: 'custom', label: 'Custom', icon: 'Wrench' },
  { value: 'trail', label: 'Trail / Enduro', icon: 'TreePine' },
  { value: 'cuatriciclo', label: 'Cuatriciclo', icon: 'Truck' },
] as const;

export const BARCO_CATEGORIES = [
  { value: '', label: 'Todos', icon: 'LayoutGrid' },
  { value: 'lancha', label: 'Lancha', icon: 'Ship' },
  { value: 'velero', label: 'Velero', icon: 'Sailboat' },
  { value: 'yate', label: 'Yate', icon: 'Ship' },
  { value: 'jetski', label: 'Jet Ski', icon: 'Waves' },
  { value: 'bote', label: 'Bote', icon: 'Ship' },
  { value: 'pesquero', label: 'Pesquero', icon: 'Fish' },
] as const;

/** Alias para retrocompatibilidade */
export const CATEGORIES = AUTO_CATEGORIES;

export const CATEGORIES_BY_TYPE: Record<VehicleType, typeof AUTO_CATEGORIES | typeof MOTO_CATEGORIES | typeof BARCO_CATEGORIES> = {
  auto: AUTO_CATEGORIES,
  moto: MOTO_CATEGORIES,
  barco: BARCO_CATEGORIES,
};

// ─── Quick Filters por tipo ───

export const QUICK_FILTERS_AUTO = [
  { value: 'all', label: 'Todos', icon: 'LayoutGrid' },
  { value: 'suv', label: 'SUVs', icon: 'Car' },
  { value: 'pickup', label: 'Pickups', icon: 'Truck' },
  { value: 'sedan', label: 'Sedanes', icon: 'CarFront' },
  { value: '0km', label: '0km', icon: 'Sparkles' },
  { value: 'diesel', label: 'Diésel', icon: 'Fuel' },
  { value: 'automatico', label: 'Automático', icon: 'Cog' },
  { value: 'hasta20k', label: 'Hasta 20K', icon: 'DollarSign' },
] as const;

export const QUICK_FILTERS_MOTO = [
  { value: 'all', label: 'Todas', icon: 'LayoutGrid' },
  { value: 'scooter', label: 'Scooter', icon: 'Bike' },
  { value: 'street', label: 'Street', icon: 'Bike' },
  { value: 'sport', label: 'Sport', icon: 'Zap' },
  { value: 'adventure', label: 'Adventure', icon: 'Mountain' },
  { value: 'trail', label: 'Trail', icon: 'TreePine' },
  { value: '0km', label: '0km', icon: 'Sparkles' },
  { value: 'hasta5k', label: 'Hasta 5K', icon: 'DollarSign' },
] as const;

export const QUICK_FILTERS_BARCO = [
  { value: 'all', label: 'Todos', icon: 'LayoutGrid' },
  { value: 'lancha', label: 'Lanchas', icon: 'Ship' },
  { value: 'jetski', label: 'Jet Ski', icon: 'Waves' },
  { value: 'velero', label: 'Veleros', icon: 'Sailboat' },
  { value: 'yate', label: 'Yates', icon: 'Ship' },
  { value: 'pesquero', label: 'Pesqueros', icon: 'Fish' },
  { value: '0km', label: '0km / Nuevo', icon: 'Sparkles' },
  { value: 'hasta30k', label: 'Hasta 30K', icon: 'DollarSign' },
] as const;

/** Alias para retrocompatibilidade */
export const QUICK_FILTERS = QUICK_FILTERS_AUTO;

export const QUICK_FILTERS_BY_TYPE: Record<VehicleType, typeof QUICK_FILTERS_AUTO | typeof QUICK_FILTERS_MOTO | typeof QUICK_FILTERS_BARCO> = {
  auto: QUICK_FILTERS_AUTO,
  moto: QUICK_FILTERS_MOTO,
  barco: QUICK_FILTERS_BARCO,
};

// ─── Combustible por tipo ───

export const FUELS_AUTO = [
  { value: 'nafta', label: 'Nafta' },
  { value: 'diesel', label: 'Diésel' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'electrico', label: 'Eléctrico' },
] as const;

export const FUELS_MOTO = [
  { value: 'nafta', label: 'Nafta' },
  { value: '2t', label: '2 Tiempos' },
  { value: 'electrico', label: 'Eléctrico' },
] as const;

export const FUELS_BARCO = [
  { value: 'nafta', label: 'Nafta' },
  { value: 'diesel', label: 'Diésel' },
] as const;

/** Alias para retrocompatibilidade */
export const FUELS = FUELS_AUTO;

export const FUELS_BY_TYPE: Record<VehicleType, typeof FUELS_AUTO | typeof FUELS_MOTO | typeof FUELS_BARCO> = {
  auto: FUELS_AUTO,
  moto: FUELS_MOTO,
  barco: FUELS_BARCO,
};

// ─── Transmisión ───

export const TRANSMISSIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatico', label: 'Automático' },
  { value: 'cvt', label: 'CVT' },
] as const;

export const CONDITIONS = [
  { value: '0km', label: '0 km' },
  { value: 'usado', label: 'Usado' },
] as const;

export const PRICE_RANGES = [
  { value: 10000, label: 'USD 10.000' },
  { value: 20000, label: 'USD 20.000' },
  { value: 30000, label: 'USD 30.000' },
  { value: 40000, label: 'USD 40.000' },
  { value: 50000, label: 'USD 50.000' },
  { value: 75000, label: 'USD 75.000' },
  { value: 100000, label: 'USD 100.000' },
] as const;

export const COLORS = [
  'Blanco', 'Negro', 'Gris', 'Plata', 'Rojo', 'Azul',
  'Verde', 'Marrón', 'Beige', 'Naranja', 'Amarillo',
] as const;

export const INTERIOR_COLORS = [
  'Negro', 'Beige', 'Gris', 'Marrón', 'Blanco', 'Rojo',
] as const;

// ─── Equipamiento por tipo ───

export const EQUIPMENT_OPTIONS_AUTO = [
  { key: 'ac', label: 'Aire acondicionado' },
  { key: 'power_steering', label: 'Dirección asistida' },
  { key: 'power_windows', label: 'Vidrios eléctricos' },
  { key: 'central_lock', label: 'Cierre centralizado' },
  { key: 'abs', label: 'Frenos ABS' },
  { key: 'airbags', label: 'Airbags' },
  { key: 'esp', label: 'Control de estabilidad (ESP)' },
  { key: 'cruise_control', label: 'Control de crucero' },
  { key: 'touchscreen', label: 'Pantalla táctil' },
  { key: 'bluetooth', label: 'Bluetooth' },
  { key: 'backup_camera', label: 'Cámara de retroceso' },
  { key: 'parking_sensor', label: 'Sensor de estacionamiento' },
  { key: 'sunroof', label: 'Techo solar' },
  { key: 'leather', label: 'Asientos de cuero' },
  { key: 'heated_seats', label: 'Asientos calefaccionados' },
  { key: 'alloy_wheels', label: 'Llantas de aleación' },
  { key: 'led_lights', label: 'Faros LED' },
  { key: 'keyless', label: 'Keyless entry' },
  { key: 'start_stop', label: 'Start/Stop' },
  { key: 'four_wd', label: 'Tracción 4x4' },
] as const;

export const EQUIPMENT_OPTIONS_MOTO = [
  { key: 'abs', label: 'Frenos ABS' },
  { key: 'led_lights', label: 'Faros LED' },
  { key: 'digital_dash', label: 'Tablero digital' },
  { key: 'bluetooth', label: 'Bluetooth' },
  { key: 'usb', label: 'Puerto USB' },
  { key: 'alarm', label: 'Alarma' },
  { key: 'gps', label: 'GPS' },
  { key: 'windshield', label: 'Parabrisas' },
  { key: 'top_case', label: 'Top case / Baúl' },
  { key: 'side_cases', label: 'Alforjas laterales' },
  { key: 'heated_grips', label: 'Puños calefaccionados' },
  { key: 'quickshifter', label: 'Quickshifter' },
  { key: 'traction_control', label: 'Control de tracción' },
  { key: 'ride_modes', label: 'Modos de conducción' },
  { key: 'crash_bars', label: 'Defensa / Crash bars' },
] as const;

export const EQUIPMENT_OPTIONS_BARCO = [
  { key: 'gps_nautico', label: 'GPS náutico' },
  { key: 'radar', label: 'Radar' },
  { key: 'vhf', label: 'Radio VHF' },
  { key: 'sonar', label: 'Sonar / Sonda' },
  { key: 'electric_anchor', label: 'Ancla eléctrica' },
  { key: 'bimini_top', label: 'Toldo bimini' },
  { key: 'shower', label: 'Ducha' },
  { key: 'fridge', label: 'Nevera / Heladera' },
  { key: 'sound_system', label: 'Equipo de sonido' },
  { key: 'led_underwater', label: 'Luces LED subacuáticas' },
  { key: 'trim_tabs', label: 'Trim tabs' },
  { key: 'live_well', label: 'Vivero de pesca' },
  { key: 'toilet', label: 'Baño' },
  { key: 'cabin', label: 'Cabina' },
  { key: 'trailer', label: 'Tráiler incluido' },
] as const;

/** Alias para retrocompatibilidade */
export const EQUIPMENT_OPTIONS = EQUIPMENT_OPTIONS_AUTO;

export const EQUIPMENT_BY_TYPE: Record<VehicleType, typeof EQUIPMENT_OPTIONS_AUTO | typeof EQUIPMENT_OPTIONS_MOTO | typeof EQUIPMENT_OPTIONS_BARCO> = {
  auto: EQUIPMENT_OPTIONS_AUTO,
  moto: EQUIPMENT_OPTIONS_MOTO,
  barco: EQUIPMENT_OPTIONS_BARCO,
};

// ─── Campos específicos por tipo (para formulários) ───

export const MOTO_STARTERS = [
  { value: 'electrica', label: 'Eléctrica' },
  { value: 'kick', label: 'Kick' },
  { value: 'ambas', label: 'Ambas' },
] as const;

export const MOTO_COOLING = [
  { value: 'aire', label: 'Aire' },
  { value: 'liquida', label: 'Líquida' },
] as const;

export const BARCO_HULL_MATERIALS = [
  { value: 'fibra', label: 'Fibra de vidrio' },
  { value: 'aluminio', label: 'Aluminio' },
  { value: 'madera', label: 'Madera' },
  { value: 'inflable', label: 'Inflable' },
  { value: 'acero', label: 'Acero' },
] as const;

// ─── Labels de tipo de vehículo ───

export const VEHICLE_TYPE_LABELS: Record<VehicleType, { singular: string; plural: string; icon: string }> = {
  auto: { singular: 'Auto', plural: 'Autos', icon: 'Car' },
  moto: { singular: 'Moto', plural: 'Motos', icon: 'Bike' },
  barco: { singular: 'Barco', plural: 'Barcos', icon: 'Ship' },
};

export const VEHICLE_TYPES: VehicleType[] = ['auto', 'moto', 'barco'];
