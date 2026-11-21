window.PharmaRouter = (() => {
  let homeStylesInjected = false;

  async function renderFarlexHome(el) {
    el.innerHTML = `
      <div class="pf-card p-4 text-center text-muted">
        Loading Farlex Pharmaceuticals Home...
      </div>`;

    try {
      const res = await fetch('home.html', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Could not load home.html (HTTP ${res.status})`);
      }

      const htmlText = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      if (!document.getElementById('pf-tailwind-cdn')) {
        window.tailwind = window.tailwind || {};
        window.tailwind.config = {
          corePlugins: {
            preflight: false,
          },
        };
        const tw = document.createElement('script');
        tw.id = 'pf-tailwind-cdn';
        tw.src = 'https://cdn.tailwindcss.com';
        document.head.appendChild(tw);
      }

      if (!homeStylesInjected) {
        doc.querySelectorAll('style').forEach((styleTag, idx) => {
          const styleEl = document.createElement('style');
          styleEl.id = `pf-home-style-${idx}`;
          styleEl.textContent = styleTag.textContent || '';
          document.head.appendChild(styleEl);
        });
        homeStylesInjected = true;
      }

      const bodyClone = doc.body.cloneNode(true);
      const inlineScripts = [];

      bodyClone.querySelectorAll('script').forEach((sc) => {
        if (!sc.src && sc.textContent && sc.textContent.trim()) {
          inlineScripts.push(sc.textContent);
        }
        sc.remove();
      });

      // Remove duplicate top bar (first child div in body), sticky header, and footer
      const firstDiv = bodyClone.querySelector('body > div, div');
      if (firstDiv && firstDiv.querySelector('a[href^="tel:"]')) {
        firstDiv.remove();
      }
      bodyClone.querySelectorAll('header').forEach((node) => node.remove());
      // Keep the floating contact and chatbot controls visible on the homepage.
      bodyClone.querySelectorAll('.fixed:not(#farlexFloatingGroup)').forEach((fixedEl) => fixedEl.remove());

      el.innerHTML = `
        <div class="farlex-home-merged bg-white rounded-4 border p-3 p-md-4">
          ${bodyClone.innerHTML}
        </div>`;

      const runInlineScripts = () => {
        // Expose safe fallback handlers before running scripts
        window.setSlide = window.setSlide || (() => {});
        window.nextSlide = window.nextSlide || (() => {});
        window.prevSlide = window.prevSlide || (() => {});
        window.openLightbox = window.openLightbox || (() => {});
        window.closeLightbox = window.closeLightbox || (() => {});

        inlineScripts.forEach((code, idx) => {
          try {
            const safeCode = `
              (function () {
                const _byId = (id) => document.getElementById(id);
                ${code}
                if (typeof setSlide === 'function') window.setSlide = setSlide;
                if (typeof nextSlide === 'function') window.nextSlide = nextSlide;
                if (typeof prevSlide === 'function') window.prevSlide = prevSlide;
                if (typeof openLightbox === 'function') window.openLightbox = openLightbox;
                if (typeof closeLightbox === 'function') window.closeLightbox = closeLightbox;
              })();
            `;
            new Function(safeCode)();
          } catch (err) {
            console.warn(`Home inline script #${idx} skipped/handled:`, err.message);
          }
        });

        // Safe year & icons initialization even if footer was removed
        const yearEl = document.getElementById('yearNow');
        if (yearEl) {
          yearEl.textContent = String(new Date().getFullYear());
        }
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
      };

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        runInlineScripts();
      } else {
        const lucideScript = document.createElement('script');
        lucideScript.src = 'https://unpkg.com/lucide@latest';
        lucideScript.onload = runInlineScripts;
        lucideScript.onerror = runInlineScripts;
        document.body.appendChild(lucideScript);
      }
    } catch (err) {
      console.error('Failed to render home.html:', err);
      el.innerHTML = `
        <div class="pf-card p-4">
          <div class="alert alert-warning mb-0">
            Unable to load <code>home.html</code>: ${err.message}.
          </div>
        </div>`;
    }
  }

  const routes = {
    '/': {
      title: 'Best Pharma Franchise Company | Monopoly Pharma Company — Farlex PharmaFlow',
      render: (el) => {
        renderFarlexHome(el);
      },
    },
    '/downloads': {
      title: 'Downloads — PharmaFlow',
      render: (el) => {
        if (window.PharmaDownloads) {
          window.PharmaDownloads.mount(el);
        }
      },
    },
    '/login/customer': {
      title: 'Customer Login — PharmaFlow',
      render: (el) => {
        if (window.PharmaCustomerLogin) {
          window.PharmaCustomerLogin.mount(el);
        }
      },
    },
    '/gifts': {
      title: 'Gift Cards — Farlex Rewards',
      render: (el, params) => {
        if (window.PharmaRewardsCatalogue) {
          window.PharmaRewardsCatalogue.mount(el, { view: 'catalogue', params });
        } else if (window.PharmaGifts) {
          window.PharmaGifts.mount(el);
        } else {
          el.innerHTML = '<div class="alert alert-warning">Gift module not loaded. Check script path in public/index.php.</div>';
        }
      },
    },
    '/contact': {
      title: 'Contact Us — Farlex PharmaFlow',
      render: (el) => {
        if (window.PharmaContact) {
          window.PharmaContact.mount(el);
        }
      },
    },
    '/products': {
      title: 'Products — Farlex PharmaFlow',
      render: (el) => {
        if (window.PharmaProducts) {
          window.PharmaProducts.mount(el);
        } else {
          el.innerHTML = `<div class="alert alert-warning">Products module is not loaded. Check <code>assets/js/products.js</code> path in <code>index.php</code>.</div>`;
        }
      },
    },
    '/reminder-cards': {
      title: 'Reminder Cards — Farlex PharmaFlow',
      render: (el) => {
        if (window.PharmaFixedReminderCards) {
          window.PharmaFixedReminderCards.mount(el);
        } else {
          el.innerHTML = `<div class="alert alert-warning">Fixed Reminder Cards module is not loaded.</div>`;
        }
      },
    },
    '/rewards-catalogue': {
      title: 'Partner Rewards – Gift Catalogue | Farlex Rewards',
      render: (el, params) => {
        if (window.PharmaRewardsCatalogue) {
          window.PharmaRewardsCatalogue.mount(el, { view: 'catalogue', params });
        }
      },
    },
    '/gift': {
      title: 'Gift Details | Farlex Rewards',
      render: (el, params) => {
        if (window.PharmaRewardsCatalogue) {
          window.PharmaRewardsCatalogue.mount(el, { view: 'detail', params });
        }
      },
    },
    '/claim-gift': {
      title: 'Claim Gift | Farlex Rewards',
      render: (el, params) => {
        if (window.PharmaRewardsCatalogue) {
          window.PharmaRewardsCatalogue.mount(el, { view: 'claim', params });
        }
      },
    },
    '/scheme-terms': {
      title: 'Scheme Terms | Farlex Rewards',
      render: (el, params) => {
        if (window.PharmaRewardsCatalogue) {
          window.PharmaRewardsCatalogue.mount(el, { view: 'terms', params });
        }
      },
    },
    '/custom-reminder-cards': {
      title: 'Custom Reminder Cards — Farlex PharmaFlow',
      render: (el) => {
        if (window.PharmaReminderCard) {
          window.PharmaReminderCard.mount(el);
        } else {
          el.innerHTML = `
            <div class="pf-card p-4">
              <h4 class="fw-bold mb-2">Custom Reminder Cards</h4>
              <p class="text-muted mb-0">Custom reminder card builder module is being initialized.</p>
            </div>`;
        }
      },
    },
  };

  function getRoutePath() {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/')) {
      let hPath = hash.slice(1).split('?')[0];
      if (hPath.length > 1 && hPath.endsWith('/')) hPath = hPath.slice(0, -1);
      return hPath || '/';
    }

    let path = window.location.pathname || '/';
    path = path.replace(/^\/PHARMA-FLOW\/public(?=\/|$)/i, '') || '/';
    if (!path.startsWith('/')) path = `/${path}`;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return path;
  }

  function setActiveNav(path) {
    document.querySelectorAll('.pf-nav-link').forEach((link) => {
      const rawRoute = link.getAttribute('data-route') || link.getAttribute('href') || '';
      const cleanRoute = rawRoute.replace(/^#/, '');
      link.classList.toggle('active', cleanRoute === path);
    });
  }

  function navigateTo(url) {
    const cleanUrl = url.replace(/^#/, '');
    const currentFull = window.location.pathname + window.location.search;
    if (cleanUrl === currentFull) return;
    window.history.pushState({}, '', cleanUrl);
    resolve();
  }

  function resolve() {
    const path = getRoutePath();
    const viewEl = document.getElementById('app-view');
    if (!viewEl) return;

    setActiveNav(path);

    if (routes[path]) {
      document.title = routes[path].title;
      routes[path].render(viewEl);
      return;
    }

    const niceName = path
      .replace(/^\//, '')
      .split('/')
      .map((part) => part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
      .join(' — ');

    document.title = `${niceName || 'Section'} — PharmaFlow`;
    viewEl.innerHTML = `
      <div class="pf-card p-4">
        <h4 class="fw-bold mb-2">${niceName || 'Section'}</h4>
        <p class="text-muted mb-3">This section is ready for full implementation.</p>
        <a href="/products" data-link class="btn btn-outline-primary btn-sm">Browse Products</a>
      </div>`;
  }

  function init() {
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (
        !href ||
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.target === '_blank'
      ) {
        return;
      }

      if (href.startsWith('#/') || href.startsWith('/')) {
        e.preventDefault();
        navigateTo(href);
      }
    });
    window.addEventListener('hashchange', resolve);
    window.addEventListener('popstate', resolve);
    resolve();
  }

  return { init, navigateTo };
})();

window.PharmaRouter.init();