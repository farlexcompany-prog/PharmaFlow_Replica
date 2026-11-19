window.PharmaRouter = (() => {
  const routes = {
    '/': {
      title: 'Home — PharmaFlow',
      render: (el) => {
        el.innerHTML = `
          <div class="pf-card p-4">
            <h4 class="fw-bold mb-2">Welcome to PharmaFlow</h4>
            <p class="text-muted mb-3">Access product catalogs, promotional tools, downloads, certificates, and portals in one place.</p>
            <div class="d-flex flex-wrap gap-2">
              <a href="/downloads" data-link class="btn btn-primary btn-sm"><i class="bi bi-download me-1"></i>Open Downloads</a>
              <a href="/products" data-link class="btn btn-outline-primary btn-sm"><i class="bi bi-capsule me-1"></i>Browse Products</a>
              <a href="/contact" data-link class="btn btn-outline-secondary btn-sm"><i class="bi bi-envelope me-1"></i>Contact Us</a>
            </div>
          </div>`;
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
        if (window.PharmaReminderCard) {
          window.PharmaReminderCard.mount(el);
        } else {
          el.innerHTML = `
            <div class="pf-card p-4">
              <h4 class="fw-bold mb-2">Reminder Cards</h4>
              <p class="text-muted mb-0">Reminder Card builder module is being initialized.</p>
            </div>`;
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
              <p class="text-muted mb-0">Custom Reminder Card builder module is being initialized.</p>
            </div>`;
        }
      },
    },
  };

  function getRoutePath() {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/')) {
      let hPath = hash.slice(1);
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
    if (cleanUrl === window.location.pathname) return;
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