// public/assets/js/products.js
window.PharmaProducts = (() => {
  const state = {
    search: '',
    segmentId: '',
    page: 1,
    perPage: 12,
    segmentsLoaded: false,
    requestSeq: 0,
  };

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatMrp(product) {
    if (product.mrp !== null && product.mrp !== '') {
      const num = Number(product.mrp);
      if (!Number.isNaN(num)) {
        return `<span class="fw-bold text-primary">₹${num.toFixed(2)}</span>`;
      }
    }
    if (product.mrp_note) {
      return `<span class="badge bg-warning-subtle text-dark border">${escapeHtml(product.mrp_note)}</span>`;
    }
    return `<span class="text-muted small">MRP on Request</span>`;
  }

  function renderCard(product) {
    const imgSrc =
      product.image_url && product.image_url.trim() !== ''
        ? escapeHtml(product.image_url)
        : `https://placehold.co/600x400?text=${encodeURIComponent(product.name || 'Farlex')}`;

    const categoryBadge = product.category_name
      ? `<span class="badge bg-info-subtle text-dark border mb-2">${escapeHtml(product.category_name)}</span>`
      : '';

    const packingText = product.packing
      ? `<div class="small text-secondary mb-2"><i class="bi bi-box-seam me-1"></i><strong>Packing:</strong> ${escapeHtml(product.packing)}</div>`
      : '';

    return `
      <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
        <div class="card h-100 shadow-sm border-0 rounded-3 overflow-hidden">
          <div class="bg-light d-flex align-items-center justify-content-center" style="height: 175px; overflow: hidden;">
            <img
              src="${imgSrc}"
              alt="${escapeHtml(product.name)}"
              loading="lazy"
              class="w-100 h-100 object-fit-cover"
              onerror="this.onerror=null;this.src='https://placehold.co/600x400?text=Farlex+Pharma';"
            >
          </div>
          <div class="card-body d-flex flex-column">
            <div>${categoryBadge}</div>
            <h6 class="card-title fw-bold text-dark mb-1">${escapeHtml(product.name)}</h6>
            <p class="card-text small text-muted flex-grow-1 mb-3" style="line-height: 1.4;">
              ${escapeHtml(product.composition || 'Composition details unavailable')}
            </p>
            ${packingText}
            <div class="d-flex align-items-center justify-content-between pt-2 border-top mt-auto">
              <div>${formatMrp(product)}</div>
              <span class="text-muted small">#${escapeHtml(product.sr_no ?? product.id)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderPagination(page, totalPages) {
    if (totalPages <= 1) return '';

    const prevDisabled = page <= 1 ? 'disabled' : '';
    const nextDisabled = page >= totalPages ? 'disabled' : '';

    return `
      <nav class="mt-4" aria-label="Products pagination">
        <ul class="pagination justify-content-center mb-0">
          <li class="page-item ${prevDisabled}">
            <button type="button" class="page-link" data-page="${page - 1}" ${prevDisabled}>Previous</button>
          </li>
          <li class="page-item disabled">
            <span class="page-link">Page ${page} of ${totalPages}</span>
          </li>
          <li class="page-item ${nextDisabled}">
            <button type="button" class="page-link" data-page="${page + 1}" ${nextDisabled}>Next</button>
          </li>
        </ul>
      </nav>
    `;
  }

async function fetchProductsApi(params) {
    const query = params.toString();
    const pathname = window.location.pathname || '/';
    const baseDir = pathname.endsWith('/')
      ? pathname
      : pathname.replace(/\/[^/]*$/, '/');

    const candidates = Array.from(new Set([
      `${baseDir}api/products.php?${query}`,
      `${baseDir}../api/products.php?${query}`,
      `/PHARMA-FLOW/api/products.php?${query}`,
      `/api/products.php?${query}`,
      `api/products.php?${query}`,
      `../api/products.php?${query}`,
    ]));

    let lastError = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url);
        const text = await res.text();
        const trimmed = text.trim();

        if (!trimmed || trimmed.startsWith('<!') || trimmed.startsWith('<html')) {
          lastError = new Error(`HTML/non-JSON response from ${url}`);
          continue;
        }

        const data = JSON.parse(trimmed);
        if (!res.ok || !data.ok) {
          throw new Error(data.message || `HTTP ${res.status}`);
        }
        return data;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Unable to fetch JSON from products.php');
  }

  async function fetchAndRender(container) {
    const seq = ++state.requestSeq;
    const gridEl = container.querySelector('#products-card-grid');
    const metaEl = container.querySelector('#products-meta');
    const pagEl = container.querySelector('#products-pagination');
    const segEl = container.querySelector('#product-segment-filter');

    if (!gridEl) return;

    gridEl.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="small text-muted mt-2">Loading Farlex products...</div>
      </div>
    `;

    const params = new URLSearchParams({
      search: state.search,
      q: state.search,
      segment_id: state.segmentId,
      page: String(state.page),
      per_page: String(state.perPage),
    });

    try {
      const data = await fetchProductsApi(params);
      if (seq !== state.requestSeq) return;

      if (segEl && !state.segmentsLoaded && Array.isArray(data.segments)) {
        const options = ['<option value="">All Categories</option>'].concat(
          data.segments.map(
            (s) => `<option value="${s.id}">${escapeHtml(s.name)} (${s.product_count})</option>`
          )
        );
        segEl.innerHTML = options.join('');
        segEl.value = state.segmentId;
        state.segmentsLoaded = true;
      }

      if (metaEl) {
        const searchInfo = state.search ? ` for "${state.search}"` : '';
        metaEl.textContent = `Showing ${data.products.length} of ${data.total} products${searchInfo}`;
      }

      if (!data.products.length) {
        gridEl.innerHTML = `
          <div class="col-12">
            <div class="alert alert-light border text-center py-4 mb-0">
              No matching products found. Try clearing your search or category filter.
            </div>
          </div>
        `;
      } else {
        gridEl.innerHTML = data.products.map(renderCard).join('');
      }

      if (pagEl) {
        pagEl.innerHTML = renderPagination(data.page, data.total_pages);
      }
    } catch (err) {
      if (seq !== state.requestSeq) return;
      gridEl.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger mb-0">${escapeHtml(err.message)}</div>
        </div>
      `;
    }
  }

  async function mount(container) {
    state.search = '';
    state.segmentId = '';
    state.page = 1;
    state.segmentsLoaded = false;

    container.innerHTML = `
      <section class="py-4">
        <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
          <div>
            <h2 class="fw-bold mb-1">Farlex Product Catalog</h2>
            <p class="text-muted small mb-0" id="products-meta">Loading products...</p>
          </div>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <div class="input-group" style="min-width: 260px; max-width: 340px;">
              <input
                type="search"
                id="product-search-input"
                class="form-control"
                placeholder="Search brand, salt, packing..."
                autocomplete="off"
              >
              <button
                type="button"
                id="product-search-clear"
                class="btn btn-outline-secondary"
                title="Clear search"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <select id="product-segment-filter" class="form-select" style="min-width: 210px;">
              <option value="">All Categories</option>
            </select>
          </div>
        </div>

        <div class="row g-3" id="products-card-grid"></div>
        <div id="products-pagination"></div>
      </section>
    `;

    const searchInput = container.querySelector('#product-search-input');
    const clearBtn = container.querySelector('#product-search-clear');
    const segSelect = container.querySelector('#product-segment-filter');
    const pagWrap = container.querySelector('#products-pagination');

    const runSearch = (val) => {
      state.search = String(val ?? '').trim();
      state.page = 1;
      fetchAndRender(container);
    };

    let debounceTimer = null;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const val = e.target.value;
      if (val.trim() === '') {
        runSearch('');
        return;
      }
      debounceTimer = setTimeout(() => {
        runSearch(val);
      }, 180);
    });

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(debounceTimer);
        runSearch(e.target.value);
      }
    });

    clearBtn?.addEventListener('click', () => {
      clearTimeout(debounceTimer);
      if (searchInput) searchInput.value = '';
      runSearch('');
      searchInput?.focus();
    });

    segSelect?.addEventListener('change', (e) => {
      state.segmentId = e.target.value;
      state.page = 1;
      fetchAndRender(container);
    });

    pagWrap?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;
      const nextPage = Number(btn.dataset.page);
      if (!Number.isNaN(nextPage) && nextPage >= 1) {
        state.page = nextPage;
        fetchAndRender(container);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    await fetchAndRender(container);
  }

  return { mount };
})();