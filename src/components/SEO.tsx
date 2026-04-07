import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
}

const SITE_NAME = 'VitrineMotors';
const DEFAULT_DESCRIPTION = 'Marketplace automotriz de Paraguay. Compra y vende vehiculos nuevos y usados.';

export function SEO({ title, description, image }: SEOProps) {
  useEffect(() => {
    // Title
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    const desc = description || DEFAULT_DESCRIPTION;
    if (metaDesc) {
      metaDesc.setAttribute('content', desc);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = desc;
      document.head.appendChild(meta);
    }

    // OG tags
    setMetaTag('og:title', title || SITE_NAME);
    setMetaTag('og:description', desc);
    setMetaTag('og:site_name', SITE_NAME);
    setMetaTag('og:type', 'website');
    if (image) setMetaTag('og:image', image);

    return () => {
      document.title = SITE_NAME;
    };
  }, [title, description, image]);

  return null;
}

function setMetaTag(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (meta) {
    meta.setAttribute('content', content);
  } else {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }
}
