<?php
// public/index.php
declare(strict_types=1);
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Best Pharma Franchise Company | Monopoly Pharma Company — Farlex PharmaFlow</title>
  <base href="/">
  <link rel="stylesheet" href="assets/vendor/bootstrap/css/bootstrap.min.css">
  <link rel="stylesheet" href="assets/vendor/icons/bootstrap-icons.min.css">
  <link rel="stylesheet" href="assets/css/app.css">
  <link rel="stylesheet" href="assets/css/app-shell.css">
  <link rel="stylesheet" href="assets/css/custom-reminder-cards.css">
  <link rel="stylesheet" href="assets/css/rewards_catalogue.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <div class="pf-shell" id="pfShell">
    <!-- Top Header -->
    <header class="pf-header d-flex align-items-center justify-content-between px-3 px-lg-4">
      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-outline-secondary btn-sm pf-menu-btn" id="menuToggleBtn" type="button" aria-label="Toggle navigation menu">
          <i class="bi bi-list fs-5"></i>
        </button>
        <a href="#/" class="pf-brand text-decoration-none d-flex align-items-center gap-2">
          <span class="pf-brand-badge">FP</span>
          <div>
            <div class="pf-brand-title">Farlex PharmaFlow</div>
            <div class="pf-brand-sub d-none d-sm-block">Farlex Pharmaceuticals Pvt. Ltd.</div>
          </div>
        </a>
      </div>

      <div class="d-flex align-items-center gap-2">
        <div class="pf-search-box position-relative">
          <i class="bi bi-search pf-search-icon"></i>
          <input type="search" id="menuSearchInput" class="form-control form-control-sm pf-search-input" placeholder="Search menu (⌘K)..." autocomplete="off">
          <div class="pf-search-results shadow-sm d-none" id="menuSearchResults"></div>
        </div>
      </div>
    </header>

    <div class="pf-body d-flex">
      <!-- Backdrop for mobile drawer -->
      <div class="pf-backdrop d-lg-none" id="sidebarBackdrop"></div>

      <!-- Sidebar Navigation -->
      <aside class="pf-sidebar" id="pfSidebar">
        <nav class="pf-nav py-3 px-2" aria-label="Primary Navigation">
          <div class="pf-nav-section">Workspace</div>
          <a href="#/" class="pf-nav-link" data-route="/">
            <i class="bi bi-house-door"></i><span>Home</span>
          </a>
          <a href="#/products" class="pf-nav-link" data-route="/products">
            <i class="bi bi-capsule"></i><span>Products</span>
          </a>
          <a href="#/gifts" class="pf-nav-link" data-route="/gifts">
            <i class="bi bi-gift"></i><span>Gifts</span>
          </a>
          <a href="#/unique-products" class="pf-nav-link" data-route="/unique-products">
            <i class="bi bi-stars"></i><span>Unique Products</span>
          </a>

          <div class="pf-nav-section mt-3">Promotional Tools</div>
          <a href="#/reminder-cards" class="pf-nav-link" data-route="/reminder-cards">
            <i class="bi bi-card-text"></i><span>Reminder Cards</span>
          </a>
          <a href="#/custom-reminder-cards" class="pf-nav-link" data-route="/custom-reminder-cards">
            <i class="bi bi-sliders"></i><span>Custom Reminder Cards</span>
          </a>
          <a href="#/videos" class="pf-nav-link" data-route="/videos">
            <i class="bi bi-play-circle"></i><span>Videos</span>
          </a>
          <a href="#/image-reminder-cards" class="pf-nav-link" data-route="/image-reminder-cards">
            <i class="bi bi-images"></i><span>Image Reminder Cards</span>
          </a>

          <div class="pf-nav-section mt-3">Resources &amp; Utilities</div>
          <a href="#/downloads" class="pf-nav-link" data-route="/downloads">
            <i class="bi bi-download"></i><span>Downloads</span>
          </a>
          <a href="#/certificate" class="pf-nav-link" data-route="/certificate">
            <i class="bi bi-patch-check"></i><span>Certificate</span>
          </a>
          <a href="#/visiting-cards" class="pf-nav-link" data-route="/visiting-cards">
            <i class="bi bi-person-badge"></i><span>Visiting Cards</span>
          </a>

          <div class="pf-nav-section mt-3">Portals &amp; Support</div>
          <a href="#/login/customer" class="pf-nav-link" data-route="/login/customer">
            <i class="bi bi-box-arrow-in-right"></i><span>Customer Login</span>
          </a>
          <a href="#/login/employee" class="pf-nav-link" data-route="/login/employee">
            <i class="bi bi-briefcase"></i><span>Employee Login</span>
          </a>
          <a href="#/login/store" class="pf-nav-link" data-route="/login/store">
            <i class="bi bi-shop"></i><span>Store Login</span>
          </a>
          <a href="#/contact" class="pf-nav-link" data-route="/contact">
            <i class="bi bi-envelope"></i><span>Contact Us</span>
          </a>
        </nav>
      </aside>

      <!-- Main Dynamic Content -->
      <main class="pf-main flex-grow-1 p-3 p-md-4">
        <div id="app-view"></div>
      </main>
    </div>
  </div>

  <!-- Toast Notification Container -->
  <div class="toast-container position-fixed bottom-0 end-0 p-3" id="pfToastContainer"></div>

  <script src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
  <script src="assets/js/router.js"></script>
  <script src="assets/js/downloads.js"></script>
  <script src="assets/js/app.js"></script>
  <script src="assets/js/customer_login.js"></script>
  <script src="assets/js/contact.js"></script>
  <script src="assets/js/products.js"></script>
  <script src="assets/js/reminder_card.js"></script>
  <script src="assets/js/fixed_reminder_cards.js"></script>
  <script src="assets/js/rewards_catalogue.js"></script>

  <script>
    // (function () {
    //   const appView = document.getElementById('app-view');

    //   function getRouteKey() {
    //     const path = (window.location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
    //     const hash = (window.location.hash || '').toLowerCase();

    //     if (path.endsWith('/gifts') || path.endsWith('/gift') || hash.startsWith('#/gifts') || hash.startsWith('#/rewards-catalogue')) {
    //       return 'gifts';
    //     }
    //     if (path.endsWith('/claim-gift') || hash.startsWith('#/claim-gift')) {
    //       return 'claim';
    //     }
    //     if (hash.startsWith('#/scheme-terms')) {
    //       return 'terms';
    //     }
    //     if (path === '/' || path.endsWith('/index.php') || hash === '' || hash === '#' || hash === '#/') {
    //       return 'home';
    //     }
    //     return 'other';
    //   }

    //   async function loadHomeIntoAppView() {
    //     if (!appView) return;
    //     // Agar router.js ne pehle se kuch render kiya hai toh tabhi home load karo jab empty ho ya home route ho
    //     try {
    //       const res = await fetch('home.html', { cache: 'no-store' });
    //       if (!res.ok) return;
    //       const htmlText = await res.text();
    //       const parser = new DOMParser();
    //       const doc = parser.parseFromString(htmlText, 'text/html');

    //       // <body> ke andar ka content uthao (scripts alag se chalayenge)
    //       const bodyClone = doc.body.cloneNode(true);
    //       const scripts = [...bodyClone.querySelectorAll('script')];
    //       scripts.forEach((s) => s.remove());

    //       appView.innerHTML = bodyClone.innerHTML;

    //       for (const oldScript of scripts) {
    //         const s = document.createElement('script');
    //         if (oldScript.src) {
    //           s.src = oldScript.src;
    //           document.body.appendChild(s);
    //         } else {
    //           try {
    //             new Function(oldScript.textContent || '')();
    //           } catch (err) {
    //             console.error('Home script error:', err);
    //           }
    //         }
    //       }
    //     } catch (err) {
    //       console.error('Failed to load home.html:', err);
    //     }
    //   }

    //   function handleRouteView() {
    //     const route = getRouteKey();
    //     if (route === 'home') {
    //       setTimeout(() => {
    //         if (appView && appView.innerHTML.trim() === '') {
    //           loadHomeIntoAppView();
    //         }
    //       }, 120);
    //     } else if ((route === 'gifts' || route === 'claim' || route === 'terms') && window.PharmaRewardsCatalogue && appView) {
    //       const viewName = route === 'claim' ? 'claim' : route === 'terms' ? 'terms' : 'catalogue';
    //       window.PharmaRewardsCatalogue.mount(appView, { view: viewName });
    //     }
    //   }

    //   document.addEventListener('DOMContentLoaded', () => {
    //     handleRouteView();
    //     if (getRouteKey() === 'home') {
    //       setTimeout(loadHomeIntoAppView, 200);
    //     }
    //   });

    //   window.addEventListener('hashchange', handleRouteView);
    //   window.addEventListener('popstate', handleRouteView);
    // })();
  </script>
</body>
</html>