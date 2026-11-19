window.PharmaDownloads = (() => {
  let state = {
    category: 'All',
    query: '',
    categories: ['All'],
    items: [],
    loading: false,
    error: null,
  };

  function escapeHtml(str = '') {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async function fetchDownloads() {
    state.loading = true;
    state.error = null;
    renderListOnly();

    try {
      const params = new URLSearchParams();
      if (state.category && state.category !== 'All') {
        params.set('category', state.category);
      }
      if (state.query.trim() !== '') {
        params.set('q', state.query.trim());
      }

      const res = await fetch(`../api/downloads.php?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Unable to load downloads.');
      }

      state.categories = Array.isArray(data.categories) && data.categories.length ? data.categories : ['All'];
      state.items = Array.isArray(data.data) ? data.data : [];
    } catch (err) {
      state.error = err.message || 'Network error while loading downloads.';
    } finally {
      state.loading = false;
      renderFull();
    }
  }

  function renderCategories() {
    const container = document.getElementById('dlCategoryPills');
    if (!container) return;

    container.innerHTML = state.categories
      .map((cat) => {
        const activeClass = state.category === cat ? 'btn-primary active' : 'btn-outline-secondary';
        return `<button type="button" class="btn btn-sm pf-cat-pill ${activeClass}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`;
      })
      .join('');

    container.querySelectorAll('[data-category]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.category = btn.getAttribute('data-category') || 'All';
        fetchDownloads();
      });
    });
  }

  function renderListOnly() {
    const listEl = document.getElementById('dlItemsContainer');
    if (!listEl) return;

    if (state.loading) {
      listEl.innerHTML = `
        <div class="text-center py-5 text-muted">
          <div class="spinner-border spinner-border-sm me-2" role="status"></div>
          Loading downloadable resources...
        </div>`;
      return;
    }

    if (state.error) {
      listEl.innerHTML = `
        <div class="alert alert-danger mb-0" role="alert">
          <i class="bi bi-exclamation-triangle me-2"></i>${escapeHtml(state.error)}
        </div>`;
      return;
    }

    if (!state.items.length) {
      listEl.innerHTML = `
        <div class="text-center py-5 text-muted">
          <i class="bi bi-folder2-open fs-2 d-block mb-2"></i>
          No files match your current filter or search query.
        </div>`;
      return;
    }

    listEl.innerHTML = `
      <div class="row g-3">
        ${state.items
          .map((item) => {
            const badge = item.is_sample
              ? `<span class="badge text-bg-warning-subtle text-warning-emphasis border border-warning-subtle">Sample File</span>`
              : `<span class="badge text-bg-success-subtle text-success-emphasis border border-success-subtle">Verified</span>`;

            return `
              <div class="col-12 col-md-6 col-xl-4">
                <div class="pf-card p-3 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
                      <span class="badge bg-light text-dark border">${escapeHtml(item.category)}</span>
                      ${badge}
                    </div>
                    <h6 class="fw-bold mb-1">${escapeHtml(item.title)}</h6>
                    <p class="text-muted small mb-3">${escapeHtml(item.description || '')}</p>
                  </div>

                  <div>
                    <div class="d-flex align-items-center justify-content-between text-muted small border-top pt-2 mb-3">
                      <span><i class="bi bi-file-earmark-text me-1"></i>${escapeHtml(item.file_format)} · ${escapeHtml(item.file_size_label)}</span>
                      <span id="dlCount-${item.id}"><i class="bi bi-cloud-arrow-down me-1"></i>${Number(item.download_count || 0)}</span>
                    </div>
                    <a
                      href="../api/download_file.php?id=${Number(item.id)}"
                      class="btn btn-primary btn-sm w-100 pf-download-btn"
                      data-id="${Number(item.id)}"
                      data-title="${escapeHtml(item.title)}"
                    >
                      <i class="bi bi-download me-1"></i>Download File
                    </a>
                  </div>
                </div>
              </div>`;
          })
          .join('')}
      </div>`;

    listEl.querySelectorAll('.pf-download-btn').forEach((link) => {
      link.addEventListener('click', () => {
        const id = Number(link.getAttribute('data-id'));
        const title = link.getAttribute('data-title') || 'File';
        const countSpan = document.getElementById(`dlCount-${id}`);
        if (countSpan) {
          const current = parseInt(countSpan.textContent.trim(), 10) || 0;
          countSpan.innerHTML = `<i class="bi bi-cloud-arrow-down me-1"></i>${current + 1}`;
        }
        if (window.PharmaApp && typeof window.PharmaApp.showToast === 'function') {
          window.PharmaApp.showToast(`Downloading: ${title}`);
        }
      });
    });
  }

  function renderFull() {
    renderCategories();
    renderListOnly();
  }

  function mount(container) {
    state.category = 'All';
    state.query = '';

    container.innerHTML = `
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 class="fw-bold mb-1">Downloads</h4>
          <p class="text-muted small mb-0">Browse categories, search documents, and download available resources.</p>
        </div>
        <div style="min-width: 240px;">
          <input type="search" id="dlSearchInput" class="form-control form-control-sm" placeholder="Search files by title or category...">
        </div>
      </div>

      <div class="pf-card p-3 mb-3">
        <div class="d-flex flex-wrap align-items-center gap-2" id="dlCategoryPills"></div>
      </div>

      <div id="dlItemsContainer"></div>
    `;

    const searchInput = document.getElementById('dlSearchInput');
    let timer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.query = searchInput.value;
        fetchDownloads();
      }, 200);
    });

    fetchDownloads();
  }

  return { mount };
})();