// public/assets/js/rewards_catalogue.js
window.PharmaRewardsCatalogue = (() => {
  const BRAND_NAME = 'Farlex Rewards';
  const COMPANY_NAME = 'Farlex Pharmaceuticals Pvt. Ltd.';
  const LOCATION_TEXT = 'Panchkula, Haryana, India';
  const ITEMS_PER_PAGE = 15;
  const TERMS_STORAGE_KEY = 'farlex_rewards_scheme_terms_v1';

  const CATEGORIES = [
    'Home Appliances',
    'Kitchen',
    'Electronics',
    'Travel & Bags',
    'Personal Care',
    'Health Devices',
  ];

  const UNDER_CHIPS = [12500, 25000, 50000, 100000, 500000];

  const POINT_CHECKBOX_TIERS = [
    7500, 12500, 17500, 25000, 37500, 50000, 75000, 87500,
    100000, 250000, 375000, 500000, 750000, 1000000, 1500000, 2000000,
  ];

  const DEFAULT_TERMS_HTML = `
    <p><strong>1. Eligibility &amp; Points:</strong> Only authorized business partners and distributors registered under ${COMPANY_NAME} earn loyalty points against qualifying commercial transactions.</p>
    <p><strong>2. Gift Selection &amp; Reference:</strong> Gift shown is for reference. Actual gift and brand may vary based on availability.</p>
    <p><strong>3. Commercial Verification:</strong> Gift dispatch is subject to fulfillment of internal commercial criteria and account reconciliation.</p>
    <p><strong>4. Dispatch &amp; Delivery:</strong> Claims submitted through the portal are verified prior to dispatch to the registered partner delivery address in India.</p>
  `;

  const state = {
    gifts: [],
    loaded: false,
    announcementVisible: true,
    category: '',
    maxPoints: null,
    selectedPoints: [],
    searchQuery: '',
    page: 1,
    cartGift: null,
    activeGiftId: '',
    drawerOpen: false,
    editingTerms: false,
  };

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatIndianPoints(num) {
    const n = Number(num) || 0;
    return n.toLocaleString('en-IN');
  }

  (function () {
  if (window.__farlexClaimBound) return;
  window.__farlexClaimBound = true;

  function getClaimEndpoint() {
    const base = document.querySelector('base')?.getAttribute('href') || '/';
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${normalizedBase}/api/gift_claims.php`.replace(/\/{2,}/g, '/');
  }

  function findFormField(form, keys) {
    for (const key of keys) {
      const el =
        form.querySelector(`[name="${key}"]`) ||
        form.querySelector(`#${key}`) ||
        form.querySelector(`[data-field="${key}"]`);
      if (el) return el;
    }
    return null;
  }

  function showClaimFeedback(form, message, isError = false) {
    let box = form.querySelector('.claim-feedback-msg');
    if (!box) {
      box = document.createElement('div');
      box.className = 'claim-feedback-msg';
      box.style.marginTop = '12px';
      box.style.padding = '10px 14px';
      box.style.borderRadius = '8px';
      box.style.fontSize = '14px';
      box.style.fontWeight = '500';
      form.appendChild(box);
    }
    box.textContent = message;
    box.style.background = isError ? '#fef2f2' : '#ecfdf5';
    box.style.color = isError ? '#991b1b' : '#065f46';
    box.style.border = isError ? '1px solid #fecaca' : '1px solid #a7f3d0';
  }

  async function submitClaim(form) {
    if (!form || form.dataset.submitting === '1') return;

    const ledgerEl = findFormField(form, ['ledger_name', 'ledgerName', 'partner_name', 'ledger-name']);
    const partyEl  = findFormField(form, ['party_code', 'partyCode', 'partner_code', 'party-code']);
    const phoneEl  = findFormField(form, ['contact_no', 'contactNo', 'phone', 'contact-no']);
    const addrEl   = findFormField(form, ['address', 'claim_address', 'claim-address']);
    const giftEl   = findFormField(form, ['selected_gift', 'selectedGift', 'gift', 'selected-gift']);

    const payload = {
      ledger_name: String(ledgerEl?.value || '').trim(),
      party_code: String(partyEl?.value || '').trim(),
      contact_no: String(phoneEl?.value || '').trim(),
      address: String(addrEl?.value || '').trim(),
      selected_gift: String(giftEl?.value || '').trim(),
    };

    if (!payload.ledger_name || !payload.party_code || !payload.contact_no || !payload.address || !payload.selected_gift) {
      showClaimFeedback(form, 'Please fill Ledger Name, Party code, Contact no, Address, and Selected gift.', true);
      return;
    }

    const btn = form.querySelector('button[type="submit"], input[type="submit"], .claim-submit-btn');
    const prevText = btn ? btn.textContent : '';
    form.dataset.submitting = '1';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Submitting...';
    }

    try {
      const res = await fetch(getClaimEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let data = {};
      try {
        data = JSON.parse(raw);
      } catch (_) {
        throw new Error(`Invalid response: ${raw.slice(0, 120)}`);
      }

      if (!res.ok || !data.ok) {
        showClaimFeedback(form, data.error || 'Could not submit claim.', true);
        return;
      }

      showClaimFeedback(form, `Claim #${data.claim_id} submitted successfully!`, false);
      form.reset();
    } catch (err) {
      console.error('Claim error:', err);
      showClaimFeedback(form, err.message || 'Server/network error while submitting claim.', true);
    } finally {
      form.dataset.submitting = '0';
      if (btn) {
        btn.disabled = false;
        btn.textContent = prevText || 'Submit claim request';
      }
    }
  }

  document.addEventListener('submit', function (event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const isClaimForm =
      form.matches('#giftClaimForm, #claimGiftForm, .gift-claim-form, [data-claim-form]') ||
      Boolean(findFormField(form, ['ledger_name', 'party_code', 'contact_no', 'selected_gift']));

    if (isClaimForm) {
      event.preventDefault();
      submitClaim(form);
    }
  });

  document.addEventListener('click', function (event) {
    const btn = event.target.closest('button, [role="button"], input[type="submit"]');
    if (!btn) return;

    const text = String(btn.textContent || btn.value || '').trim().toLowerCase();
    if (btn.matches('.claim-submit-btn, [data-submit-claim]') || text.includes('submit claim')) {
      const form =
        btn.closest('form') ||
        document.querySelector('#giftClaimForm, #claimGiftForm, .gift-claim-form, [data-claim-form]');
      if (form) {
        event.preventDefault();
        submitClaim(form);
      }
    }
  });
})();

  function getCardTierLabel(pts) {
    const n = Number(pts) || 0;
    if (n >= 1000000) return 'Platinum Card';
    if (n >= 250000) return 'Gold Card';
    if (n >= 50000) return 'Silver Card';
    return 'Reward Card';
  }

  function slugToCategory(slug) {
    if (!slug) return '';
    const clean = decodeURIComponent(slug).replace(/-/g, ' ').trim().toLowerCase();
    return CATEGORIES.find((c) => c.toLowerCase() === clean) || decodeURIComponent(slug).trim();
  }

  function categoryToSlug(cat) {
    return String(cat || '').trim().toLowerCase().replace(/\s+/g, '-');
  }

  function syncStateFromUrl() {
    const hash = window.location.hash || '';
    const queryPart = hash.includes('?') ? hash.split('?')[1] : window.location.search.replace(/^\?/, '');
    const params = new URLSearchParams(queryPart);

    const catParam = params.get('category') || '';
    state.category = catParam ? slugToCategory(catParam) : '';

    const maxPtsParam = params.get('max_points');
    state.maxPoints = maxPtsParam && !Number.isNaN(Number(maxPtsParam)) ? Number(maxPtsParam) : null;

    const ptsParam = params.get('points') || '';
    state.selectedPoints = ptsParam
      ? ptsParam.split(',').map((v) => Number(v.trim())).filter((n) => !Number.isNaN(n) && n > 0)
      : [];

    const pageParam = Number(params.get('page') || '1');
    state.page = !Number.isNaN(pageParam) && pageParam > 0 ? pageParam : 1;

    const giftParam = params.get('gift') || '';
    const ptsGiftParam = params.get('gift_points') || params.get('points_val') || '';
    if (giftParam && !state.cartGift) {
      state.cartGift = {
        id: 'url-gift',
        name: giftParam,
        points: Number(ptsGiftParam) || 0,
      };
    }
  }

  function syncUrlFromState() {
    const params = new URLSearchParams();
    if (state.category) params.set('category', categoryToSlug(state.category));
    if (state.maxPoints !== null) params.set('max_points', String(state.maxPoints));
    if (state.selectedPoints.length) params.set('points', state.selectedPoints.join(','));
    if (state.page > 1) params.set('page', String(state.page));

    const queryStr = params.toString();
    const currentHash = window.location.hash || '#/rewards-catalogue';
    const baseRoute = currentHash.split('?')[0] || '#/rewards-catalogue';
    const nextHash = queryStr ? `${baseRoute}?${queryStr}` : baseRoute;
    if (window.location.hash !== nextHash) {
      history.replaceState(null, '', nextHash);
    }
  }

  async function ensureGiftsLoaded() {
    if (state.loaded) return;

    const apiCandidates = [
        'api/gifts.php',
        '../api/gifts.php',
        '/api/gifts.php',
        '/PHARMA-FLOW/api/gifts.php',
    ];

    for (const url of apiCandidates) {
      try {
        const res = await fetch(url);
        const text = (await res.text()).trim();
        if (!text || text.startsWith('<!') || text.startsWith('<html')) continue;
        const data = JSON.parse(text);
        const list = Array.isArray(data) ? data : (Array.isArray(data.gifts) ? data.gifts : []);
        if (res.ok && list.length) {
          state.gifts = [...list].sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
          state.loaded = true;
          return;
        }
      } catch (_) {}
    }

    const jsonCandidates = [
      'assets/data/gifts.json',
      '/assets/data/gifts.json',
      '../assets/data/gifts.json',
    ];

    for (const url of jsonCandidates) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          state.gifts = [...data].sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
          state.loaded = true;
          return;
        }
      } catch (_) {}
    }

    state.loaded = true;
  }

  function getFilteredGifts() {
    return state.gifts.filter((item) => {
      const pts = Number(item.points || 0);
      if (state.category && String(item.category).toLowerCase() !== state.category.toLowerCase()) {
        return false;
      }
      if (state.maxPoints !== null && pts > state.maxPoints) {
        return false;
      }
      if (state.selectedPoints.length && !state.selectedPoints.includes(pts)) {
        return false;
      }
      if (state.searchQuery.trim()) {
        const q = state.searchQuery.trim().toLowerCase();
        const hay = `${item.name} ${item.category} ${item.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

    function buildClaimUrl(gift) {
        const q = new URLSearchParams({
            gift: String(gift.name || ''),
            points: String(Number(gift.points || 0)),
        });
        const basePath = window.location.pathname.includes('/gifts')
          ? window.location.pathname.replace(/\/gifts\/?$/, '/claim-gift')
          : '/PHARMA-FLOW/public/claim-gift';
        return `${basePath}?${q.toString()}`;
  }

  function getSavedTermsHtml() {
    try {
      return localStorage.getItem(TERMS_STORAGE_KEY) || DEFAULT_TERMS_HTML;
    } catch (_) {
      return DEFAULT_TERMS_HTML;
    }
  }

  function renderTopBarAndCartDrawer() {
    const cartCount = state.cartGift ? 1 : 0;
    const announcementHtml = state.announcementVisible
      ? `
      `
      : '';

    const disclaimersHtml = `
      <div class="rc-disclaimers">
        <div>Gift shown is for reference. Actual gift and brand may vary based on availability.</div>
        <div>Gift dispatch is subject to fulfillment of internal commercial criteria.</div>
      </div>
    `;

    const cartDrawerHtml = state.drawerOpen
      ? `
        <div class="position-fixed top-0 end-0 bottom-0 bg-white shadow-lg border-start p-4 d-flex flex-column justify-content-between" style="width: min(100%, 370px); z-index: 1085;" role="dialog" aria-modal="true" aria-label="Cart Drawer">
          <div>
            <div class="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
              <h5 class="fw-bold mb-0">Gift Card Bag (${cartCount})</h5>
              <button type="button" class="btn-close" data-rc-close-drawer aria-label="Close"></button>
            </div>
            ${
              state.cartGift
                ? `
                  <div class="border rounded-3 p-3 bg-light mb-3">
                    <div class="badge bg-primary mb-1">Selected Gift Card</div>
                    <div class="fw-bold text-dark">${escapeHtml(state.cartGift.name)}</div>
                    <div class="text-primary fw-bold mt-1">${formatIndianPoints(state.cartGift.points)} Points</div>
                  </div>
                  <a href="${buildClaimUrl(state.cartGift)}" class="btn rc-btn-primary w-100 mb-2">Proceed to Claim</a>
                  <button type="button" class="btn btn-outline-danger btn-sm w-100" data-rc-clear-cart>Remove Gift Card</button>
                `
                : `
                  <div class="text-center py-5">
                    <p class="fw-semibold text-dark mb-3">No products in the cart</p>
                    <button type="button" class="btn rc-btn-primary" data-rc-close-drawer>Continue Shopping</button>
                  </div>
                `
            }
          </div>
          <div class="small text-muted border-top pt-2">
            ${escapeHtml(BRAND_NAME)} • ${escapeHtml(LOCATION_TEXT)}
          </div>
        </div>
      `
      : '';

    return { announcementHtml, disclaimersHtml, cartDrawerHtml, cartCount };
  }

  function renderFooter() {
    const year = new Date().getFullYear();
    return `
      <footer class="mt-5 pt-4 pb-4 border-top bg-light rounded-3 px-4">
        <div class="row g-4 pb-3 border-bottom">
          <div class="col-md-4">
            <h6 class="fw-bold text-dark">${escapeHtml(BRAND_NAME)}</h6>
            <p class="small text-muted mb-0">The gift catalogue for our partners. Earn points, choose a gift and we dispatch it.</p>
          </div>
          <div class="col-md-4">
            <h6 class="fw-bold text-dark">Quick links</h6>
            <ul class="list-unstyled small mb-0">
              <li class="mb-1"><a href="#/rewards-catalogue" class="text-decoration-none text-secondary">Browse gifts</a></li>
              <li class="mb-1"><a href="#/claim-gift" class="text-decoration-none text-secondary">Claim a gift</a></li>
              <li><a href="#/scheme-terms" class="text-decoration-none text-secondary">Scheme terms</a></li>
            </ul>
          </div>
          <div class="col-md-4">
            <h6 class="fw-bold text-dark">Contact</h6>
            <div class="small text-muted">
              <div class="fw-semibold text-dark">${escapeHtml(COMPANY_NAME)}</div>
              <div>${escapeHtml(LOCATION_TEXT)}</div>
            </div>
          </div>
        </div>
        <div class="pt-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 small text-muted">
          <div>
            <div>Gift shown is for reference. Actual gift and brand may vary based on availability.</div>
            <div>Gift dispatch is subject to fulfillment of internal commercial criteria.</div>
          </div>
          <div class="fw-semibold">&copy; ${year} ${escapeHtml(BRAND_NAME)}</div>
        </div>
      </footer>
    `;
  }

  function renderCatalogueView(container) {
    const { announcementHtml, disclaimersHtml, cartDrawerHtml, cartCount } = renderTopBarAndCartDrawer();
    const filtered = getFilteredGifts();
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    if (state.page > totalPages) state.page = 1;

    const startIdx = (state.page - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    container.innerHTML = `
      <div class="rc-wrap py-2">
        ${announcementHtml}
        ${disclaimersHtml}

        <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-primary rounded-2 px-2 py-2">FR</span>
            <span class="fw-bold text-dark">${escapeHtml(BRAND_NAME)}</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <input
              type="search"
              class="form-control form-control-sm"
              placeholder="Search gift cards..."
              value="${escapeHtml(state.searchQuery)}"
              data-rc-search
              style="width: 190px;"
            >
            <button type="button" class="btn btn-outline-secondary btn-sm position-relative" data-rc-open-drawer>
              Cart <span class="badge bg-warning text-dark ms-1">${cartCount}</span>
            </button>
          </div>
        </div>

        <section class="rc-hero">
          <span class="badge text-bg-warning mb-2">Partner Loyalty Gift Cards</span>
          <h1 class="rc-hero-title mb-2">Rewards &amp; Gifts for Our Partners</h1>
          <p class="text-muted mb-3">Choose a gift card that matches your points and claim it in a few clicks.</p>
          <a href="#rc-all-gifts" class="btn rc-btn-primary">Browse Gift Cards</a>
        </section>

        <section class="mb-4">
          <h2 class="h5 fw-bold text-dark mb-3">How it works</h2>
          <div class="row g-3">
            <div class="col-md-4">
              <div class="rc-step-card">
                <div class="rc-step-badge">1</div>
                <h3 class="h6 fw-bold text-dark mb-1">Earn points</h3>
                <p class="small text-muted mb-0">earn points under the partner scheme</p>
              </div>
            </div>
            <div class="col-md-4">
              <div class="rc-step-card">
                <div class="rc-step-badge">2</div>
                <h3 class="h6 fw-bold text-dark mb-1">Choose gift</h3>
                <p class="small text-muted mb-0">pick a gift within your points</p>
              </div>
            </div>
            <div class="col-md-4">
              <div class="rc-step-card">
                <div class="rc-step-badge">3</div>
                <h3 class="h6 fw-bold text-dark mb-1">We dispatch</h3>
                <p class="small text-muted mb-0">we verify your claim and dispatch the gift</p>
              </div>
            </div>
          </div>
        </section>

        <section id="rc-all-gifts" class="pt-2">
          <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
            <div>
              <h2 class="h4 fw-bold text-dark mb-0">All Gift Cards</h2>
              <div class="small text-muted">Showing ${filtered.length} gift card(s) • Page ${state.page} of ${totalPages}</div>
            </div>
            <button type="button" class="btn btn-outline-primary btn-sm" data-bs-toggle="collapse" data-bs-target="#rcFilterPanel">
              Filter by Points &amp; Category
            </button>
          </div>

          <div class="mb-2 d-flex flex-wrap align-items-center gap-2">
            <span class="small fw-semibold text-muted">Category:</span>
            <button type="button" class="rc-chip ${!state.category ? 'is-active' : ''}" data-rc-cat="">All</button>
            ${CATEGORIES.map((cat) => `
              <button type="button" class="rc-chip ${state.category === cat ? 'is-active' : ''}" data-rc-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>
            `).join('')}
          </div>

          <div class="mb-3 d-flex flex-wrap align-items-center gap-2">
            <span class="small fw-semibold text-muted">Gifts under:</span>
            ${UNDER_CHIPS.map((pts) => `
              <button type="button" class="rc-chip ${state.maxPoints === pts ? 'is-active' : ''}" data-rc-under="${pts}">${formatIndianPoints(pts)}</button>
            `).join('')}
            <button type="button" class="rc-chip ${state.maxPoints === null ? 'is-active' : ''}" data-rc-under="">Show all</button>
          </div>

          <div class="collapse mb-3" id="rcFilterPanel">
            <div class="card card-body border bg-light">
              <div class="small fw-bold text-dark mb-2">Filter by Points (Exact Tiers)</div>
              <div class="d-flex flex-wrap gap-2">
                ${POINT_CHECKBOX_TIERS.map((tier) => {
                  const checked = state.selectedPoints.includes(tier) ? 'checked' : '';
                  return `
                    <label class="form-check form-check-inline small bg-white border rounded px-2 py-1 m-0">
                      <input class="form-check-input" type="checkbox" value="${tier}" data-rc-point-tier ${checked}>
                      <span class="form-check-label">${formatIndianPoints(tier)}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <div class="rc-grid">
            ${
              pageItems.length
                ? pageItems.map((g) => `
                    <article class="rc-card">
                      <div class="rc-gift-card-top">
                        <span>Farlex Gift Card</span>
                        <span class="rc-gift-card-tag">${escapeHtml(getCardTierLabel(g.points))}</span>
                      </div>
                      <a href="#/gift?id=${encodeURIComponent(g.id)}" class="rc-card-img-wrap">
                        <img src="${escapeHtml(g.image)}" alt="${escapeHtml(g.name)}" loading="lazy">
                      </a>
                      <div class="p-3 d-flex flex-column flex-grow-1 justify-content-between">
                        <div>
                          <span class="badge bg-primary-subtle text-primary border mb-1">${escapeHtml(g.category)}</span>
                          <h3 class="rc-card-title mb-2">
                            <a href="#/gift?id=${encodeURIComponent(g.id)}" class="text-decoration-none text-dark">${escapeHtml(g.name)}</a>
                          </h3>
                        </div>
                        <div>
                          <div class="mb-2">
                            <span class="rc-points-val">${formatIndianPoints(g.points)}</span>
                            <span class="small text-muted fw-semibold">Points</span>
                          </div>
                          <a href="${buildClaimUrl(g)}" class="btn rc-btn-primary btn-sm w-100" data-rc-pick-gift="${escapeHtml(g.id)}">
                            Claim this gift
                          </a>
                        </div>
                      </div>
                    </article>
                  `).join('')
                : `<div class="alert alert-light border text-center" style="grid-column: 1 / -1;">No gift cards match the selected filters.</div>`
            }
          </div>

          ${
            totalPages > 1
              ? `
                <div class="d-flex justify-content-center align-items-center gap-2 mt-4">
                  ${Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => `
                    <button type="button" class="btn btn-sm ${p === state.page ? 'rc-btn-primary' : 'btn-outline-secondary'}" data-rc-page="${p}">${p}</button>
                  `).join('')}
                  <button type="button" class="btn btn-sm btn-outline-secondary" data-rc-page="${Math.min(totalPages, state.page + 1)}" ${state.page >= totalPages ? 'disabled' : ''}>Next &rarr;</button>
                </div>
              `
              : ''
          }
        </section>

        ${renderFooter()}
        ${cartDrawerHtml}
      </div>
    `;
  }

  function renderDetailView(container) {
    const hash = window.location.hash || '';
    const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const id = params.get('id') || state.activeGiftId;
    const gift = state.gifts.find((g) => String(g.id) === String(id)) || state.gifts[0];

    if (!gift) {
      container.innerHTML = `<div class="alert alert-light border">Gift card not found. <a href="#/rewards-catalogue">Back to catalogue</a></div>`;
      return;
    }

    container.innerHTML = `
      <div class="rc-wrap py-2">
        <a href="#/rewards-catalogue" class="btn btn-outline-secondary btn-sm mb-3">&larr; Back to All Gift Cards</a>
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="rc-gift-card-top px-4 py-2">
            <span>Farlex Official Gift Card</span>
            <span class="rc-gift-card-tag">${escapeHtml(getCardTierLabel(gift.points))}</span>
          </div>
          <div class="row g-4 align-items-center p-4">
            <div class="col-md-5">
              <div class="rc-card-img-wrap rounded-3 border">
                <img src="${escapeHtml(gift.image)}" alt="${escapeHtml(gift.name)}">
              </div>
            </div>
            <div class="col-md-7">
              <span class="badge bg-primary-subtle text-primary border mb-2">${escapeHtml(gift.category)}</span>
              <h1 class="h3 fw-bold text-dark">${escapeHtml(gift.name)}</h1>
              <div class="mb-3">
                <span class="rc-points-val fs-4">${formatIndianPoints(gift.points)}</span>
                <span class="text-muted fw-semibold">Points</span>
              </div>
              <p class="text-muted mb-4">${escapeHtml(gift.description)}</p>
              <a href="${buildClaimUrl(gift)}" class="btn rc-btn-primary btn-lg" data-rc-pick-gift="${escapeHtml(gift.id)}">Claim this gift</a>
            </div>
          </div>
        </div>
        ${renderFooter()}
      </div>
    `;
  }

function renderClaimView(container) {
    const searchParams = new URLSearchParams(window.location.search || '');
    const hash = window.location.hash || '';
    const hashParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');

    const giftName =
      searchParams.get('gift') ||
      hashParams.get('gift') ||
      state.cartGift?.name ||
      '';
    const pointsNum = Number(
      searchParams.get('points') ||
      hashParams.get('points') ||
      state.cartGift?.points ||
      0
    );

    const giftDisplayValue =
      giftName && pointsNum
        ? `${giftName} (${formatIndianPoints(pointsNum)} pts)`
        : giftName || '';

    container.innerHTML = `
      <div class="rc-wrap py-3">
        <div class="card border-0 rounded-3 p-4 p-md-5 bg-white" style="max-width: 760px; margin: 0 auto; border: 1px solid #bfdbfe !important; box-shadow: 0 10px 28px rgba(15, 76, 129, 0.08) !important;">
          <h1 class="h3 fw-bold mb-2" style="color: #0f4c81;">Claim Your Gift</h1>
          <p class="small mb-4" style="color: #475569;">
            Enter your details below and we will contact you about your gift. Dispatch is subject to the scheme&rsquo;s eligibility criteria.
          </p>

          <form id="rcClaimForm" novalidate>
            <div class="mb-3">
              <label class="form-label fw-semibold small" style="color: #0f172a;">
                Ledger Name <span style="color: #dc2626;">*</span>
              </label>
              <input
                type="text"
                class="form-control py-2"
                name="ledger_name"
                placeholder="Ledger Name"
                style="border-color: #cbd5e1;"
                required
              >
            </div>

            <div class="mb-3">
              <label class="form-label fw-semibold small" style="color: #0f172a;">
                Party code <span style="color: #dc2626;">*</span>
              </label>
              <input
                type="text"
                class="form-control py-2"
                name="party_code"
                placeholder="Party code"
                style="border-color: #cbd5e1;"
                required
              >
            </div>

            <div class="mb-3">
              <label class="form-label fw-semibold small" style="color: #0f172a;">
                Contact no <span style="color: #dc2626;">*</span>
              </label>
              <input
                type="tel"
                class="form-control py-2"
                name="contact_no"
                placeholder="Contact no"
                style="border-color: #cbd5e1;"
                required
              >
            </div>

            <div class="mb-3">
              <label class="form-label fw-semibold small" style="color: #0f172a;">
                Address <span style="color: #dc2626;">*</span>
              </label>
              <textarea
                class="form-control py-2"
                name="address"
                rows="4"
                placeholder="Address"
                style="border-color: #cbd5e1;"
                required
              ></textarea>
            </div>

            <div class="mb-4">
              <label class="form-label fw-semibold small" style="color: #0f172a;">
                Selected gift <span style="color: #dc2626;">*</span>
              </label>
              <input
                type="text"
                class="form-control py-2"
                name="selected_gift"
                value="${escapeHtml(giftDisplayValue)}"
                placeholder="Selected gift"
                style="background-color: #eff6ff; border-color: #93c5fd; color: #0f4c81; font-weight: 600;"
                readonly
                required
              >
              <input type="hidden" name="gift" value="${escapeHtml(giftName)}">
              <input type="hidden" name="points" value="${pointsNum}">
            </div>

            <button
              type="submit"
              class="btn px-4 py-2 fw-bold text-white"
              style="background-color: #0f4c81; border-color: #0f4c81; border-radius: 8px;"
            >
              Submit claim request
            </button>

            <div class="small mt-3" style="color: #475569;">
              Read the <a href="#/scheme-terms" class="fw-semibold text-decoration-underline" style="color: #0f4c81;">Scheme Terms</a> before you claim.
            </div>
          </form>

          <div id="rcClaimResult" class="mt-3"></div>
        </div>
        ${renderFooter()}
      </div>
    `;
  }

  function renderTermsView(container) {
    container.innerHTML = `
      <div class="rc-wrap py-2">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <a href="#/rewards-catalogue" class="btn btn-outline-secondary btn-sm">&larr; Back to All Gift Cards</a>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-outline-primary btn-sm" data-rc-edit-terms>${state.editingTerms ? 'Save Terms' : 'Edit Terms'}</button>
            <button type="button" class="btn btn-outline-secondary btn-sm" data-rc-reset-terms>Reset Default</button>
          </div>
        </div>
        <div class="card border-0 shadow-sm rounded-3 p-4">
          <h1 class="h4 fw-bold text-dark mb-3">Scheme Terms</h1>
          <div id="rcTermsEditor" class="small text-body" contenteditable="${state.editingTerms ? 'true' : 'false'}" style="${state.editingTerms ? 'outline: 2px dashed #0f4c81; padding: 12px; border-radius: 8px;' : ''}">
            ${getSavedTermsHtml()}
          </div>
        </div>
        ${renderFooter()}
      </div>
    `;
  }

  async function mount(container, options = {}) {
    if (!container) return;
    await ensureGiftsLoaded();
    syncStateFromUrl();

    const view = options.view || 'catalogue';
    if (view === 'detail') renderDetailView(container);
    else if (view === 'claim') renderClaimView(container);
    else if (view === 'terms') renderTermsView(container);
    else renderCatalogueView(container);

    container.onclick = async (e) => {
      if (e.target.closest('[data-rc-close-announcement]')) {
        state.announcementVisible = false;
        mount(container, options);
        return;
      }
      if (e.target.closest('[data-rc-open-drawer]')) {
        state.drawerOpen = true;
        mount(container, options);
        return;
      }
      if (e.target.closest('[data-rc-close-drawer]')) {
        state.drawerOpen = false;
        mount(container, options);
        return;
      }
      if (e.target.closest('[data-rc-clear-cart]')) {
        state.cartGift = null;
        mount(container, options);
        return;
      }

      const catBtn = e.target.closest('[data-rc-cat]');
      if (catBtn) {
        state.category = catBtn.dataset.rcCat || '';
        state.page = 1;
        syncUrlFromState();
        mount(container, options);
        return;
      }

      const underBtn = e.target.closest('[data-rc-under]');
      if (underBtn) {
        const val = underBtn.dataset.rcUnder;
        state.maxPoints = val ? Number(val) : null;
        state.page = 1;
        syncUrlFromState();
        mount(container, options);
        return;
      }

      const tierInput = e.target.closest('[data-rc-point-tier]');
      if (tierInput) {
        const checkedVals = Array.from(container.querySelectorAll('[data-rc-point-tier]:checked')).map((el) => Number(el.value));
        state.selectedPoints = checkedVals;
        state.page = 1;
        syncUrlFromState();
        mount(container, options);
        return;
      }

      const pageBtn = e.target.closest('[data-rc-page]');
      if (pageBtn && !pageBtn.disabled) {
        state.page = Number(pageBtn.dataset.rcPage) || 1;
        syncUrlFromState();
        mount(container, options);
        return;
      }

      const pickGiftLink = e.target.closest('[data-rc-pick-gift]');
      if (pickGiftLink) {
        const gId = pickGiftLink.dataset.rcPickGift;
        const found = state.gifts.find((g) => String(g.id) === String(gId));
        if (found) state.cartGift = found;
      }

      if (e.target.closest('[data-rc-edit-terms]')) {
        const editor = container.querySelector('#rcTermsEditor');
        if (state.editingTerms && editor) {
          try {
            localStorage.setItem(TERMS_STORAGE_KEY, editor.innerHTML);
          } catch (_) {}
          state.editingTerms = false;
        } else {
          state.editingTerms = true;
        }
        mount(container, options);
        return;
      }

      if (e.target.closest('[data-rc-reset-terms]')) {
        try {
          localStorage.removeItem(TERMS_STORAGE_KEY);
        } catch (_) {}
        state.editingTerms = false;
        mount(container, options);
      }
    };

    let searchTimer = null;
    container.oninput = (e) => {
      const searchInp = e.target.closest('[data-rc-search]');
      if (!searchInp) return;
      clearTimeout(searchTimer);
      state.searchQuery = searchInp.value;
      state.page = 1;
      searchTimer = setTimeout(() => {
        mount(container, options);
      }, 180);
    };

    const claimForm = container.querySelector('#rcClaimForm');
    if (claimForm) {
      claimForm.onsubmit = async (e) => {
        e.preventDefault();
        const resultBox = container.querySelector('#rcClaimResult');
        const fd = new FormData(claimForm);
        const partnerName = String(fd.get('partner_name') || '').trim();
        const partnerCode = String(fd.get('partner_code') || '').trim();
        const phone = String(fd.get('phone') || '').trim();
        const email = String(fd.get('email') || '').trim();
        const address = String(fd.get('address') || '').trim();
        const city = String(fd.get('city') || '').trim();
        const stateName = String(fd.get('state') || '').trim();
        const pin = String(fd.get('pin_code') || '').trim();
        const consent = fd.get('consent');

        if (!partnerName || !partnerCode || !phone || !email || !address || !city || !stateName || !/^\d{6}$/.test(pin) || !consent) {
          if (resultBox) {
            resultBox.innerHTML = `<div class="alert alert-danger small mb-0">Please fill all required fields and enter a valid 6-digit PIN code.</div>`;
          }
          return;
        }

        const payload = Object.fromEntries(fd.entries());
        try {
          await fetch('api/gift_claims.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch (_) {}

        if (resultBox) {
          resultBox.innerHTML = `
            <div class="alert alert-success mb-0">
              <strong>Claim Submitted!</strong> Gift card <strong>${escapeHtml(payload.gift)}</strong> for partner <strong>${escapeHtml(partnerName)}</strong> (${escapeHtml(partnerCode)}) has been recorded for verification.
            </div>
          `;
        }
        claimForm.reset();
      };
    }
  }

  return { mount };
})();