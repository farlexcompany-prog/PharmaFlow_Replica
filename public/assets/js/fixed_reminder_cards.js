// public/assets/js/fixed_reminder_cards.js
window.PharmaFixedReminderCards = (() => {
  const MANUAL_PDF_PATHS = [
    { title: 'Neuro Range Reminder Card', pdfUrl: 'assets/pdfs/neuro_range.pdf' },
    { title: 'Products Reminder Card', pdfUrl: 'assets/pdfs/powder.pdf' },
  ];

  const PDFJS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const state = {
    items: [...MANUAL_PDF_PATHS].map((item, idx) => ({
      id: `pdf-${idx + 1}`,
      title: item.title,
      pdfUrl: item.pdfUrl,
    })),
    query: '',
  };

  let pdfJsPromise = null;

  function ensurePdfJs() {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return Promise.resolve(window.pdfjsLib);
    }
    if (pdfJsPromise) return pdfJsPromise;

    pdfJsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = PDFJS_SRC;
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('pdfjsLib not found'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load pdf.js'));
      document.head.appendChild(script);
    });

    return pdfJsPromise;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function renderPdfIntoContainer(targetEl, pdfUrl, maxPages = 2, scale = 1.15) {
    if (!targetEl) return;
    targetEl.innerHTML = `
      <div class="d-flex align-items-center justify-content-center py-4 text-muted small">
        <span class="spinner-border spinner-border-sm me-2"></span>Loading PDF pages...
      </div>
    `;

    try {
      const pdfjsLib = await ensurePdfJs();
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdfDoc = await loadingTask.promise;
      const pagesToRender = Math.min(pdfDoc.numPages, maxPages);

      targetEl.innerHTML = '';

      for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const pageWrap = document.createElement('div');
        pageWrap.className = 'mb-3 bg-white border rounded shadow-xs overflow-auto text-center p-2';

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';

        pageWrap.appendChild(canvas);
        targetEl.appendChild(pageWrap);

        await page.render({ canvasContext: ctx, viewport }).promise;
      }

      if (pdfDoc.numPages > maxPages) {
        const moreNote = document.createElement('div');
        moreNote.className = 'text-center small text-muted mt-1';
        moreNote.textContent = `Showing first ${maxPages} of ${pdfDoc.numPages} pages. Click "Open PDF" for full document.`;
        targetEl.appendChild(moreNote);
      }
    } catch (err) {
      targetEl.innerHTML = `
        <div class="p-3 bg-light border rounded text-center small">
          <div class="text-danger mb-2">PDF render error: ${escapeHtml(err?.message || 'Unable to render')}</div>
          <embed src="${escapeHtml(pdfUrl)}" type="application/pdf" class="w-100 mb-2" style="height: 260px;" />
          <a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
            Open PDF in New Tab
          </a>
        </div>
      `;
    }
  }

  function getFilteredItems() {
    const q = state.query.trim().toLowerCase();
    if (!q) return state.items;
    return state.items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.pdfUrl.toLowerCase().includes(q)
    );
  }

  function renderGrid(items) {
    if (!items.length) {
      return `
        <div class="col-12">
          <div class="alert alert-light border text-center py-4 mb-0">
            No matching PDFs found.
          </div>
        </div>
      `;
    }

    return items.map((item) => `
      <div class="col-12 col-md-6">
        <div class="card h-100 border-0 shadow-sm rounded-3 overflow-hidden">
          <div
            class="bg-light border-bottom p-2"
            data-pdf-thumb-url="${escapeHtml(item.pdfUrl)}"
            style="max-height: 360px; overflow-y: auto;"
          ></div>
          <div class="card-body d-flex flex-column justify-content-between">
            <div>
              <h6 class="card-title fw-bold text-dark mb-1">${escapeHtml(item.title)}</h6>
              <div class="small text-muted text-break mb-3">${escapeHtml(item.pdfUrl)}</div>
            </div>
            <div class="d-flex flex-wrap gap-2 pt-2 border-top">
              <button
                type="button"
                class="btn btn-outline-primary btn-sm"
                data-preview-url="${escapeHtml(item.pdfUrl)}"
                data-preview-title="${escapeHtml(item.title)}"
              >
                <i class="bi bi-eye me-1"></i>Full Preview
              </button>
              <a href="${escapeHtml(item.pdfUrl)}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
                <i class="bi bi-file-earmark-pdf me-1"></i>Open PDF
              </a>
              <a href="${escapeHtml(item.pdfUrl)}" download class="btn btn-outline-secondary btn-sm" title="Download PDF">
                <i class="bi bi-download"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  async function mount(container) {
    if (!container) return;

    container.innerHTML = `
      <section class="py-2">
        <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
          <div>
            <h3 class="fw-bold mb-1">Reminder Cards</h3>
            <p class="text-muted small mb-0">Fixed reminder card PDFs</p>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <input
              type="search"
              id="fixedRcSearch"
              class="form-control form-control-sm"
              placeholder="Search PDF..."
              style="min-width: 210px;"
            >
            <a href="#/custom-reminder-cards" data-link class="btn btn-outline-primary btn-sm">
              <i class="bi bi-sliders me-1"></i>Custom Builder
            </a>
          </div>
        </div>

        <div class="row g-3" id="fixedRcGrid">
          ${renderGrid(getFilteredItems())}
        </div>

        <div id="fixedRcPreviewBox" class="mt-4"></div>
      </section>
    `;

    const searchInput = container.querySelector('#fixedRcSearch');
    const gridEl = container.querySelector('#fixedRcGrid');
    const previewBox = container.querySelector('#fixedRcPreviewBox');

    async function hydrateThumbnails() {
      const thumbs = Array.from(gridEl?.querySelectorAll('[data-pdf-thumb-url]') || []);
      for (const el of thumbs) {
        const url = el.getAttribute('data-pdf-thumb-url');
        if (url) {
          await renderPdfIntoContainer(el, url, 1, 0.95);
        }
      }
    }

    searchInput?.addEventListener('input', async (e) => {
      state.query = e.target.value;
      if (gridEl) {
        gridEl.innerHTML = renderGrid(getFilteredItems());
        await hydrateThumbnails();
      }
    });

    gridEl?.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-preview-url]');
      if (!btn || !previewBox) return;
      const url = btn.dataset.previewUrl;
      const title = btn.dataset.previewTitle || 'PDF Preview';

      previewBox.innerHTML = `
        <div class="card border shadow-sm p-3 bg-white">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-bold mb-0">${escapeHtml(title)}</h6>
            <div class="d-flex align-items-center gap-2">
              <a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-primary">
                Open Full PDF
              </a>
              <button type="button" class="btn-close" id="closeFixedPreview"></button>
            </div>
          </div>
          <div id="fixedRcFullCanvas" class="bg-light border rounded p-3" style="max-height: 75vh; overflow-y: auto;"></div>
        </div>
      `;

      previewBox.querySelector('#closeFixedPreview')?.addEventListener('click', () => {
        previewBox.innerHTML = '';
      });

      const fullCanvas = previewBox.querySelector('#fixedRcFullCanvas');
      await renderPdfIntoContainer(fullCanvas, url, 8, 1.35);
    });

    await hydrateThumbnails();
  }

  return { mount };
})();