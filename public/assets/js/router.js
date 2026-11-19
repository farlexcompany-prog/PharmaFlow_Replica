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
              <a href="#/downloads" class="btn btn-primary btn-sm"><i class="bi bi-download me-1"></i>Open Downloads</a>
              <a href="#/products" class="btn btn-outline-primary btn-sm"><i class="bi bi-capsule me-1"></i>Browse Products</a>
              <a href="#/contact" class="btn btn-outline-secondary btn-sm"><i class="bi bi-envelope me-1"></i>Contact Us</a>
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
 


  };

  function getRoutePath() {
    const hash = window.location.hash || '#/';
    const clean = hash.replace(/^#/, '');
    return clean.startsWith('/') ? clean : `/${clean}`;
  }

  function setActiveNav(path) {
    document.querySelectorAll('.pf-nav-link').forEach((link) => {
      const linkRoute = link.getAttribute('data-route');
      link.classList.toggle('active', linkRoute === path);
    });
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
        <span class="badge bg-light text-dark border mb-2">Route: #${path}</span>
        <h4 class="fw-bold mb-2">${niceName}</h4>
        <p class="text-muted mb-3">This section is routed and ready for full feature implementation in the next steps.</p>
        <a href="#/downloads" class="btn btn-outline-primary btn-sm">Go to Downloads</a>
      </div>`;
  }

  function init() {
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  return { init };
})();