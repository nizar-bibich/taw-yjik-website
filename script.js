    const topbar = document.getElementById('topbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navPanel = document.getElementById('mobileMenu');
    const navLinks = [...document.querySelectorAll('.nav-group a, .nav-panel-group a:not(.nav-panel-cta)')];

    const setHeaderState = () => {
      if (!topbar) return;
      topbar.classList.toggle('scrolled', window.scrollY > 20);
    };

    window.addEventListener('scroll', setHeaderState, { passive: true });
    setHeaderState();

    const closeMenu = () => {
      if (!navToggle || !navPanel) return;
      navPanel.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    };

    if (navToggle && navPanel) {
      navToggle.addEventListener('click', () => {
        const isOpen = navPanel.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });

      navLinks.forEach((link) => {
        link.addEventListener('click', () => closeMenu());
      });

      document.addEventListener('click', (event) => {
        if (!topbar.contains(event.target)) closeMenu();
      });
    }

    const sections = [...document.querySelectorAll('section[id], header[id], footer[id]')];
    const setActiveLink = () => {
      const offset = window.scrollY + 140;
      let currentId = null;

      sections.forEach((section) => {
        if (section.offsetTop <= offset) {
          currentId = section.id;
        }
      });

      navLinks.forEach((link) => {
        const active = currentId && link.getAttribute('href') === `#${currentId}`;
        link.classList.toggle('is-active', Boolean(active));
      });
    };

    window.addEventListener('scroll', setActiveLink, { passive: true });
    setActiveLink();

    const totalMs = 4 * 60 * 1000 + 32 * 1000;
    const timerEl = document.querySelector('.timer-card .time');
    const actionBtn = document.querySelector('.timer-card .action');
    let remaining = totalMs;

    function formatTime(ms) {
      const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    function updateDisplay() {
      remaining = Math.max(0, remaining - 1000);
      if (timerEl) timerEl.textContent = formatTime(remaining);

      if (remaining <= 0 && actionBtn) {
        actionBtn.textContent = 'جاهز';
      }
    }

    setInterval(updateDisplay, 1000);
