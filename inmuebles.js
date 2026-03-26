/* =============================================
   INMUEBLES — Public listing logic
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile filter drawer toggle (runs independently of Supabase) ---
  const btnToggleFilters = document.getElementById('btnToggleFilters');
  const filterFields = document.getElementById('filterFields');

  if (btnToggleFilters && filterFields) {
    btnToggleFilters.addEventListener('click', () => {
      const isOpen = filterFields.classList.toggle('open');
      btnToggleFilters.classList.toggle('active', isOpen);
    });
  }

  const sb = window.supabaseClient;
  if (!sb) return;

  const grid = document.getElementById('propertyGrid');
  const countEl = document.getElementById('resultsCount');
  const loadMoreBtn = document.getElementById('btnLoadMore');
  const loadMoreWrapper = document.getElementById('loadMoreWrapper');
  const btnFilter = document.getElementById('btnFilter');
  const btnClear = document.getElementById('btnClearFilters');
  const sortSelect = document.getElementById('sortOrder');
  const filterZoneSelect = document.getElementById('filterZone');

  // Mobile filter elements
  const filterCountBadge = document.getElementById('filterCountBadge');
  const filterOperationQuick = document.getElementById('filterOperationQuick');
  const filterOperation = document.getElementById('filterOperation');

  if (!grid) return;

  const PAGE_SIZE = 12;
  let currentOffset = 0;
  let totalCount = 0;
  let allProperties = [];

  // --- Sync quick operation filter (mobile) <-> main filter ---
  if (filterOperationQuick) {
    filterOperationQuick.addEventListener('change', () => {
      filterOperation.value = filterOperationQuick.value;
      fetchProperties();
    });
  }

  // Keep quick filter in sync when main filter changes
  function syncQuickFilter() {
    if (filterOperationQuick) {
      filterOperationQuick.value = filterOperation.value;
    }
  }

  // --- Count active filters and show badge ---
  function updateFilterBadge() {
    const fields = [
      document.getElementById('filterOperation').value,
      document.getElementById('filterType').value,
      document.getElementById('filterZone').value,
      document.getElementById('filterPriceMin').value,
      document.getElementById('filterPriceMax').value,
      document.getElementById('filterBedrooms').value,
      document.getElementById('filterBathrooms').value,
    ];
    const count = fields.filter(v => v !== '' && v !== null).length;

    if (filterCountBadge) {
      if (count > 0) {
        filterCountBadge.textContent = count;
        filterCountBadge.style.display = '';
      } else {
        filterCountBadge.style.display = 'none';
      }
    }
  }

  // --- Load zones for filter ---
  async function loadZones() {
    const { data } = await sb
      .from('properties')
      .select('zone')
      .eq('is_visible', true);

    if (data) {
      const zones = [...new Set(data.map(p => p.zone))].sort();
      zones.forEach(z => {
        const opt = document.createElement('option');
        opt.value = z;
        opt.textContent = z;
        filterZoneSelect.appendChild(opt);
      });
    }
  }

  // --- Build query ---
  function buildQuery() {
    let query = sb
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('is_visible', true);

    const operation = document.getElementById('filterOperation').value;
    const type = document.getElementById('filterType').value;
    const zone = document.getElementById('filterZone').value;
    const priceMin = document.getElementById('filterPriceMin').value;
    const priceMax = document.getElementById('filterPriceMax').value;
    const bedrooms = document.getElementById('filterBedrooms').value;
    const bathrooms = document.getElementById('filterBathrooms').value;

    if (operation) query = query.eq('operation', operation);
    if (type) query = query.eq('property_type', type);
    if (zone) query = query.eq('zone', zone);
    if (priceMin) query = query.gte('price', parseFloat(priceMin));
    if (priceMax) query = query.lte('price', parseFloat(priceMax));
    if (bedrooms) query = query.gte('bedrooms', parseInt(bedrooms));
    if (bathrooms) query = query.gte('bathrooms', parseInt(bathrooms));

    // Sort
    const sort = sortSelect.value;
    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else if (sort === 'sqm_desc') query = query.order('sqm', { ascending: false, nullsFirst: false });
    else query = query.order('created_at', { ascending: false });

    return query;
  }

  // --- Fetch and render ---
  async function fetchProperties(append = false) {
    if (!append) {
      grid.innerHTML = '<div class="inmuebles-loading">Buscando inmuebles...</div>';
      currentOffset = 0;
      allProperties = [];
    }

    const query = buildQuery()
      .range(currentOffset, currentOffset + PAGE_SIZE - 1);

    const { data, error, count } = await query;

    if (error) {
      grid.innerHTML = '<div class="no-results"><p>Error al cargar los inmuebles</p></div>';
      return;
    }

    totalCount = count || 0;
    allProperties = append ? [...allProperties, ...data] : data;
    currentOffset += data.length;

    renderGrid();
    updateCount();
    updateLoadMore();
    updateFilterBadge();
    syncQuickFilter();

    // Close filter drawer on mobile after search
    if (filterFields && filterFields.classList.contains('open') && window.innerWidth < 768) {
      filterFields.classList.remove('open');
      btnToggleFilters.classList.remove('active');
    }
  }

  function renderGrid() {
    if (allProperties.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <p>No se encontraron inmuebles con los filtros seleccionados</p>
          <button class="btn-clear-filters" onclick="document.getElementById('btnClearFilters').click()">Limpiar filtros</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = allProperties.map(p => {
      const thumb = (p.images && p.images.length > 0) ? p.images[0] : '';
      const opClass = p.operation === 'venta' ? 'op-venta' : 'op-alquiler';
      const opText = p.operation === 'venta' ? 'Venta' : 'Alquiler';

      let statusBadge = '';
      if (p.status === 'sold') statusBadge = '<span class="property-card-badge status-sold">Vendido</span>';
      else if (p.status === 'rented') statusBadge = '<span class="property-card-badge status-rented">Alquilado</span>';

      const typeLabels = {
        piso: 'Piso', casa: 'Casa', atico: 'Ático', duplex: 'Dúplex',
        estudio: 'Estudio', local: 'Local', oficina: 'Oficina',
        garaje: 'Garaje', terreno: 'Terreno'
      };

      return `
        <a href="inmueble.html?id=${p.id}" class="property-card">
          <div class="property-card-image">
            ${thumb
              ? `<img src="${thumb}" alt="${escapeAttr(p.title)}" loading="lazy">`
              : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--color-text-light);">Sin imagen</div>'
            }
            <div class="property-card-badges">
              <span class="property-card-badge ${opClass}">${opText}</span>
              ${statusBadge}
            </div>
          </div>
          <div class="property-card-body">
            <div class="property-card-price">${formatPrice(p.price, p.operation)}</div>
            <div class="property-card-title">${escapeHtml(p.title)}</div>
            <div class="property-card-zone">${escapeHtml(p.zone)}${p.property_type ? ' · ' + (typeLabels[p.property_type] || p.property_type) : ''}</div>
            <div class="property-card-features">
              ${p.bedrooms ? `<span class="property-card-feature"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v11"/><path d="M21 7v11"/><path d="M3 18h18"/><path d="M3 11h18"/><rect x="5" y="7" width="5" height="4" rx="1"/><rect x="14" y="7" width="5" height="4" rx="1"/></svg>${p.bedrooms} hab.</span>` : ''}
              ${p.bathrooms ? `<span class="property-card-feature"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z"/><path d="M6 12V5a2 2 0 0 1 2-2h3v2.25"/></svg>${p.bathrooms} baño${p.bathrooms > 1 ? 's' : ''}</span>` : ''}
              ${p.sqm ? `<span class="property-card-feature"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>${p.sqm} m²</span>` : ''}
            </div>
          </div>
        </a>
      `;
    }).join('');
  }

  function updateCount() {
    countEl.textContent = `${totalCount} inmueble${totalCount !== 1 ? 's' : ''} encontrado${totalCount !== 1 ? 's' : ''}`;
  }

  function updateLoadMore() {
    if (currentOffset < totalCount) {
      loadMoreWrapper.style.display = '';
    } else {
      loadMoreWrapper.style.display = 'none';
    }
  }

  // --- Events ---
  btnFilter.addEventListener('click', () => fetchProperties());
  btnClear.addEventListener('click', () => {
    document.getElementById('filterOperation').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterZone').value = '';
    document.getElementById('filterPriceMin').value = '';
    document.getElementById('filterPriceMax').value = '';
    document.getElementById('filterBedrooms').value = '';
    document.getElementById('filterBathrooms').value = '';
    sortSelect.value = 'newest';
    fetchProperties();
  });

  sortSelect.addEventListener('change', () => fetchProperties());
  loadMoreBtn.addEventListener('click', () => fetchProperties(true));

  // Apply URL params as filters
  const params = new URLSearchParams(window.location.search);
  if (params.get('operation')) document.getElementById('filterOperation').value = params.get('operation');
  if (params.get('type')) document.getElementById('filterType').value = params.get('type');

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

  // --- Init ---
  loadZones();
  fetchProperties();
});
