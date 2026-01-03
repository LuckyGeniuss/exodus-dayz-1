import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  product?: {
    name: string;
    price: number;
    currency?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    image?: string;
    description?: string;
    category?: string;
    rating?: number;
    reviewCount?: number;
  };
}

const BASE_URL = 'https://exodus-dayz.lovable.app';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const SITE_NAME = 'Exodus DayZ Shop';

export const useSEO = ({
  title,
  description,
  image,
  url,
  type = 'website',
  product,
}: SEOProps) => {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const fullDescription = description || 'Офіційний магазин Exodus DayZ - пріоритет, транспорт, набори та косметичні предмети для серверів DayZ.';
    const fullImage = image || DEFAULT_IMAGE;
    const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;

    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta
    updateMeta('description', fullDescription);
    updateMeta('robots', 'index, follow');

    // Open Graph
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', fullDescription, true);
    updateMeta('og:image', fullImage, true);
    updateMeta('og:url', fullUrl, true);
    updateMeta('og:type', type, true);
    updateMeta('og:site_name', SITE_NAME, true);
    updateMeta('og:locale', 'uk_UA', true);

    // Twitter Cards
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', fullDescription);
    updateMeta('twitter:image', fullImage);

    // Product-specific structured data
    if (product) {
      const existingScript = document.querySelector('script[data-seo-ld]');
      if (existingScript) {
        existingScript.remove();
      }

      const ldJson = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || fullDescription,
        image: product.image || fullImage,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: product.currency || 'UAH',
          availability: `https://schema.org/${product.availability || 'InStock'}`,
          url: fullUrl,
        },
        ...(product.category && { category: product.category }),
        ...(product.rating && product.reviewCount && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }),
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-ld', 'true');
      script.textContent = JSON.stringify(ldJson);
      document.head.appendChild(script);
    }

    // Cleanup
    return () => {
      const ldScript = document.querySelector('script[data-seo-ld]');
      if (ldScript) ldScript.remove();
    };
  }, [title, description, image, url, type, product]);
};

export const generateBreadcrumbLD = (items: { name: string; url: string }[]) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

export const generateOrganizationLD = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Exodus DayZ',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Офіційний магазин серверів Exodus DayZ',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${BASE_URL}/contact`,
    },
  };
};
