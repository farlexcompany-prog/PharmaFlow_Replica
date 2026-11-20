// public/assets/js/reminder_card.js
window.PharmaReminderCard = (() => {
  const LAYOUTS = {
    '2x1': { label: '2 × 1 (2 Slots)', cols: 2, rows: 1, slots: 2 },
    '2x2': { label: '2 × 2 (4 Slots)', cols: 2, rows: 2, slots: 4 },
    '3x2': { label: '3 × 2 (6 Slots)', cols: 3, rows: 2, slots: 6 },
    '4x2': { label: '4 × 2 (8 Slots)', cols: 4, rows: 2, slots: 8 },
  };

  const state = {
    layoutKey: '2x2',
    cardTitle: 'Farlex Promotional Reminder Card',
    doctorName: '',
    clinicName: '',
    footerNote: 'Farlex Pharmaceuticals Pvt. Ltd. | +91-9875998089 | Info@farlex.in | www.farlex.in',
    slots: Array(8).fill(null),
    activeSlotIndex: 0,
    productsCache: [],
    loadingProducts: false,
    productError: '',
  };

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeHtmlAttr(str) {
    return escapeHtml(str);
  }

  function ensureSlotCapacity(count) {
    while (state.slots.length < count) {
      state.slots.push(null);
    }
    if (state.activeSlotIndex >= count) {
      state.activeSlotIndex = 0;
    }
  }

  function normalizeProduct(item, idx = 0) {
    if (!item || typeof item !== 'object') return null;
    const name = item.name || item.product_name || item.title || item.brand_name || '';
    if (!name) return null;

    return {
      id: item.id ?? item.product_id ?? idx + 1,
      name: String(name).trim(),
      composition: String(item.composition || item.salt || item.generic_name || item.description || '').trim(),
      packing: String(item.packing || item.pack || item.unit || '').trim(),
      mrp: item.mrp ?? null,
      mrp_note: item.mrp_note || '',
    };
  }

  function extractProductArray(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    if (Array.isArray(data.products)) return data.products;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    if (data.data && typeof data.data === 'object' && Array.isArray(data.data.products)) {
      return data.data.products;
    }
    return [];
  }

  async function loadProducts(search = '') {
    state.loadingProducts = true;
    state.productError = '';

    const trimmed = search.trim();
    const params = new URLSearchParams({
      search: trimmed,
      q: trimmed,
      page: '1',
      per_page: '50',
    });

    const pathname = window.location.pathname || '/';
    const baseDir = pathname.endsWith('/') ? pathname : pathname.replace(/\/[^/]*$/, '/');
    const urls = Array.from(new Set([
      `${baseDir}api/products.php?${params}`,
      `${baseDir}../api/products.php?${params}`,
      `/PHARMA-FLOW/api/products.php?${params}`,
      `/api/products.php?${params}`,
      `api/products.php?${params}`,
      `../api/products.php?${params}`,
    ]));

    let lastStatus = '';

    for (const url of urls) {
      try {
        const res = await fetch(url);
        lastStatus = `${res.status}`;
        const rawText = (await res.text()).trim();
        if (!rawText) continue;

        const cleanText = rawText.replace(/^\uFEFF/, '');
        if (cleanText.startsWith('<!DOCTYPE') || cleanText.startsWith('<html')) continue;

        const parsed = JSON.parse(cleanText);
        if (parsed && parsed.ok === false) {
          state.productError = parsed.error || parsed.message || 'Products API returned ok: false';
          continue;
        }

        const rawList = extractProductArray(parsed);
        const normalized = rawList.map(normalizeProduct).filter(Boolean);

        if (res.ok && normalized.length > 0) {
          state.productsCache = normalized;
          state.productError = '';
          state.loadingProducts = false;
          return;
        }

        if (res.ok && Array.isArray(rawList) && rawList.length === 0) {
          state.productsCache = [];
          state.productError = trimmed
            ? `No products matched "${trimmed}".`
            : 'api/products.php returned 0 products.';
          state.loadingProducts = false;
          return;
        }
      } catch (err) {
        lastStatus = err?.message || 'fetch failed';
      }
    }

    state.productsCache = [];
    if (!state.productError) {
      state.productError = `Products load nahi ho paaye (${lastStatus || 'API unreachable'}).`;
    }
    state.loadingProducts = false;
  }

  function formatMrpShort(p) {
    if (!p) return '';
    if (p.mrp !== null && p.mrp !== '' && !Number.isNaN(Number(p.mrp))) {
      return `₹${Number(p.mrp).toFixed(2)}`;
    }
    return p.mrp_note || 'MRP on Request';
  }

  function renderSlotSelectHtml(slotIndex, selectedName = '') {
    const safeSelected = String(selectedName ?? '');
    const options = [
      `<option value="">-- Select Product for Slot ${slotIndex + 1} --</option>`,
      ...state.productsCache.map((p, idx) => {
        const nameStr = String(p.name ?? '');
        const compStr = String(p.composition ?? '');
        const isSelected = nameStr !== '' && nameStr === safeSelected ? 'selected' : '';
        const label = compStr ? `${nameStr} (${compStr})` : nameStr;
        return `<option value="${escapeHtmlAttr(nameStr)}" data-prod-idx="${idx}" ${isSelected}>${escapeHtml(label)}</option>`;
      }),
    ];

    return `
      <select
        class="form-select form-select-sm mb-2 farlex-slot-product-select"
        data-slot-select-index="${slotIndex}"
        aria-label="Select product for slot ${slotIndex + 1}"
      >
        ${options.join('')}
      </select>
    `;
  }

  function renderSlotsGrid() {
    const cfg = LAYOUTS[state.layoutKey] || LAYOUTS['2x2'];
    ensureSlotCapacity(cfg.slots);

    const colClass =
      cfg.cols === 2 ? 'col-12 col-md-6' :
      cfg.cols === 3 ? 'col-12 col-sm-6 col-lg-4' :
      'col-12 col-sm-6 col-lg-3';

    const items = [];
    for (let i = 0; i < cfg.slots; i++) {
      const prod = state.slots[i];
      const isSelected = i === state.activeSlotIndex;
      const borderClass = isSelected ? 'border-primary border-2' : 'border';

      if (!prod) {
        items.push(`
          <div class="${colClass}" data-slot-index="${i}">
            <div class="p-3 rounded-3 bg-light ${borderClass} h-100 d-flex flex-column justify-content-between" style="min-height: 155px;">
              <div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge ${isSelected ? 'bg-primary' : 'bg-secondary-subtle text-dark'}">Slot ${i + 1}</span>
                  <button type="button" class="btn btn-sm btn-link p-0 text-decoration-none" data-select-slot="${i}">
                    ${isSelected ? 'Active' : 'Select'}
                  </button>
                </div>
                ${renderSlotSelectHtml(i, '')}
                <div class="text-center text-muted small my-1">
                  Pick from dropdown or click a product on the right
                </div>
              </div>
              <div class="text-end small text-muted pt-1">Empty</div>
            </div>
          </div>
        `);
      } else {
        items.push(`
          <div class="${colClass}" data-slot-index="${i}">
            <div class="p-3 rounded-3 bg-white ${borderClass} h-100 d-flex flex-column justify-content-between" style="min-height: 155px;">
              <div>
                <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <span class="badge ${isSelected ? 'bg-primary' : 'bg-info-subtle text-dark'}">Slot ${i + 1}</span>
                  <div class="d-flex gap-1">
                    <button type="button" class="btn btn-xs btn-outline-secondary py-0 px-1 small" data-select-slot="${i}" title="Select slot">Pick</button>
                    <button type="button" class="btn btn-xs btn-outline-danger py-0 px-1 small" data-clear-slot="${i}" title="Remove product">×</button>
                  </div>
                </div>
                ${renderSlotSelectHtml(i, prod.name)}
                <div class="fw-bold text-dark small">${escapeHtml(prod.name)}</div>
                <div class="text-muted" style="font-size: 0.78rem; line-height: 1.3;">
                  ${escapeHtml(prod.composition || '')}
                </div>
              </div>
              <div class="d-flex justify-content-between align-items-center pt-2 mt-2 border-top small">
                <span class="text-secondary">${escapeHtml(prod.packing || '')}</span>
                <span class="fw-semibold text-primary">${escapeHtml(formatMrpShort(prod))}</span>
              </div>
            </div>
          </div>
        `);
      }
    }

    return `<div class="row g-3">${items.join('')}</div>`;
  }

  function renderProductPickerList() {
    if (state.loadingProducts) {
      return `<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div></div>`;
    }
    if (!state.productsCache.length) {
      return `<div class="text-muted small text-center py-3">${escapeHtml(state.productError || 'No products found. Try another search keyword.')}</div>`;
    }

    return state.productsCache.map((p, idx) => `
      <button
        type="button"
        class="list-group-item list-group-item-action d-flex justify-content-between align-items-start gap-2 py-2"
        data-add-product-idx="${idx}"
      >
        <div class="text-start">
          <div class="fw-semibold small text-dark">${escapeHtml(p.name)}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${escapeHtml(p.composition || p.packing || '')}</div>
        </div>
        <span class="badge bg-light text-dark border flex-shrink-0">+ Add</span>
      </button>
    `).join('');
  }

  function exportCardAsPng(cardEl) {
    const cfg = LAYOUTS[state.layoutKey] || LAYOUTS['2x2'];
    const width = 1200;
    const height = 800;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0d6efd';
    ctx.fillRect(0, 0, width, 96);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Plus Jakarta Sans", Inter, sans-serif';
    ctx.fillText(state.cardTitle || 'Farlex Reminder Card', 36, 44);

    const metaParts = [];
    if (state.doctorName) metaParts.push(`Dr. ${state.doctorName}`);
    if (state.clinicName) metaParts.push(state.clinicName);
    ctx.font = '15px Inter, sans-serif';
    ctx.fillText(metaParts.join(' • ') || 'Farlex Pharmaceuticals Pvt. Ltd.', 36, 74);

    const padX = 36;
    const topY = 120;
    const bottomY = 735;
    const gap = 16;
    const gridW = width - padX * 2;
    const gridH = bottomY - topY;
    const cellW = (gridW - gap * (cfg.cols - 1)) / cfg.cols;
    const cellH = (gridH - gap * (cfg.rows - 1)) / cfg.rows;

    for (let i = 0; i < cfg.slots; i++) {
      const r = Math.floor(i / cfg.cols);
      const c = i % cfg.cols;
      const x = padX + c * (cellW + gap);
      const y = topY + r * (cellH + gap);

      ctx.fillStyle = '#f8f9fa';
      ctx.strokeStyle = '#dee2e6';
      ctx.lineWidth = 1.5;
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeRect(x, y, cellW, cellH);

      const prod = state.slots[i];
      if (prod) {
        ctx.fillStyle = '#0d6efd';
        ctx.font = 'bold 17px Inter, sans-serif';
        ctx.fillText(String(prod.name || '').slice(0, 34), x + 14, y + 28);

        ctx.fillStyle = '#495057';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText(String(prod.composition || '').slice(0, 44), x + 14, y + 54);

        ctx.fillStyle = '#212529';
        ctx.font = 'bold 13px Inter, sans-serif';
        const packMrp = `${prod.packing || ''}  ${formatMrpShort(prod)}`.trim();
        ctx.fillText(packMrp.slice(0, 42), x + 14, y + cellH - 16);
      } else {
        ctx.fillStyle = '#adb5bd';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(`Slot ${i + 1}`, x + 14, y + 28);
      }
    }

    ctx.fillStyle = '#212529';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText(state.footerNote, 36, 770);

    const link = document.createElement('a');
    link.download = `farlex-reminder-card-${state.layoutKey}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    if (cardEl) {
      cardEl.classList.add('border-success');
      setTimeout(() => cardEl.classList.remove('border-success'), 800);
    }
  }

  function printStyledReminderCard(sheetEl, meta = {}) {
    if (!sheetEl) {
      window.print();
      return;
    }

    const company = meta.company || 'Farlex Pharmaceuticals Pvt. Ltd.';
    const website = meta.website || 'www.farlex.in';
    const phone = meta.phone || '+91-9875998089';
    const email = meta.email || 'Info@farlex.in';
    const address = meta.address || '5th Floor, Plot No.7, IT Park, Sector-22 Panchkula, Haryana-134109';
    const title = meta.title || state.cardTitle || 'Farlex Promotional Reminder Card';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'farlex-rc-print-header';
    headerDiv.innerHTML = `
      <div>
        <div style="font-weight:700;font-size:15px;color:#0f172a;">${escapeHtml(company)}</div>
        <div style="font-size:12px;color:#0d6efd;font-weight:600;">${escapeHtml(title)}</div>
      </div>
      <div style="text-align:right;font-size:11px;color:#475569;">
        <div><strong>Web:</strong> ${escapeHtml(website)}</div>
        <div><strong>Tel:</strong> ${escapeHtml(phone)}</div>
      </div>
    `;

    const footerDiv = document.createElement('div');
    footerDiv.className = 'farlex-rc-print-footer';
    footerDiv.innerHTML = `
      <span>${escapeHtml(address)}</span>
      <span><strong>Email:</strong> ${escapeHtml(email)}</span>
    `;

    const slotEls = Array.from(sheetEl.querySelectorAll('[data-slot-index]'));
    slotEls.forEach((el) => el.classList.add('farlex-rc-print-slot'));

    sheetEl.prepend(headerDiv);
    sheetEl.appendChild(footerDiv);

    const cleanup = () => {
      headerDiv.remove();
      footerDiv.remove();
      slotEls.forEach((el) => el.classList.remove('farlex-rc-print-slot'));
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 1000);
  }

  function printCard(cardEl) {
    printStyledReminderCard(cardEl, { title: state.cardTitle });
  }

  function assignProductToSlot(slotIdx, prod) {
    const cfg = LAYOUTS[state.layoutKey] || LAYOUTS['2x2'];
    state.slots[slotIdx] = prod || null;

    let nextIdx = (slotIdx + 1) % cfg.slots;
    for (let offset = 1; offset <= cfg.slots; offset++) {
      const candidate = (slotIdx + offset) % cfg.slots;
      if (!state.slots[candidate]) {
        nextIdx = candidate;
        break;
      }
    }
    state.activeSlotIndex = nextIdx;
  }

  async function mount(container) {
    if (!container) return;

    container.innerHTML = `
      <section class="py-2">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h3 class="fw-bold mb-0">Reminder Card Builder</h3>
            <small class="text-muted">Select layout, assign products to slots, and export PNG or Print/PDF</small>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" id="rcExportPngBtn" class="btn btn-primary btn-sm">
              <i class="bi bi-image me-1"></i>Download PNG
            </button>
            <button type="button" id="rcPrintBtn" class="btn btn-outline-dark btn-sm">
              <i class="bi bi-printer me-1"></i>Print / Save PDF
            </button>
            <button type="button" id="rcClearAllBtn" class="btn btn-outline-danger btn-sm">
              Clear Slots
            </button>
          </div>
        </div>

        <div class="row g-4">
          <!-- Left: Card Settings & Live Preview -->
          <div class="col-lg-8">
            <div class="card border-0 shadow-sm p-3 mb-3">
              <div class="row g-2">
                <div class="col-md-4">
                  <label class="form-label small fw-semibold mb-1">Grid Layout</label>
                  <select id="rcLayoutSelect" class="form-select form-select-sm">
                    ${Object.entries(LAYOUTS).map(([k, v]) =>
                      `<option value="${k}" ${state.layoutKey === k ? 'selected' : ''}>${v.label}</option>`
                    ).join('')}
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label small fw-semibold mb-1">Doctor Name (Optional)</label>
                  <input type="text" id="rcDoctorInput" class="form-control form-control-sm" value="${escapeHtml(state.doctorName)}" placeholder="e.g. Dr. R. Sharma">
                </div>
                <div class="col-md-4">
                  <label class="form-label small fw-semibold mb-1">Clinic / Hospital (Optional)</label>
                  <input type="text" id="rcClinicInput" class="form-control form-control-sm" value="${escapeHtml(state.clinicName)}" placeholder="e.g. City Care Clinic">
                </div>
              </div>
            </div>

            <div id="rcPreviewCard" class="card border shadow-sm p-4 bg-white">
              <div class="border-bottom pb-2 mb-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <h5 class="fw-bold text-primary mb-0">${escapeHtml(state.cardTitle)}</h5>
                  <small class="text-muted" id="rcDoctorLine">
                    ${[state.doctorName ? `Dr. ${state.doctorName}` : '', state.clinicName].filter(Boolean).join(' • ') || 'Farlex Pharmaceuticals Pvt. Ltd.'}
                  </small>
                </div>
                <span class="badge bg-light text-dark border">Layout: ${escapeHtml(state.layoutKey)}</span>
              </div>

              <div id="rcSlotsContainer">${renderSlotsGrid()}</div>

              <div class="border-top pt-2 mt-3 small text-muted text-center">
                ${escapeHtml(state.footerNote)}
              </div>
            </div>
          </div>

          <!-- Right: Product Search & Slot Picker -->
          <div class="col-lg-4">
            <div class="card border-0 shadow-sm p-3">
              <h6 class="fw-bold mb-2">Add Product to Slot <span class="badge bg-primary" id="rcActiveSlotBadge">#${state.activeSlotIndex + 1}</span></h6>
              <input
                type="search"
                id="rcProductSearch"
                class="form-control form-control-sm mb-2"
                placeholder="Search product name or salt..."
              >
              <div class="list-group overflow-auto" id="rcProductList" style="max-height: 430px;">
                <div class="text-center py-4">
                  <div class="spinner-border spinner-border-sm text-primary"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    const rerenderSlots = () => {
      const slotsBox = container.querySelector('#rcSlotsContainer');
      const badge = container.querySelector('#rcActiveSlotBadge');
      if (slotsBox) slotsBox.innerHTML = renderSlotsGrid();
      if (badge) badge.textContent = `#${state.activeSlotIndex + 1}`;
    };

    const updateDoctorLine = () => {
      const line = container.querySelector('#rcDoctorLine');
      if (!line) return;
      const parts = [state.doctorName ? `Dr. ${state.doctorName}` : '', state.clinicName].filter(Boolean);
      line.textContent = parts.join(' • ') || 'Farlex Pharmaceuticals Pvt. Ltd.';
    };

    container.querySelector('#rcLayoutSelect')?.addEventListener('change', (e) => {
      state.layoutKey = e.target.value;
      rerenderSlots();
    });

    container.querySelector('#rcDoctorInput')?.addEventListener('input', (e) => {
      state.doctorName = e.target.value.trim();
      updateDoctorLine();
    });

    container.querySelector('#rcClinicInput')?.addEventListener('input', (e) => {
      state.clinicName = e.target.value.trim();
      updateDoctorLine();
    });

    const slotsContainerEl = container.querySelector('#rcSlotsContainer');

    slotsContainerEl?.addEventListener('change', (e) => {
      const selectEl = e.target.closest('.farlex-slot-product-select');
      if (!selectEl) return;
      const slotIdx = Number(selectEl.dataset.slotSelectIndex);
      if (Number.isNaN(slotIdx)) return;

      if (!selectEl.value) {
        state.slots[slotIdx] = null;
        rerenderSlots();
        return;
      }

      const chosenOption = selectEl.options[selectEl.selectedIndex];
      const prodIdx = Number(chosenOption?.dataset.prodIdx);
      const chosen = !Number.isNaN(prodIdx)
        ? state.productsCache[prodIdx]
        : state.productsCache.find((item) => String(item.name || '') === selectEl.value);

      if (chosen) {
        assignProductToSlot(slotIdx, chosen);
        rerenderSlots();
      }
    });

    slotsContainerEl?.addEventListener('click', (e) => {
      const selectBtn = e.target.closest('[data-select-slot]');
      if (selectBtn) {
        state.activeSlotIndex = Number(selectBtn.dataset.selectSlot) || 0;
        rerenderSlots();
        return;
      }
      const clearBtn = e.target.closest('[data-clear-slot]');
      if (clearBtn) {
        const idx = Number(clearBtn.dataset.clearSlot);
        if (!Number.isNaN(idx)) {
          state.slots[idx] = null;
          rerenderSlots();
        }
      }
    });

    container.querySelector('#rcProductList')?.addEventListener('click', (e) => {
      const item = e.target.closest('[data-add-product-idx]');
      if (!item) return;
      const idx = Number(item.dataset.addProductIdx);
      const chosen = state.productsCache[idx];
      if (!chosen) return;

      assignProductToSlot(state.activeSlotIndex, chosen);
      rerenderSlots();
    });

    let searchTimer = null;
    container.querySelector('#rcProductSearch')?.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      const val = e.target.value;
      searchTimer = setTimeout(async () => {
        await loadProducts(val);
        const listEl = container.querySelector('#rcProductList');
        if (listEl) listEl.innerHTML = renderProductPickerList();
        rerenderSlots();
      }, 200);
    });

    container.querySelector('#rcClearAllBtn')?.addEventListener('click', () => {
      state.slots = Array(8).fill(null);
      state.activeSlotIndex = 0;
      rerenderSlots();
    });

    container.querySelector('#rcExportPngBtn')?.addEventListener('click', () => {
      exportCardAsPng(container.querySelector('#rcPreviewCard'));
    });

    container.querySelector('#rcPrintBtn')?.addEventListener('click', () => {
      printCard(container.querySelector('#rcPreviewCard'));
    });

    await loadProducts('');
    const listEl = container.querySelector('#rcProductList');
    if (listEl) {
      listEl.innerHTML = renderProductPickerList();
    }
    rerenderSlots();
  }

  return { mount };
})();