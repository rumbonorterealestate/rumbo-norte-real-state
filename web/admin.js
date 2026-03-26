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

  // --- Init ---
  loadProperties();
});
