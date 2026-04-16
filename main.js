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
    const submitBtn = form.querySelector('#formSubmitBtn');
    const formError = form.querySelector('#formError');
    const subjectInput = form.querySelector('#formSubject');

    const motivoLabels = {
      vender: 'Quiero vender',
      comprar: 'Quiero comprar',
      alquilar: 'Quiero alquilar',
      arrendar: 'Quiero arrendar',
      otro: 'Otro'
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      form.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));
      if (formError) formError.style.display = 'none';

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

      if (!valid) return;

      if (subjectInput) {
        const motivoTxt = motivoLabels[motivo.value] || motivo.value;
        subjectInput.value = `Nuevo contacto web — ${motivoTxt} — ${nombre.value.trim()}`;
      }

      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';

      try {
        const formData = new FormData(form);
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();

        if (response.ok && result.success) {
          formContent.style.display = 'none';
          formSuccess.classList.add('show');
        } else {
          throw new Error(result.message || 'Error en el envío');
        }
      } catch (err) {
        if (formError) formError.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
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

  // ---------- Load reviews from Supabase ----------
  const resenasSlider = document.getElementById('resenasSlider');
  const badgeText = document.getElementById('badgeText');
  const googleLink = document.getElementById('resenasGoogleLink');
  const sb = window.supabaseClient;

  if (resenasSlider && sb) {
    loadReviews();
  }

  async function loadReviews() {
    try {
      // Fetch settings and visible reviews in parallel
      const [settingsRes, reviewsRes] = await Promise.all([
        sb.from('review_settings').select('*').eq('id', 1).single(),
        sb.from('reviews').select('*').order('sort_order', { ascending: true }),
      ]);

      const settings = settingsRes.data;
      const reviews = reviewsRes.data || [];

      // Update badge
      if (settings && badgeText) {
        badgeText.textContent = `${settings.google_rating}/5 en Google · ${settings.google_review_count} reseñas`;
      }

      // Update Google link
      if (settings && settings.google_maps_url && googleLink) {
        googleLink.href = settings.google_maps_url;
      }

      // Update structured data (JSON-LD)
      if (settings) {
        const ldScript = document.querySelector('script[type="application/ld+json"]');
        if (ldScript) {
          try {
            const ld = JSON.parse(ldScript.textContent);
            if (ld.aggregateRating) {
              ld.aggregateRating.ratingValue = String(settings.google_rating);
              ld.aggregateRating.reviewCount = String(settings.google_review_count);
              ldScript.textContent = JSON.stringify(ld);
            }
          } catch (_) { /* ignore parse errors */ }
        }
      }

      // Render review cards
      if (reviews.length === 0) {
        resenasSlider.innerHTML = '<p style="text-align:center;color:var(--color-text-light);">No hay reseñas disponibles.</p>';
        return;
      }

      const starSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#D4A853" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
      const emptyStarSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4A853" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

      resenasSlider.innerHTML = reviews.map(r => {
        const stars = starSvg.repeat(r.rating) + emptyStarSvg.repeat(5 - r.rating);
        const text = r.review_text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const author = r.author_name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `
          <div class="resena-card">
            <div class="resena-stars">${stars}</div>
            <p class="resena-text">"${text}"</p>
            <div class="resena-author">${author}</div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  }
});
