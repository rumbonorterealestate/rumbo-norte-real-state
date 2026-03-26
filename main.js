/* =============================================
   RUMBO NORTE REAL ESTATE — Main JS
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Logo fallback ----------
  const logoImages = document.querySelectorAll('.logo-img');
  logoImages.forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const fallback = img.closest('.logo, .footer-logo')?.querySelector('.logo-fallback');
      if (fallback) fallback.classList.add('show');
    });
  });

  // ---------- Header scroll effect ----------
  const header = document.querySelector('.header');
  const scrollTop = document.querySelector('.scroll-top');

  if (header && scrollTop) {
    function onScroll() {
      const y = window.scrollY;
      header.classList.toggle('scrolled', y > 60);
      scrollTop.classList.toggle('visible', y > 500);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ---------- Scroll to top ----------
    scrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---------- Mobile menu ----------
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');

  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      nav.classList.toggle('open');
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ---------- Scroll animations (Intersection Observer) ----------
  const fadeEls = document.querySelectorAll('.fade-in');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    fadeEls.forEach(el => observer.observe(el));
  } else {
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  // ---------- Contact form ----------
  const form = document.getElementById('contactForm');
  const formContent = document.getElementById('formContent');
  const formSuccess = document.getElementById('formSuccess');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Reset errors
      form.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));

      let valid = true;

      const nombre = form.querySelector('#nombre');
      const telefono = form.querySelector('#telefono');
      const motivo = form.querySelector('#motivo');

      if (!nombre.value.trim()) {
        nombre.closest('.form-group').classList.add('error');
        valid = false;
      }

      if (!telefono.value.trim() || !/^[0-9+\s()-]{6,}$/.test(telefono.value.trim())) {
        telefono.closest('.form-group').classList.add('error');
        valid = false;
      }

      if (!motivo.value) {
        motivo.closest('.form-group').classList.add('error');
        valid = false;
      }

      if (valid) {
        formContent.style.display = 'none';
        formSuccess.classList.add('show');
      }
    });
  }

  // ---------- Pre-select motivo from CTA ----------
  const urlParams = new URLSearchParams(window.location.search);
  const motivoParam = urlParams.get('motivo');
  if (motivoParam) {
    const motivoSelect = document.getElementById('motivo');
    if (motivoSelect) {
      motivoSelect.value = motivoParam;
      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
    }
  }
});
