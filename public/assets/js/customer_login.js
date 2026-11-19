window.PharmaCustomerLogin = (() => {
  function escapeHtml(str = '') {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async function checkSession() {
    try {
      const res = await fetch('../api/auth.php?action=status', { credentials: 'same-origin' });
      const data = await res.json();
      return data.logged_in ? data.customer : null;
    } catch (_) {
      return null;
    }
  }

  function renderLoggedInView(container, customer) {
    container.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
          <div class="pf-card p-4">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <span class="badge text-bg-success-subtle text-success-emphasis border border-success-subtle">
                Verified Marg Party Session
              </span>
              <button type="button" class="btn btn-outline-danger btn-sm" id="customerLogoutBtn">
                <i class="bi bi-box-arrow-right me-1"></i>Logout
              </button>
            </div>
            <h4 class="fw-bold mb-1">${escapeHtml(customer.party_name)}</h4>
            <p class="text-muted small mb-3">Existing Buying Party Verified via Marg ERP List</p>
            <div class="border rounded-3 p-3 bg-light small mb-3">
              <div><strong>Mobile:</strong> ${escapeHtml(customer.phone)}</div>
              <div><strong>Marg Code:</strong> ${escapeHtml(customer.marg_code || 'N/A')}</div>
              <div><strong>City:</strong> ${escapeHtml(customer.city || 'N/A')}</div>
            </div>
            <div class="d-flex flex-wrap gap-2">
              <a href="#/products" class="btn btn-primary btn-sm"><i class="bi bi-capsule me-1"></i>Browse Products</a>
              <a href="#/downloads" class="btn btn-outline-primary btn-sm"><i class="bi bi-download me-1"></i>Downloads</a>
            </div>
          </div>
        </div>
      </div>`;

    document.getElementById('customerLogoutBtn')?.addEventListener('click', async () => {
      await fetch('../api/auth.php?action=logout', { credentials: 'same-origin' });
      window.PharmaApp?.showToast('Logged out successfully.');
      mount(container);
    });
  }

  function renderLoginForm(container) {
    container.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-5">
          <div class="pf-card p-4">
            <div class="mb-3">
              <span class="badge bg-light text-dark border mb-2">Customer Portal</span>
              <h4 class="fw-bold mb-1">Customer Login</h4>
              <p class="text-muted small mb-0">
                Only registered numbers uploaded from your Marg parties list are permitted to log in.
              </p>
            </div>

            <div id="custLoginAlert" class="d-none mb-3"></div>

            <form id="customerLoginForm" novalidate>
              <div class="mb-3">
                <label for="custPhoneInput" class="form-label small fw-semibold">Registered Mobile Number</label>
                <input
                  type="tel"
                  class="form-control"
                  id="custPhoneInput"
                  name="phone"
                  placeholder="e.g. 9876543210"
                  required
                >
                <div class="form-text">Enter the mobile number mapped to your existing party in Marg.</div>
              </div>

              <button type="submit" class="btn btn-primary w-100" id="custLoginSubmitBtn">
                <i class="bi bi-shield-check me-1"></i>Verify &amp; Login
              </button>
            </form>
          </div>
        </div>
      </div>`;

    const form = document.getElementById('customerLoginForm');
    const phoneInput = document.getElementById('custPhoneInput');
    const alertBox = document.getElementById('custLoginAlert');
    const submitBtn = document.getElementById('custLoginSubmitBtn');

    function showAlert(type, message) {
      alertBox.className = `alert alert-${type} small mb-3`;
      alertBox.textContent = message;
    }

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawPhone = phoneInput.value.trim();
      const digitsOnly = rawPhone.replace(/\D+/g, '');

      if (digitsOnly.length < 10) {
        showAlert('warning', 'Please enter a valid 10-digit mobile number.');
        phoneInput.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Checking Marg list...`;

      try {
        const res = await fetch('../api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            action: 'customer_login',
            phone: rawPhone,
          }),
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          showAlert('danger', data.error || 'Login denied.');
          return;
        }

        window.PharmaApp?.showToast(data.message || 'Login successful.');
        renderLoggedInView(container, data.customer);
      } catch (_) {
        showAlert('danger', 'Server connection error. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="bi bi-shield-check me-1"></i>Verify &amp; Login`;
      }
    });
  }

  async function mount(container) {
    container.innerHTML = `<div class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Checking session...</div>`;
    const customer = await checkSession();
    if (customer) {
      renderLoggedInView(container, customer);
    } else {
      renderLoginForm(container);
    }
  }

  return { mount };
})();