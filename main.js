

'use strict';

/* ============================================================
   NAVBAR — scroll glass effect + active link + mobile menu
   ============================================================ */
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');

  if (!navbar) return;

  // Scroll glass effect
  window.addEventListener('scroll', function () {
    if (window.scrollY > 24) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  // Active link highlight
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const links = document.querySelectorAll('.nav-link, .mobile-nav-link');
  links.forEach(function (link) {
    const href = link.getAttribute('href');
    if (!href) return;
    const hrefClean = href.replace(/\/$/, '') || '/';
    if (path.endsWith(hrefClean)) {
      link.classList.add('active');
    }
  });

  // Hamburger toggle
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile nav on link click
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!navbar.contains(e.target)) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
      }
    });
  }
})();

/* ============================================================
   SCROLL ANIMATIONS — IntersectionObserver
   ============================================================ */
(function initScrollAnimations() {
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.fade-up, .fade-in, .stagger').forEach(function (el) {
    io.observe(el);
  });
})();

/* ============================================================
   COUNTER ANIMATION — stats numbers
   ============================================================ */
(function initCounters() {
  const counters = document.querySelectorAll('.count-up');
  if (!counters.length) return;

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const dur    = 1800;
      const step   = 16;
      let   start  = null;
      const isFloat = target % 1 !== 0;

      function tick(ts) {
        if (!start) start = ts;
        const prog = Math.min((ts - start) / dur, 1);
        const ease = 1 - Math.pow(1 - prog, 3);
        const cur  = isFloat ? (target * ease).toFixed(1) : Math.floor(target * ease);
        el.textContent = prefix + cur + suffix;
        if (prog < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(function (el) { io.observe(el); });
})();

(function initCarModals() {
  const overlay = document.getElementById('car-modal-overlay');
  if (!overlay) return;

  const modalImg    = overlay.querySelector('#modal-img');
  const modalName   = overlay.querySelector('#modal-name');
  const modalSub    = overlay.querySelector('#modal-subtitle');
  const modalPrice  = overlay.querySelector('#modal-price');
  const modalSpecs  = overlay.querySelector('#modal-specs');
  const closeBtn    = overlay.querySelector('.modal-close');

  document.querySelectorAll('.open-modal-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const card = btn.closest('[data-car]');
      if (!card) return;

      const data = JSON.parse(card.dataset.car);
      if (modalImg)   { modalImg.src = data.img; modalImg.alt = data.name; }
      if (modalName)  { modalName.textContent = data.name; }
      if (modalSub)   { modalSub.textContent  = data.subtitle; }
      if (modalPrice) { modalPrice.textContent = data.price; }

      if (modalSpecs && data.specs) {
        modalSpecs.innerHTML = Object.entries(data.specs).map(function (pair) {
          return '<div class="modal-spec"><span class="key">' + pair[0] + '</span><span class="val">' + pair[1] + '</span></div>';
        }).join('');
      }

      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();

/* ============================================================
   INVENTORY PAGE — tabs + filter
   ============================================================ */
(function initInventory() {
  const tabBtns    = document.querySelectorAll('.tab-btn');
  const searchInput = document.getElementById('inv-search');
  const typeSelect  = document.getElementById('inv-type');
  const priceSelect = document.getElementById('inv-price');

  if (!tabBtns.length) return;

  let activeTab = 'vehicles';

  // Tab switching
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      filterRows();
    });
  });

  function getMaxPrice(val) {
    if (!val || val === 'all') return Infinity;
    const map = { 'u500':500000, 'u1m':1000000, 'u2m':2000000, 'u3m':3000000 };
    return map[val] || Infinity;
  }

  function filterRows() {
    const q     = searchInput  ? searchInput.value.toLowerCase()  : '';
    const type  = typeSelect   ? typeSelect.value                 : 'all';
    const maxPr = priceSelect  ? getMaxPrice(priceSelect.value)   : Infinity;

    document.querySelectorAll('.inv-row').forEach(function (row) {
      const rowTab   = row.dataset.tab;
      const rowName  = (row.dataset.name  || '').toLowerCase();
      const rowType  = (row.dataset.type  || '').toLowerCase();
      const rowPrice = parseFloat(row.dataset.price) || 0;

      const tabMatch   = rowTab === activeTab;
      const searchMatch = !q || rowName.includes(q);
      const typeMatch  = !type || type === 'all' || rowType === type;
      const priceMatch = rowPrice <= maxPr;

      if (tabMatch && searchMatch && typeMatch && priceMatch) {
        row.classList.remove('hidden');
      } else {
        row.classList.add('hidden');
      }
    });
  }

  if (searchInput) searchInput.addEventListener('input',  filterRows);
  if (typeSelect)  typeSelect.addEventListener('change',  filterRows);
  if (priceSelect) priceSelect.addEventListener('change', filterRows);

  filterRows();
})();

/* ============================================================
   CONTACT FORM — submission
   ============================================================ */
(function initContactForm() {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const btn = form.querySelector('[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Sending...';
    }

    // Simulate async send
    setTimeout(function () {
      form.reset();
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Send Message';
      }
      if (success) {
        success.style.display = 'block';
        setTimeout(function () { success.style.display = 'none'; }, 6000);
      }
    }, 1400);
  });
})();

/* ============================================================
   SMOOTH PAGE TRANSITIONS (optional fade)
   ============================================================ */
(function initPageFade() {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.35s ease';

  window.addEventListener('load', function () {
    document.body.style.opacity = '1';
  });

  document.querySelectorAll('a[href]').forEach(function (a) {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel') || a.target === '_blank') return;

    a.addEventListener('click', function (e) {
      e.preventDefault();
      document.body.style.opacity = '0';
      setTimeout(function () { window.location.href = href; }, 300);
    });
  });
})();
