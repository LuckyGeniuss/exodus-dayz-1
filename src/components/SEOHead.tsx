import { useEffect } from 'react';
import { generateOrganizationLD } from '@/hooks/useSEO';

interface SEOHeadProps {
  includeOrganization?: boolean;
  canonicalUrl?: string;
}

const SEOHead = ({ includeOrganization = false, canonicalUrl }: SEOHeadProps) => {
  useEffect(() => {
    // Add canonical URL if provided
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonicalUrl;
    }

    // Add organization structured data
    if (includeOrganization) {
      const existingOrgScript = document.querySelector('script[data-org-ld]');
      if (!existingOrgScript) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-org-ld', 'true');
        script.textContent = JSON.stringify(generateOrganizationLD());
        document.head.appendChild(script);
      }
    }

    return () => {
      if (includeOrganization) {
        const orgScript = document.querySelector('script[data-org-ld]');
        if (orgScript) orgScript.remove();
      }
    };
  }, [includeOrganization, canonicalUrl]);

  return null;
};

export default SEOHead;
