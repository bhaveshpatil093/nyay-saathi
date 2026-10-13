import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const mainContainer = document.getElementById('main-scroll-container');
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }
  }, [pathname]);

  return null;
};
