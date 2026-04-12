/* =============================================
   ADMIN — CRUD de Inmuebles
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  const sb = window.supabaseClient;
  if (!sb) return;

  // Elements
  const listEl = document.getElementById('adminPropertyList');
  const modal = document.getElementById('propertyModal');
  const form = document.getElementById('propertyForm');
  const btnNew = document.getElementById('btnNewProperty');
  const btnSave = document.getElementById('btnSaveProperty');
  const btnCancel = document.getElementById('btnCancelForm');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const searchInput = document.getElementById('adminSearch');
  const imageUploadZone = document.getElementById('imageUploadZone');
  const imageInput = document.getElementById('imageInput');
  const imagePreviews = document.getElementById('imagePreviews');

  if (!listEl) return;

  let properties = [];
  let pendingImages = []; // { file, preview } for new uploads
  let existingImages = []; // URLs from DB (when editing)
  let editingId = null;

  // --- Load properties ---
  async function loadProperties() {
    listEl.innerHTML = '<div class="admin-loading">Cargando inmuebles...</div>';

    const { data, error } = await sb
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      listEl.innerHTML = '<div class="admin-empty"><p>Error al cargar los inmuebles</p></div>';
      return;
    }

    properties = data || [];
    updateStats();
    renderList();
  }

  // --- Stats ---
  function updateStats() {
    document.getElementById('statTotal').textContent = properties.length;
    document.getElementById('statPublished').textContent = properties.filter(p => p.status === 'published' && p.is_visible).length;
    document.getElementById('statSold').textContent = properties.filter(p => p.status === 'sold').length;
    document.getElementById('statRented').textContent = properties.filter(p => p.status === 'rented').length;
  }

  // --- Render list ---
  function renderList(filter = '') {
    const filtered = filter
      ? properties.filter(p =>
          p.title.toLowerCase().includes(filter) ||
          p.zone.toLowerCase().includes(filter)
        )
      : properties;

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="admin-empty"><p>No hay inmuebles' + (filter ? ' con esa búsqueda' : '') + '</p></div>';
      return;
    }

    listEl.innerHTML = filtered.map(p => {
      const thumb = (p.images && p.images.length > 0) ? p.images[0] : '';
      const statusBadge = p.status === 'published' ? 'badge-published' : p.status === 'sold' ? 'badge-sold' : 'badge-rented';
      const statusText = p.status === 'published' ? 'Publicado' : p.status === 'sold' ? 'Vendido' : 'Alquilado';
      const opBadge = p.operation === 'venta' ? 'badge-venta' : 'badge-alquiler';

      return `
        <div class="admin-property-card ${p.is_visible ? '' : 'hidden-property'}" data-id="${p.id}">
          ${thumb
            ? `<img src="${thumb}" class="admin-property-thumb" alt="">`
            : `<div class="admin-property-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--color-text-light);font-size:0.75rem;">Sin imagen</div>`
          }
          <div class="admin-property-info">
            <div class="admin-property-title">${escapeHtml(p.title)}</div>
            <div class="admin-property-meta">
              <span class="badge ${opBadge}">${p.operation}</span>
              <span class="badge ${statusBadge}">${statusText}</span>
              <span>${formatPrice(p.price, p.operation)}</span>
              <span>${escapeHtml(p.zone)}</span>
              ${p.bedrooms ? `<span>${p.bedrooms} hab.</span>` : ''}
              ${p.sqm ? `<span>${p.sqm} m²</span>` : ''}
            </div>
            <div class="admin-property-actions">
              <button onclick="adminEditProperty('${p.id}')">Editar</button>
              <button class="btn-toggle-vis ${p.is_visible ? 'is-visible' : ''}" onclick="adminToggleVisibility('${p.id}')">${p.is_visible ? 'Visible' : 'Oculto'}</button>
              <select onchange="adminChangeStatus('${p.id}', this.value)">
                <option value="published" ${p.status === 'published' ? 'selected' : ''}>Publicado</option>
                <option value="sold" ${p.status === 'sold' ? 'selected' : ''}>Vendido</option>
                <option value="rented" ${p.status === 'rented' ? 'selected' : ''}>Alquilado</option>
              </select>
              <button class="btn-delete" onclick="adminDeleteProperty('${p.id}')">Eliminar</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Search ---
  searchInput.addEventListener('input', (e) => {
    renderList(e.target.value.toLowerCase().trim());
  });

  // --- Modal controls ---
  function openModal(title = 'Nuevo inmueble') {
    modalTitle.textContent = title;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    resetForm();
  }

  function resetForm() {
    form.reset();
    document.getElementById('propId').value = '';
    document.getElementById('propVisible').checked = true;
    pendingImages = [];
    existingImages = [];
    imagePreviews.innerHTML = '';
    editingId = null;
  }

  btnNew.addEventListener('click', () => {
    resetForm();
    openModal('Nuevo inmueble');
  });
  btnCancel.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // --- Image upload ---
  imageUploadZone.addEventListener('click', () => imageInput.click());

  imageUploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadZone.classList.add('dragover');
  });

  imageUploadZone.addEventListener('dragleave', () => {
    imageUploadZone.classList.remove('dragover');
  });

  imageUploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    imageUploadZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  imageInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    imageInput.value = '';
  });

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        pendingImages.push({ file, preview: e.target.result });
        renderImagePreviews();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderImagePreviews() {
    imagePreviews.innerHTML = '';

    // Existing images from DB
    existingImages.forEach((url, i) => {
      const div = document.createElement('div');
      div.className = 'image-preview-item' + (i === 0 && pendingImages.length === 0 ? ' cover' : '');
      div.innerHTML = `
        <img src="${url}" alt="">
        <button type="button" class="remove-image" data-type="existing" data-index="${i}">&times;</button>
      `;
      imagePreviews.appendChild(div);
    });

    // Pending new images
    pendingImages.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'image-preview-item' + (i === 0 && existingImages.length === 0 ? ' cover' : '');
      div.innerHTML = `
        <img src="${item.preview}" alt="">
        <button type="button" class="remove-image" data-type="pending" data-index="${i}">&times;</button>
      `;
      imagePreviews.appendChild(div);
    });

    // Remove handlers
    imagePreviews.querySelectorAll('.remove-image').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.dataset.type;
        const idx = parseInt(btn.dataset.index);
        if (type === 'existing') existingImages.splice(idx, 1);
        else pendingImages.splice(idx, 1);
        renderImagePreviews();
      });
    });
  }

  // --- Save property ---
  btnSave.addEventListener('click', async () => {
    const title = document.getElementById('propTitle').value.trim();
    const price = parseFloat(document.getElementById('propPrice').value);
    const propType = document.getElementById('propType').value;
    const operation = document.getElementById('propOperation').value;
    const zone = document.getElementById('propZone').value.trim();

    if (!title || !price || !propType || !operation || !zone) {
      alert('Rellena todos los campos obligatorios (*)');
      return;
    }

    btnSave.textContent = 'Guardando...';
    btnSave.disabled = true;

    try {
      // Upload new images
      const uploadedUrls = [];
      const propId = editingId || crypto.randomUUID();

      for (const item of pendingImages) {
        const ext = item.file.name.split('.').pop();
        const fileName = `${propId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

        const { error: uploadError } = await sb.storage
          .from('property-images')
          .upload(fileName, item.file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: urlData } = sb.storage
          .from('property-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      const allImages = [...existingImages, ...uploadedUrls];

      const propertyData = {
        title,
        description: document.getElementById('propDescription').value.trim(),
        property_type: propType,
        operation,
        price,
        zone,
        address: document.getElementById('propAddress').value.trim() || null,
        bedrooms: parseInt(document.getElementById('propBedrooms').value) || 0,
        bathrooms: parseInt(document.getElementById('propBathrooms').value) || 0,
        sqm: parseFloat(document.getElementById('propSqm').value) || null,
        floor: document.getElementById('propFloor').value.trim() || null,
        has_elevator: document.getElementById('propElevator').checked,
        has_garage: document.getElementById('propGarage').checked,
        has_terrace: document.getElementById('propTerrace').checked,
        has_pool: document.getElementById('propPool').checked,
        has_ac: document.getElementById('propAC').checked,
        has_storage: document.getElementById('propStorage').checked,
        energy_rating: document.getElementById('propEnergy').value || null,
        images: allImages,
        status: document.getElementById('propStatus').value,
        is_visible: document.getElementById('propVisible').checked,
      };

      if (editingId) {
        const { error } = await sb.from('properties').update(propertyData).eq('id', editingId);
        if (error) throw error;
      } else {
        propertyData.id = propId;
        const { error } = await sb.from('properties').insert(propertyData);
        if (error) throw error;
      }

      closeModal();
      await loadProperties();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      btnSave.textContent = 'Guardar inmueble';
      btnSave.disabled = false;
    }
  });

  // --- Edit property (global) ---
  window.adminEditProperty = async (id) => {
    const prop = properties.find(p => p.id === id);
    if (!prop) return;

    editingId = id;
    existingImages = [...(prop.images || [])];
    pendingImages = [];

    document.getElementById('propId').value = id;
    document.getElementById('propTitle').value = prop.title;
    document.getElementById('propPrice').value = prop.price;
    document.getElementById('propType').value = prop.property_type;
    document.getElementById('propOperation').value = prop.operation;
    document.getElementById('propZone').value = prop.zone;
    document.getElementById('propAddress').value = prop.address || '';
    document.getElementById('propBedrooms').value = prop.bedrooms || 0;
    document.getElementById('propBathrooms').value = prop.bathrooms || 0;
    document.getElementById('propSqm').value = prop.sqm || '';
    document.getElementById('propFloor').value = prop.floor || '';
    document.getElementById('propEnergy').value = prop.energy_rating || '';
    document.getElementById('propStatus').value = prop.status;
    document.getElementById('propElevator').checked = prop.has_elevator || false;
    document.getElementById('propGarage').checked = prop.has_garage || false;
    document.getElementById('propTerrace').checked = prop.has_terrace || false;
    document.getElementById('propPool').checked = prop.has_pool || false;
    document.getElementById('propAC').checked = prop.has_ac || false;
    document.getElementById('propStorage').checked = prop.has_storage || false;
    document.getElementById('propDescription').value = prop.description || '';
    document.getElementById('propVisible').checked = prop.is_visible;

    renderImagePreviews();
    openModal('Editar inmueble');
  };

  // --- Toggle visibility (global) ---
  window.adminToggleVisibility = async (id) => {
    const prop = properties.find(p => p.id === id);
    if (!prop) return;

    const { error } = await sb.from('properties')
      .update({ is_visible: !prop.is_visible })
      .eq('id', id);

    if (!error) await loadProperties();
  };

  // --- Change status (global) ---
  window.adminChangeStatus = async (id, status) => {
    const { error } = await sb.from('properties')
      .update({ status })
      .eq('id', id);

    if (!error) await loadProperties();
  };

  // --- Delete property (global) ---
  window.adminDeleteProperty = async (id) => {
    if (!confirm('¿Eliminar este inmueble? Esta acción no se puede deshacer.')) return;

    const prop = properties.find(p => p.id === id);

    // Delete images from storage
    if (prop && prop.images && prop.images.length > 0) {
      const paths = prop.images.map(url => {
        const parts = url.split('/property-images/');
        return parts.length > 1 ? parts[1] : null;
      }).filter(Boolean);

      if (paths.length > 0) {
        await sb.storage.from('property-images').remove(paths);
      }
    }

    const { error } = await sb.from('properties').delete().eq('id', id);
    if (!error) await loadProperties();
  };

  // --- Helpers ---
  function formatPrice(price, operation) {
    const formatted = new Intl.NumberFormat('es-ES').format(price);
    return operation === 'alquiler' ? `${formatted} €/mes` : `${formatted} €`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // =============================================
  // TABS
  // =============================================
  const tabs = document.querySelectorAll('.admin-tab');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // =============================================
  // REVIEWS CRUD
  // =============================================
  const reviewListEl = document.getElementById('adminReviewList');
  const reviewModal = document.getElementById('reviewModal');
  const reviewForm = document.getElementById('reviewForm');
  const btnNewReview = document.getElementById('btnNewReview');
  const btnSaveReview = document.getElementById('btnSaveReview');
  const btnCancelReview = document.getElementById('btnCancelReview');
  const reviewModalClose = document.getElementById('reviewModalClose');
  const reviewModalTitle = document.getElementById('reviewModalTitle');
  const btnSaveSettings = document.getElementById('btnSaveSettings');

  let reviews = [];
  let editingReviewId = null;

  // --- Load review settings ---
  async function loadReviewSettings() {
    const { data } = await sb
      .from('review_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) {
      document.getElementById('settingRating').value = data.google_rating;
      document.getElementById('settingCount').value = data.google_review_count;
      document.getElementById('settingUrl').value = data.google_maps_url || '';
    }
  }

  // --- Save review settings ---
  btnSaveSettings.addEventListener('click', async () => {
    const google_rating = parseFloat(document.getElementById('settingRating').value);
    const google_review_count = parseInt(document.getElementById('settingCount').value);
    const google_maps_url = document.getElementById('settingUrl').value.trim();

    if (isNaN(google_rating) || google_rating < 1 || google_rating > 5) {
      alert('La media debe estar entre 1 y 5');
      return;
    }

    btnSaveSettings.textContent = 'Guardando...';
    btnSaveSettings.disabled = true;

    const { error } = await sb
      .from('review_settings')
      .upsert({ id: 1, google_rating, google_review_count, google_maps_url });

    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      btnSaveSettings.textContent = 'Guardado';
      setTimeout(() => { btnSaveSettings.textContent = 'Guardar datos de Google'; }, 1500);
    }
    btnSaveSettings.disabled = false;
  });

  // --- Load reviews ---
  async function loadReviews() {
    reviewListEl.innerHTML = '<div class="admin-loading">Cargando reseñas...</div>';

    const { data, error } = await sb
      .from('reviews')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      reviewListEl.innerHTML = '<div class="admin-empty"><p>Error al cargar las reseñas</p></div>';
      return;
    }

    reviews = data || [];
    renderReviews();
  }

  // --- Render reviews ---
  function renderReviews() {
    if (reviews.length === 0) {
      reviewListEl.innerHTML = '<div class="admin-empty"><p>No hay reseñas todavía</p></div>';
      return;
    }

    reviewListEl.innerHTML = reviews.map((r, idx) => {
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      return `
        <div class="admin-property-card ${r.is_visible ? '' : 'hidden-property'}" data-review-id="${r.id}">
          <div class="review-stars-col">${stars}</div>
          <div class="admin-property-info">
            <div class="admin-property-title">${escapeHtml(r.author_name)}</div>
            <div class="admin-property-meta">
              <span class="review-text-preview">"${escapeHtml(r.review_text.length > 100 ? r.review_text.slice(0, 100) + '...' : r.review_text)}"</span>
            </div>
            <div class="admin-property-actions">
              <button onclick="adminEditReview('${r.id}')">Editar</button>
              <button class="btn-toggle-vis ${r.is_visible ? 'is-visible' : ''}" onclick="adminToggleReviewVisibility('${r.id}')">${r.is_visible ? 'Visible' : 'Oculta'}</button>
              ${idx > 0 ? `<button onclick="adminMoveReview('${r.id}', 'up')">▲</button>` : ''}
              ${idx < reviews.length - 1 ? `<button onclick="adminMoveReview('${r.id}', 'down')">▼</button>` : ''}
              <button class="btn-delete" onclick="adminDeleteReview('${r.id}')">Eliminar</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Review modal controls ---
  function openReviewModal(title = 'Nueva reseña') {
    reviewModalTitle.textContent = title;
    reviewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeReviewModal() {
    reviewModal.classList.remove('active');
    document.body.style.overflow = '';
    resetReviewForm();
  }

  function resetReviewForm() {
    reviewForm.reset();
    document.getElementById('reviewId').value = '';
    document.getElementById('reviewVisible').checked = true;
    document.getElementById('reviewRating').value = '5';
    editingReviewId = null;
  }

  btnNewReview.addEventListener('click', () => {
    resetReviewForm();
    openReviewModal('Nueva reseña');
  });
  btnCancelReview.addEventListener('click', closeReviewModal);
  reviewModalClose.addEventListener('click', closeReviewModal);
  reviewModal.addEventListener('click', (e) => {
    if (e.target === reviewModal) closeReviewModal();
  });

  // --- Save review ---
  btnSaveReview.addEventListener('click', async () => {
    const author_name = document.getElementById('reviewAuthor').value.trim();
    const review_text = document.getElementById('reviewText').value.trim();
    const rating = parseInt(document.getElementById('reviewRating').value);
    const is_visible = document.getElementById('reviewVisible').checked;

    if (!author_name || !review_text) {
      alert('Rellena todos los campos obligatorios');
      return;
    }

    btnSaveReview.textContent = 'Guardando...';
    btnSaveReview.disabled = true;

    try {
      if (editingReviewId) {
        const { error } = await sb.from('reviews')
          .update({ author_name, review_text, rating, is_visible })
          .eq('id', editingReviewId);
        if (error) throw error;
      } else {
        // New review: set sort_order to last
        const maxOrder = reviews.length > 0 ? Math.max(...reviews.map(r => r.sort_order)) + 1 : 0;
        const { error } = await sb.from('reviews')
          .insert({ author_name, review_text, rating, is_visible, sort_order: maxOrder });
        if (error) throw error;
      }

      closeReviewModal();
      await loadReviews();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      btnSaveReview.textContent = 'Guardar reseña';
      btnSaveReview.disabled = false;
    }
  });

  // --- Edit review (global) ---
  window.adminEditReview = (id) => {
    const r = reviews.find(rv => rv.id === id);
    if (!r) return;

    editingReviewId = id;
    document.getElementById('reviewId').value = id;
    document.getElementById('reviewAuthor').value = r.author_name;
    document.getElementById('reviewText').value = r.review_text;
    document.getElementById('reviewRating').value = r.rating;
    document.getElementById('reviewVisible').checked = r.is_visible;

    openReviewModal('Editar reseña');
  };

  // --- Toggle review visibility (global) ---
  window.adminToggleReviewVisibility = async (id) => {
    const r = reviews.find(rv => rv.id === id);
    if (!r) return;

    const { error } = await sb.from('reviews')
      .update({ is_visible: !r.is_visible })
      .eq('id', id);

    if (!error) await loadReviews();
  };

  // --- Move review up/down (global) ---
  window.adminMoveReview = async (id, direction) => {
    const idx = reviews.findIndex(r => r.id === id);
    if (idx < 0) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= reviews.length) return;

    const currentOrder = reviews[idx].sort_order;
    const swapOrder = reviews[swapIdx].sort_order;

    await Promise.all([
      sb.from('reviews').update({ sort_order: swapOrder }).eq('id', reviews[idx].id),
      sb.from('reviews').update({ sort_order: currentOrder }).eq('id', reviews[swapIdx].id),
    ]);

    await loadReviews();
  };

  // --- Delete review (global) ---
  window.adminDeleteReview = async (id) => {
    if (!confirm('¿Eliminar esta reseña?')) return;

    const { error } = await sb.from('reviews').delete().eq('id', id);
    if (!error) await loadReviews();
  };

  // --- Init ---
  loadProperties();
  loadReviewSettings();
  loadReviews();
});
