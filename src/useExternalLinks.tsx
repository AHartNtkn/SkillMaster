import { useEffect } from 'react';

export default function useExternalLinks() {
  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && /^https?:/i.test(href)) {
          e.preventDefault();
          if (window.confirm('Open in system browser?')) {
            window.open(href, '_blank');
          }
        }
      }
    }
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
}
