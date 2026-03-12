/* ============================================
   Automotores Marcos — Vehicle Catalog Module
   Conectado al sistema de stock en tiempo real
   ============================================ */

// ── Config ──
const API_URL = '/api/public/catalog';
const REFRESH_INTERVAL = 30000; // Actualizar cada 30 segundos

// ── State ──
let VEHICLES = [];
let currentFilter = 'todos';
let searchQuery = '';
let visibleCount = 9;
let isLoading = true;

// ── Fetch vehicles from API ──
async function fetchVehicles() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Error al cargar el catálogo');
    const data = await res.json();

    // Mapear datos del servidor al formato de la landing
    VEHICLES = data.map(v => {
      // Formatear kilometraje
      const km = v.mileage ? Number(v.mileage).toLocaleString('es-AR') + ' km' : 'Consultar';
      
      // Formatear precio
      const precio = v.price ? '$' + Number(v.price).toLocaleString('es-AR') : 'Consultar';

      // Imagen principal (primera foto o placeholder)
      const imagenPrincipal = v.photos && v.photos.length > 0
        ? v.photos[0].url
        : null;
      
      // Todas las fotos
      const fotos = v.photos ? v.photos.map(p => p.url) : [];

      return {
        id: v.id,
        marca: v.brand || 'Sin marca',
        modelo: v.model || 'Sin modelo',
        año: v.year || '',
        kilometraje: km,
        precio: precio,
        color: v.color || '',
        combustible: v.fuel || '',
        patente: v.license_plate || '',
        tipo: 'todos', // Sin clasificación de tipo por ahora
        imagen: imagenPrincipal,
        fotos: fotos,
        tienefotos: fotos.length > 0,
        photoCount: v.photoCount || 0,
        descripcion: generarDescripcion(v)
      };
    });

    isLoading = false;
    renderVehicles();
  } catch (error) {
    console.error('Error cargando catálogo:', error);
    isLoading = false;
    renderError();
  }
}

// ── Generar descripción automática ──
function generarDescripcion(v) {
  const partes = [];
  if (v.brand && v.model) partes.push(`${v.brand} ${v.model}`);
  if (v.year) partes.push(`Año ${v.year}`);
  if (v.color) partes.push(`Color ${v.color}`);
  if (v.fuel) partes.push(`Combustible: ${v.fuel}`);
  if (v.mileage) partes.push(`${Number(v.mileage).toLocaleString('es-AR')} kilómetros recorridos`);
  
  if (partes.length > 0) {
    return partes.join('. ') + '. Consultanos para más información y financiación.';
  }
  return 'Consultanos para más información sobre este vehículo. Financiación disponible.';
}

// ── Placeholder SVG para vehículos sin foto ──
function getPlaceholderSVG(marca, modelo) {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect fill="#0B1426" width="800" height="500"/><rect fill="#12203D" x="200" y="150" width="400" height="200" rx="20"/><text x="400" y="230" fill="#3B82F6" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" font-weight="600">${marca}</text><text x="400" y="260" fill="#60A5FA" text-anchor="middle" font-family="Inter,sans-serif" font-size="16">${modelo}</text><text x="400" y="310" fill="#3B82F680" text-anchor="middle" font-family="Inter,sans-serif" font-size="13">Fotos próximamente</text></svg>`)}`;
}

// ── Render Vehicle Cards ──
function renderVehicles() {
  const container = document.getElementById('vehicles-grid');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const noResults = document.getElementById('no-results');

  if (!container) return;

  // Show loading
  if (isLoading) {
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-20 gap-4">
        <div class="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-brand-300/60 text-sm font-medium">Cargando catálogo...</p>
      </div>
    `;
    return;
  }

  // Filter vehicles
  let filtered = VEHICLES.filter(v => {
    const matchesFilter = currentFilter === 'todos' || v.tipo === currentFilter;
    const matchesSearch = searchQuery === '' ||
      v.marca.toLowerCase().includes(searchQuery) ||
      v.modelo.toLowerCase().includes(searchQuery) ||
      `${v.marca} ${v.modelo}`.toLowerCase().includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  // Show/hide no results
  if (noResults) {
    noResults.classList.toggle('hidden', filtered.length > 0);
  }

  // Limit visible
  const toShow = filtered.slice(0, visibleCount);

  // Show/hide load more
  if (loadMoreBtn) {
    loadMoreBtn.classList.toggle('hidden', filtered.length <= visibleCount);
  }

  // Update counter
  const counter = document.getElementById('vehicle-count');
  if (counter) {
    counter.textContent = `${filtered.length} vehículo${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`;
  }

  // Render cards
  container.innerHTML = toShow.map((vehicle, index) => {
    const imgSrc = vehicle.imagen || getPlaceholderSVG(vehicle.marca, vehicle.modelo);
    const hasPhotos = vehicle.tienefotos;
    
    // Badge de fotos para los que tienen
    const photoBadge = hasPhotos && vehicle.photoCount > 1
      ? `<span class="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-brand-900 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
           <i class="fa-solid fa-images text-brand-500"></i> ${vehicle.photoCount} fotos
         </span>`
      : '';
    
    // Card con efecto especial para los que tienen fotos
    const cardClass = hasPhotos 
      ? 'vehicle-card vehicle-featured bg-white rounded-2xl overflow-hidden shadow-lg ring-1 ring-brand-500/20'
      : 'vehicle-card bg-white rounded-2xl overflow-hidden shadow-md opacity-90';

    return `
    <div class="${cardClass} animate-on-scroll delay-${(index % 4) + 1}"
         data-vehicle-id="${vehicle.id}">
      <div class="vehicle-image relative overflow-hidden aspect-vehicle">
        <img src="${imgSrc}"
             alt="${vehicle.marca} ${vehicle.modelo} ${vehicle.año}"
             class="w-full h-full object-cover"
             loading="lazy"
             onerror="this.src='${getPlaceholderSVG(vehicle.marca, vehicle.modelo)}'">
        <div class="absolute top-3 right-3">
          <span class="bg-brand-900/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            ${vehicle.año || '—'}
          </span>
        </div>
        ${vehicle.combustible ? `
        <div class="absolute top-3 left-3">
          <span class="bg-brand-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full capitalize">
            ${vehicle.combustible}
          </span>
        </div>` : ''}
        ${photoBadge}
      </div>
      <div class="p-5">
        <h3 class="font-heading font-bold text-lg text-brand-900 mb-1">
          ${vehicle.marca} ${vehicle.modelo}
        </h3>
        <div class="flex items-center gap-3 text-sm text-slate-500 mb-4">
          <span class="flex items-center gap-1">
            <i class="fa-solid fa-road text-xs"></i> ${vehicle.kilometraje}
          </span>
          ${vehicle.color ? `
          <span class="flex items-center gap-1">
            <i class="fa-solid fa-palette text-xs"></i> ${vehicle.color}
          </span>` : ''}
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xl font-heading font-bold text-brand-500">
            ${vehicle.precio}
          </span>
          <button onclick="openVehicleModal(${vehicle.id})"
                  class="vehicle-cta px-4 py-2 bg-slate-100 text-brand-900 rounded-xl text-sm font-semibold hover:bg-brand-500 hover:text-white transition-all duration-300">
            Ver más
          </button>
        </div>
      </div>
    </div>
  `}).join('');

  // Trigger scroll animations for new cards
  setTimeout(() => {
    document.querySelectorAll('.vehicle-card.animate-on-scroll').forEach(card => {
      observeElement(card);
    });
  }, 50);
}

// ── Render Error ──
function renderError() {
  const container = document.getElementById('vehicles-grid');
  if (!container) return;
  container.innerHTML = `
    <div class="col-span-full text-center py-16">
      <i class="fa-solid fa-triangle-exclamation text-5xl text-brand-700 mb-4"></i>
      <p class="text-lg text-brand-300/70 font-medium">No se pudo cargar el catálogo</p>
      <p class="text-sm text-brand-300/40 mt-1">Intentá de nuevo más tarde</p>
      <button onclick="location.reload()" class="mt-4 px-6 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-400 transition-all">
        Reintentar
      </button>
    </div>
  `;
}

// ── Vehicle Detail Modal ──
function openVehicleModal(vehicleId) {
  const vehicle = VEHICLES.find(v => v.id === vehicleId);
  if (!vehicle) return;

  const modal = document.getElementById('vehicle-modal');
  const content = document.getElementById('modal-vehicle-content');

  if (!modal || !content) return;

  const mainImg = vehicle.imagen || getPlaceholderSVG(vehicle.marca, vehicle.modelo);
  const hasMultiplePhotos = vehicle.fotos.length > 1;

  // Galería de fotos
  const galleryHTML = hasMultiplePhotos ? `
    <div class="flex gap-2 mt-3 px-6 overflow-x-auto pb-2">
      ${vehicle.fotos.map((foto, i) => `
        <button onclick="changeModalPhoto('${foto}', this)" 
                class="modal-thumb flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${i === 0 ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-transparent opacity-70 hover:opacity-100'}">
          <img src="${foto}" alt="Foto ${i + 1}" class="w-full h-full object-cover">
        </button>
      `).join('')}
    </div>
  ` : '';

  content.innerHTML = `
    <div class="relative">
      <img id="modal-main-photo" src="${mainImg}"
           alt="${vehicle.marca} ${vehicle.modelo}"
           class="w-full h-64 sm:h-80 md:h-96 object-cover transition-all duration-300"
           onerror="this.src='${getPlaceholderSVG(vehicle.marca, vehicle.modelo)}'">
      <div class="absolute inset-0 bg-gradient-to-t from-brand-900/60 to-transparent"></div>
      <div class="absolute bottom-4 left-6 right-6 flex items-center justify-between">
        <span class="bg-brand-500/90 text-white text-xs font-semibold px-3 py-1 rounded-full capitalize">${vehicle.combustible || 'Vehículo'}</span>
        ${vehicle.fotos.length > 0 ? `<span class="bg-white/90 text-brand-900 text-xs font-semibold px-2.5 py-1 rounded-full"><i class="fa-solid fa-images mr-1"></i>${vehicle.fotos.length} fotos</span>` : ''}
      </div>
    </div>
    ${galleryHTML}
    <div class="p-6 md:p-8">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h2 class="font-heading font-bold text-2xl md:text-3xl text-brand-900">
            ${vehicle.marca} ${vehicle.modelo}
          </h2>
          <p class="text-slate-500 mt-1">${vehicle.año ? `Año ${vehicle.año}` : ''}</p>
        </div>
        <span class="text-2xl md:text-3xl font-heading font-bold text-brand-500 whitespace-nowrap">
          ${vehicle.precio}
        </span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        ${vehicle.año ? `
        <div class="bg-slate-50 rounded-xl p-4 text-center">
          <i class="fa-solid fa-calendar text-brand-500 text-lg mb-2"></i>
          <p class="text-xs text-slate-500">Año</p>
          <p class="font-semibold text-brand-900">${vehicle.año}</p>
        </div>` : ''}
        <div class="bg-slate-50 rounded-xl p-4 text-center">
          <i class="fa-solid fa-road text-brand-500 text-lg mb-2"></i>
          <p class="text-xs text-slate-500">Kilometraje</p>
          <p class="font-semibold text-brand-900">${vehicle.kilometraje}</p>
        </div>
        ${vehicle.color ? `
        <div class="bg-slate-50 rounded-xl p-4 text-center">
          <i class="fa-solid fa-palette text-brand-500 text-lg mb-2"></i>
          <p class="text-xs text-slate-500">Color</p>
          <p class="font-semibold text-brand-900">${vehicle.color}</p>
        </div>` : ''}
        ${vehicle.combustible ? `
        <div class="bg-slate-50 rounded-xl p-4 text-center">
          <i class="fa-solid fa-gas-pump text-brand-500 text-lg mb-2"></i>
          <p class="text-xs text-slate-500">Combustible</p>
          <p class="font-semibold text-brand-900 capitalize">${vehicle.combustible}</p>
        </div>` : ''}
      </div>

      <div class="mb-8">
        <h3 class="font-heading font-semibold text-lg text-brand-900 mb-2">Descripción</h3>
        <p class="text-slate-600 leading-relaxed">${vehicle.descripcion}</p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <button onclick="consultVehicle('${vehicle.marca}', '${vehicle.modelo}', '${vehicle.año}')"
                class="flex-1 submit-btn bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3.5 px-6 rounded-xl text-center transition-all duration-300">
          <i class="fa-solid fa-envelope mr-2"></i> Consultar por este vehículo
        </button>
        <a href="https://wa.me/?text=${encodeURIComponent(`Hola, me interesa el ${vehicle.marca} ${vehicle.modelo} ${vehicle.año}. ¿Podrían darme más información?`)}"
           target="_blank"
           class="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 px-6 rounded-xl text-center transition-all duration-300 flex items-center justify-center gap-2">
          <i class="fa-brands fa-whatsapp text-lg"></i> WhatsApp
        </a>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ── Change modal photo ──
function changeModalPhoto(photoUrl, thumbEl) {
  const mainPhoto = document.getElementById('modal-main-photo');
  if (mainPhoto) {
    mainPhoto.style.opacity = '0';
    setTimeout(() => {
      mainPhoto.src = photoUrl;
      mainPhoto.style.opacity = '1';
    }, 150);
  }
  // Update thumb styles
  document.querySelectorAll('.modal-thumb').forEach(t => {
    t.classList.remove('border-brand-500', 'ring-2', 'ring-brand-500/30');
    t.classList.add('border-transparent', 'opacity-70');
  });
  if (thumbEl) {
    thumbEl.classList.remove('border-transparent', 'opacity-70');
    thumbEl.classList.add('border-brand-500', 'ring-2', 'ring-brand-500/30');
  }
}

function closeVehicleModal() {
  const modal = document.getElementById('vehicle-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ── Consult Vehicle (navigate to form) ──
function consultVehicle(marca, modelo, año) {
  closeVehicleModal();

  // Auto-fill form
  const vehicleInput = document.getElementById('vehiculo-consultado');
  if (vehicleInput) {
    vehicleInput.value = `${marca} ${modelo} ${año}`;
    vehicleInput.classList.add('vehicle-auto');
  }

  // Scroll to contact section
  const contactSection = document.getElementById('contacto');
  if (contactSection) {
    setTimeout(() => {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }
}

// ── Filter & Search Handlers ──
function setFilter(filter) {
  currentFilter = filter;
  visibleCount = 9;

  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  renderVehicles();
}

function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase().trim();
  visibleCount = 9;
  renderVehicles();
}

function loadMore() {
  visibleCount += 6;
  renderVehicles();
}

// ── Intersection Observer for Card Animations ──
function observeElement(el) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  observer.observe(el);
}

// ── Initialize Catalog ──
function initCatalog() {
  // Cargar vehículos desde el servidor
  fetchVehicles();

  // Auto-refresh cada 30 segundos para datos en tiempo real
  setInterval(fetchVehicles, REFRESH_INTERVAL);

  // Bind filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  // Bind search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  // Bind load more
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMore);
  }

  // Close modal on overlay click
  const modal = document.getElementById('vehicle-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeVehicleModal();
    });
  }

  // Close modal on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVehicleModal();
  });
}
