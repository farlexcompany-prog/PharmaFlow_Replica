window.PharmaApp = (() => {
  function showToast(message) {
    const container = document.getElementById('pfToastContainer');
    if (!container) return;

    const id = `toast-${Date.now()}`;
    const toastHtml = `
      <div id="${id}" class="toast align-items-center text-bg-dark border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>`;
    container.insertAdjacentHTML('beforeend', toastHtml);
    const el = document.getElementById(id);
    const bsToast = new bootstrap.Toast(el, { delay: 2500 });
    bsToast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
  }

  function initMenuToggle() {
    const shell = document.getElementById('pfShell');
    const toggleBtn = document.getElementById('menuToggleBtn');
    const backdrop = document.getElementById('sidebarBackdrop');

    function closeMobileDrawer() {
      shell.classList.remove('sidebar-open');
    }

    toggleBtn?.addEventListener('click', () => {
      if (window.innerWidth < 992) {
        shell.classList.toggle('sidebar-open');
      } else {
        shell.classList.toggle('sidebar-collapsed');
      }
    });

    backdrop?.addEventListener('click', closeMobileDrawer);

    document.querySelectorAll('.pf-nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 992) {
          closeMobileDrawer();
        }
      });
    });
  }

  function initMenuSearch() {
    const input = document.getElementById('menuSearchInput');
    const resultsBox = document.getElementById('menuSearchResults');
    if (!input || !resultsBox) return;

    const navItems = Array.from(document.querySelectorAll('.pf-nav-link')).map((a) => ({
      label: a.textContent.trim(),
      href: a.getAttribute('href'),
    }));

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.focus();
      }
    });

    function renderMatches(q) {
      const query = q.trim().toLowerCase();
      if (!query) {
        resultsBox.classList.add('d-none');
        resultsBox.innerHTML = '';
        return;
      }

      const matches = navItems.filter((item) => item.label.toLowerCase().includes(query));
      if (!matches.length) {
        resultsBox.innerHTML = `<div class="p-2 text-muted small">No matching menu item.</div>`;
      } else {
        resultsBox.innerHTML = matches
          .map((m) => `<a href="${m.href}" class="pf-search-item"><i class="bi bi-arrow-right-short"></i><span>${m.label}</span></a>`)
          .join('');
      }
      resultsBox.classList.remove('d-none');

      resultsBox.querySelectorAll('.pf-search-item').forEach((el) => {
        el.addEventListener('click', () => {
          resultsBox.classList.add('d-none');
          input.value = '';
        });
      });
    }

    input.addEventListener('input', () => renderMatches(input.value));
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.pf-search-box')) {
        resultsBox.classList.add('d-none');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMenuToggle();
    initMenuSearch();
    window.PharmaRouter?.init();
  });

  return { showToast };
})();