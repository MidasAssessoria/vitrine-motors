import type { Listing } from '../types';

const SITE_NAME = 'VitrineMotors';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://vitrinemotors.com';

/**
 * JSON-LD para um veiculo individual (Vehicle/Car schema)
 * https://schema.org/Vehicle
 */
export function generateVehicleJsonLd(listing: Listing): object {
  const fuelMap: Record<string, string> = {
    nafta: 'https://schema.org/Gasoline',
    diesel: 'https://schema.org/Diesel',
    electrico: 'https://schema.org/Electric',
    hibrido: 'https://schema.org/HybridElectric',
  };

  const transmissionMap: Record<string, string> = {
    manual: 'https://schema.org/ManualTransmission',
    automatico: 'https://schema.org/AutomaticTransmission',
    cvt: 'https://schema.org/AutomaticTransmission',
  };

  const coverPhoto = listing.photos?.find(p => p.is_cover)?.url || listing.photos?.[0]?.url;

  return {
    '@context': 'https://schema.org',
    '@type': listing.vehicle_type === 'moto' ? 'MotorizedBicycle' : listing.vehicle_type === 'barco' ? 'Vehicle' : 'Car',
    name: listing.title,
    brand: { '@type': 'Brand', name: listing.brand },
    model: listing.model,
    modelDate: String(listing.year),
    vehicleModelDate: String(listing.year),
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: listing.mileage,
      unitCode: 'KMT',
    },
    fuelType: fuelMap[listing.fuel] || listing.fuel,
    vehicleTransmission: transmissionMap[listing.transmission] || listing.transmission,
    color: listing.color,
    vehicleCondition: listing.condition === '0km' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
    offers: {
      '@type': 'Offer',
      price: listing.price_usd,
      priceCurrency: 'USD',
      availability: listing.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/vehiculo/${listing.id}`,
      seller: listing.dealership ? {
        '@type': 'AutoDealer',
        name: listing.dealership.name,
        address: listing.dealership.address,
      } : undefined,
    },
    image: coverPhoto,
    url: `${SITE_URL}/vehiculo/${listing.id}`,
    description: listing.description?.slice(0, 300),
  };
}

/**
 * JSON-LD para a organizacao (Organization schema)
 */
export function generateOrganizationJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Marketplace automotriz de Paraguay. Compra y vende vehiculos nuevos y usados.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'PY',
      addressLocality: 'Asuncion',
    },
    sameAs: [],
  };
}

/**
 * JSON-LD para breadcrumbs
 */
export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItemElement',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * JSON-LD para ItemList (pagina de listagem)
 */
export function generateItemListJsonLd(listings: Listing[], listName: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: listings.length,
    itemListElement: listings.slice(0, 10).map((listing, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/vehiculo/${listing.id}`,
      name: listing.title,
    })),
  };
}

/**
 * JSON-LD para FAQ (usado no Help Center futuro)
 */
export function generateFAQJsonLd(items: { question: string; answer: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
