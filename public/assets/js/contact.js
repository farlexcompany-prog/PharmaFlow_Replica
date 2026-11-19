window.PharmaContact = (() => {
  function escapeHtml(str = '') {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function mount(container) {
    container.innerHTML = `
      <div class="row g-3">
        <!-- Left Column: Farlex Contact Details -->
        <div class="col-12 col-lg-5">
          <div class="pf-card p-4 h-100">
            <span class="badge bg-light text-dark border mb-2">Farlex Pharmaceuticals Pvt. Ltd.</span>
            <h4 class="fw-bold mb-2">Contact Us</h4>
            <p class="text-muted small mb-4">
              Reach out to our team for party support, orders, franchise queries, and third-party manufacturing assistance.
            </p>

            <div class="d-flex align-items-start gap-3 mb-3">
              <div class="text-primary fs-5"><i class="bi bi-geo-alt-fill"></i></div>
              <div>
                <div class="fw-semibold small">Registered / Corporate Office</div>
                <div class="text-muted small">5th Floor, Plot No.7, IT Park, Sector-22 Panchkula, Haryana-134109</div>
              </div>
            </div>

            <div class="d-flex align-items-start gap-3 mb-3">
              <div class="text-primary fs-5"><i class="bi bi-telephone-fill"></i></div>
              <div>
                <div class="fw-semibold small">Phone</div>
                <a href="tel:+919875998089" class="text-decoration-none small">+91-9875998089</a>
              </div>
            </div>

            <div class="d-flex align-items-start gap-3 mb-4">
              <div class="text-primary fs-5"><i class="bi bi-envelope-fill"></i></div>
              <div>
                <div class="fw-semibold small">Email</div>
                <a href="mailto:Info@farlex.in" class="text-decoration-none small">Info@farlex.in</a>
              </div>
            </div>

            <div class="border-top pt-3 small text-muted">
              Official Website: <a href="https://www.farlex.in/" target="_blank" rel="noopener noreferrer">www.farlex.in</a>
            </div>
          </div>
        </div>

        <!-- Right Column: Validated Party Enquiry Form -->
        <div class="col-12 col-lg-7">
          <div class="pf-card p-4 h-100">
            <h5 class="fw-bold mb-1">Send an Enquiry</h5>
            <p class="text-muted small mb-3">Fill in your details and our team will get back to you.</p>

            <div id="contactFormAlert" class="d-none mb-3"></div>

            <form id="farlexContactForm" novalidate>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label for="cName" class="form-label small fw-semibold">Your Name / Party Name *</label>
                  <input type="text" class="form-control" id="cName" name="name" placeholder="Enter name or firm name" required>
                </div>

                <div class="col-12 col-md-6">
                  <label for="cPhone" class="form-label small fw-semibold">Mobile / Phone Number *</label>
                  <input type="tel" class="form-control" id="cPhone" name="phone" placeholder="e.g. 9875998089" required>
                </div>

                <div class="col-12 col-md-6">
                  <label for="cEmail" class="form-label small fw-semibold">Email Address *</label>
                  <input type="email" class="form-control" id="cEmail" name="email" placeholder="name@example.com" required>
                </div>

                <div class="col-12 col-md-6">
                  <label for="cTopic" class="form-label small fw-semibold">Enquiry Topic</label>
                  <select class="form-select" id="cTopic" name="topic">
                    <option value="Existing Party Support">Existing Party Support</option>
                    <option value="Pharma Business Opportunity">Pharma Business Opportunity</option>
                    <option value="Third Party Manufacturing">Third Party Manufacturing</option>
                    <option value="Product & Price List Query">Product &amp; Price List Query</option>
                  </select>
                </div>

                <div class="col-12">
                  <label for="cMessage" class="form-label small fw-semibold">Message *</label>
                  <textarea class="form-control" id="cMessage" name="message" rows="4" placeholder="Write your query, city, or requirement..." required></textarea>
                </div>

                <div class="col-12">
                  <button type="submit" class="btn btn-primary" id="contactSubmitBtn">
                    <i class="bi bi-send me-1"></i>Submit Enquiry
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>`;

    const form = document.getElementById('farlexContactForm');
    const alertBox = document.getElementById('contactFormAlert');
    const submitBtn = document.getElementById('contactSubmitBtn');

    function showAlert(type, text) {
      alertBox.className = `alert alert-${type} small mb-3`;
      alertBox.textContent = text;
    }

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
        name: document.getElementById('cName').value.trim(),
        phone: document.getElementById('cPhone').value.trim(),
        email: document.getElementById('cEmail').value.trim(),
        topic: document.getElementById('cTopic').value,
        message: document.getElementById('cMessage').value.trim(),
      };

      const digits = payload.phone.replace(/\D+/g, '');
      if (payload.name.length < 2) {
        showAlert('warning', 'Please enter your name or party name.');
        return;
      }
      if (digits.length < 10) {
        showAlert('warning', 'Please enter a valid 10-digit mobile/phone number.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        showAlert('warning', 'Please enter a valid email address.');
        return;
      }
      if (payload.message.length < 5) {
        showAlert('warning', 'Please write a short message (at least 5 characters).');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Sending...`;

      try {
        const res = await fetch('../api/inquiries.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          showAlert('danger', data.error || 'Could not submit enquiry.');
          return;
        }

        showAlert('success', data.message || 'Enquiry submitted successfully.');
        form.reset();
        window.PharmaApp?.showToast('Enquiry submitted!');
      } catch (_) {
        showAlert('danger', 'Server connection error. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="bi bi-send me-1"></i>Submit Enquiry`;
      }
    });
  }

  return { mount };
})();