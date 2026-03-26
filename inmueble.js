/* =============================================
   INMUEBLE — Property detail page logic
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
  const sb = window.supabaseClient;
  if (!sb) return;

  const page = document.getElementById('detailPage');
  const loading = document.getElementById('detailLoading');
  if (!page) return;

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    showNotFound();
    return;
  }

  // Fetch property
  const { data: property, error } = await sb
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('is_visible', true)
    .single();

  if (error || !property) {
    showNotFound();
    return;
  }

  // Update page title
  document.title = `${property.title} | Rumbo Norte Real Estate`;

  const images = property.images || [];
  let currentImageIdx = 0;

  const typeLabels = {
    piso: 'Piso', casa: 'Casa', atico: 'Ático', duplex: 'Dúplex',
    estudio: 'Estudio', local: 'Local comercial', oficina: 'Oficina',
    garaje: 'Garaje', terreno: 'Terreno'
  };

  const opText = property.operation === 'venta' ? 'Venta' : 'Alquiler';
  const opClass = property.operation === 'venta' ? 'op-venta' : 'op-alquiler';

  let statusBadge = '';
  if (property.status === 'sold') statusBadge = '<span class="property-card-badge status-sold">Vendido</span>';
  else if (property.status === 'rented') statusBadge = '<span class="property-card-badge status-rented">Alquilado</span>';

  // Build features list
  const features = [];
  if (property.bedrooms) features.push({ icon: 'bed', label: `${property.bedrooms}`, sublabel: 'Habitaciones' });
  if (property.bathrooms) features.push({ icon: 'bath', label: `${property.bathrooms}`, sublabel: 'Baños' });
  if (property.sqm) features.push({ icon: 'area', label: `${property.sqm} m²`, sublabel: 'Superficie' });
  if (property.floor) features.push({ icon: 'floor', label: property.floor, sublabel: 'Planta' });
  if (property.has_elevator) features.push({ icon: 'elevator', label: 'Sí', sublabel: 'Ascensor' });
  if (property.has_garage) features.push({ icon: 'garage', label: 'Sí', sublabel: 'Garaje' });
  if (property.has_terrace) features.push({ icon: 'terrace', label: 'Sí', sublabel: 'Terraza' });
  if (property.has_pool) features.push({ icon: 'pool', label: 'Sí', sublabel: 'Piscina' });
  if (property.has_ac) features.push({ icon: 'ac', label: 'Sí', sublabel: 'Aire acond.' });
  if (property.has_storage) features.push({ icon: 'storage', label: 'Sí', sublabel: 'Trastero' });
  if (property.energy_rating) features.push({ icon: 'energy', label: property.energy_rating, sublabel: 'Energía' });

  const featureIcons = {
    bed: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v11"/><path d="M21 7v11"/><path d="M3 18h18"/><path d="M3 11h18"/><rect x="5" y="7" width="5" height="4" rx="1"/><rect x="14" y="7" width="5" height="4" rx="1"/></svg>',
    bath: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z"/><path d="M6 12V5a2 2 0 0 1 2-2h3v2.25"/></svg>',
    area: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
    floor: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>',
    elevator: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12l4-4 4 4"/></svg>',
    garage: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21V8l9-5 9 5v13"/><path d="M3 21h18"/><rect x="7" y="13" width="10" height="8"/></svg>',
    terrace: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16"/><path d="M12 4v16"/><path d="M4 12c2-2 4-3 8-3s6 1 8 3"/></svg>',
    pool: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 16c.6.5 1.2 1 2.5 1C7 17 7 15 9.5 15c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 20c.6.5 1.2 1 2.5 1C7 21 7 19 9.5 19c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M6 12V4h4v8"/><path d="M14 12V4h4v8"/></svg>',
    ac: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="8" rx="2"/><path d="M6 16v4"/><path d="M18 16v4"/><path d="M12 12v8"/></svg>',
    storage: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>',
    energy: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>'
  };

  const whatsappMsg = encodeURIComponent(`Hola, me interesa el inmueble: ${property.title} (${formatPrice(property.price, property.operation)})`);

  // Render page
  loading.style.display = 'none';
  page.innerHTML = `
    <div class="container" style="padding-top: 20px;">
      <a href="inmuebles.html" class="detail-back">← Volver a inmuebles</a>

      <!-- Gallery -->
      ${images.length > 0 ? `
        <div class="detail-gallery">
          <div class="detail-main-image" id="mainImage">
            <img src="${images[0]}" alt="${escapeAttr(property.title)}" id="mainImg">
            ${images.length > 1 ? `<span class="detail-image-counter">1 / ${images.length}</span>` : ''}
          </div>
          ${images.length > 1 ? `
            <div class="detail-thumbs">
              ${images.map((img, i) => `
                <div class="detail-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
                  <img src="${img}" alt="" loading="lazy">
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Content -->
      <div class="detail-content">
        <div class="detail-main">
          <div class="detail-header">
            <div class="detail-badges">
              <span class="property-card-badge ${opClass}">${opText}</span>
              ${statusBadge}
              <span class="property-card-badge" style="background:var(--color-surface);color:var(--color-text);">${typeLabels[property.property_type] || property.property_type}</span>
            </div>
            <div class="detail-price">${formatPrice(property.price, property.operation)}</div>
            <h1 class="detail-title">${escapeHtml(property.title)}</h1>
            <div class="detail-zone">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${escapeHtml(property.zone)}${property.address ? ' · ' + escapeHtml(property.address) : ''}
            </div>
          </div>

          ${features.length > 0 ? `
            <div class="detail-features">
              ${features.map(f => `
                <div class="detail-feature">
                  <div class="detail-feature-icon">${featureIcons[f.icon] || ''}</div>
                  <div class="detail-feature-text">
                    <strong>${f.label}</strong>
                    <span>${f.sublabel}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${property.description ? `
            <div class="detail-description">
              <h2>Descripción</h2>
              <p>${escapeHtml(property.description)}</p>
            </div>
          ` : ''}
        </div>

        <div class="detail-sidebar">
          <div class="detail-cta">
            <h2>¿Te interesa?</h2>
            <p>Contacta con nosotros para más información o concertar una visita</p>
            <div class="detail-cta-buttons">
              <a href="https://wa.me/34652392593?text=${whatsappMsg}" class="btn btn-primary" target="_blank" rel="noopener">
                WhatsApp
              </a>
              <a href="tel:+34652392593" class="btn btn-outline-dark">
                Llamar
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky bottom CTA for mobile -->
    <div class="detail-mobile-cta">
      <div class="detail-mobile-cta-price">${formatPrice(property.price, property.operation)}</div>
      <div class="detail-mobile-cta-buttons">
        <a href="tel:+34652392593" class="detail-mobile-cta-btn detail-mobile-cta-btn--call">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Llamar
        </a>
        <a href="https://wa.me/34652392593?text=${whatsappMsg}" class="detail-mobile-cta-btn detail-mobile-cta-btn--wa" target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
          WhatsApp
        </a>
      </div>
    </div>
  `;

  // --- Thumbnail interaction ---
  const thumbs = page.querySelectorAll('.detail-thumb');
  const mainImg = document.getElementById('mainImg');

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.index);
      currentImageIdx = idx;
      mainImg.src = images[idx];
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // --- Lightbox ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');

  const mainImageEl = document.getElementById('mainImage');
  if (mainImageEl) {
    mainImageEl.addEventListener('click', () => {
      if (images.length === 0) return;
      lightboxImg.src = images[currentImageIdx];
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.getElementById('lightboxPrev').addEventListener('click', () => {
    currentImageIdx = (currentImageIdx - 1 + images.length) % images.length;
    lightboxImg.src = images[currentImageIdx];
    updateThumbs();
  });

  document.getElementById('lightboxNext').addEventListener('click', () => {
    currentImageIdx = (currentImageIdx + 1) % images.length;
    lightboxImg.src = images[currentImageIdx];
    updateThumbs();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') document.getElementById('lightboxPrev').click();
    if (e.key === 'ArrowRight') document.getElementById('lightboxNext').click();
  });

  // --- Touch swipe for lightbox ---
  let touchStartX = 0;
  let touchStartY = 0;

  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    // Only trigger if horizontal swipe is dominant and large enough
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) document.getElementById('lightboxPrev').click();
      else document.getElementById('lightboxNext').click();
    }
  }, { passive: true });

  // --- Touch swipe on main gallery image ---
  const mainImageEl2 = document.getElementById('mainImage');
  if (mainImageEl2 && images.length > 1) {
    let galleryStartX = 0;
    mainImageEl2.addEventListener('touchstart', (e) => {
      galleryStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    mainImageEl2.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].screenX - galleryStartX;
      if (Math.abs(dx) > 50) {
        if (dx > 0) {
          currentImageIdx = (currentImageIdx - 1 + images.length) % images.length;
        } else {
          currentImageIdx = (currentImageIdx + 1) % images.length;
        }
        updateThumbs();
      }
    }, { passive: true });
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateThumbs() {
    thumbs.forEach(t => t.classList.remove('active'));
    const activeThumb = page.querySelector(`.detail-thumb[data-index="${currentImageIdx}"]`);
    if (activeThumb) activeThumb.classList.add('active');
    if (mainImg) mainImg.src = images[currentImageIdx];
    // Update counter
    const counter = page.querySelector('.detail-image-counter');
    if (counter) counter.textContent = `${currentImageIdx + 1} / ${images.length}`;
  }

  // --- Helpers ---
  function formatPrice(price, operation) {
    const formatted = new Intl.NumberFormat('es-ES').format(price);
    return operation === 'alquiler' ? `${formatted} €/mes` : `${formatted} €`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function showNotFound() {
    loading.style.display = 'none';
    page.innerHTML = `
      <div class="detail-not-found">
        <h1>Inmueble no encontrado</h1>
        <p>El inmueble que buscas no existe o ya no está disponible</p>
        <a href="inmuebles.html" class="btn btn-primary">Ver todos los inmuebles</a>
      </div>
    `;
  }
});
