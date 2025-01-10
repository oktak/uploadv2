import { useEffect } from 'react';

type MatomoTrackerProps = {
  siteId: string;
  matomoUrl: string;
};

const MatomoTracker = ({ siteId, matomoUrl }: MatomoTrackerProps) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    script.src = `${matomoUrl}/matomo.js`;
    document.body.appendChild(script);

    window._paq = window._paq || [];
    window._paq.push(['trackPageView']);
    window._paq.push(['enableLinkTracking']);
    window._paq.push(['setTrackerUrl', `${matomoUrl}/matomo.php`]);
    window._paq.push(['setSiteId', siteId]);
  }, [siteId, matomoUrl]);

  return null;
};

export default MatomoTracker;
