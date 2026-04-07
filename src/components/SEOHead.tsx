import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'VitrineMotors';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://vitrinemotors.com';
const DEFAULT_DESCRIPTION = 'Marketplace automotriz de Paraguay. Compra y vende vehiculos nuevos y usados.';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  /** JSON-LD structured data object(s) */
  jsonLd?: object | object[];
  /** Disable canonical URL (for dynamic pages that shouldn't be indexed) */
  noIndex?: boolean;
}

export function SEOHead({
  title,
  description,
  image,
  type = 'website',
  jsonLd,
  noIndex,
}: SEOHeadProps) {
  const location = useLocation();
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = `${SITE_URL}${location.pathname}`;

  // Normalize JSON-LD to array
  const jsonLdItems = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonicalUrl} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="es_PY" />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}

      {/* JSON-LD Structured Data */}
      {jsonLdItems.map((item, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
        >
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
