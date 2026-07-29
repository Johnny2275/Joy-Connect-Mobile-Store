const DEPOSIT_PCT = 0.4;

// --- SUPABASE CONNECTION ---
const SUPABASE_URL = 'https://gkskksiqpnhecbfcgdzq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_V8Uxpe4R_nxPThef25rvOQ_ipEbkdj3';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORY_ICON = {phone:'📱', laptop:'💻', gaming:'🎮'};

let products = {phone:[], laptop:[], gaming:[]};
let allProducts = [];

async function loadProducts(){
  const { data, error } = await sb.from('products').select('*');

  if(error){
    console.error('Supabase fetch error:', error);
    ['phone-grid','laptop-grid','gaming-grid'].forEach(id => {
      document.getElementById(id).innerHTML = `<div class="sd-empty">Couldn't load products right now. Please refresh.</div>`;
    });
    return {phone:[], laptop:[], gaming:[]};
  }

  const grouped = {phone:[], laptop:[], gaming:[]};
  (data || []).forEach(row => {
    const cat = row.category;
    if(!grouped[cat]) grouped[cat] = [];
    const hasDiscount = row.old_price && row.old_price > row.price;
    const discountPct = hasDiscount ? Math.round((1 - row.price / row.old_price) * 100) : 0;
    grouped[cat].push({
      sku: row.sku,
      name: row.name,
      price: row.price,
      was: row.old_price || null,
      icon: CATEGORY_ICON[cat] || '📦',
      imageUrl: row.image_url || null,
      tag: row.featured ? 'hot' : (hasDiscount ? 'deal' : null),
      tagLabel: row.featured ? '🔥 Best seller' : (hasDiscount ? `💸 Save ${discountPct}%` : ''),
      brand: row.brand,
      inStock: row.in_stock !== false,
    });
  });
  return grouped;
}

function naira(n){ return '₦' + n.toLocaleString('en-NG'); }

function productThumb(p){
  return p.imageUrl
    ? `<img src="${p.imageUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`
    : p.icon;
}

function renderGrid(id, items){
  const el = document.getElementById(id);
  if(items.length === 0){
    el.innerHTML = `<div class="sd-empty">No products here yet.</div>`;
    return;
  }
  el.innerHTML = items.map(p => `
    <div class="card" tabindex="0" data-sku="${p.sku}">
      ${p.tag ? `<div class="tag ${p.tag}">${p.tagLabel}</div>` : ''}
      <div class="card-thumb">${productThumb(p)}</div>
      <p class="card-name">${p.name}</p>
      <div class="card-brand">${p.brand}</div>
      <div class="stars">${p.inStock ? '✅ In Stock' : '⏳ Out of Stock'}</div>
      <div class="price-row">
        <span class="price-now">${naira(p.price)}</span>
        ${p.was ? `<span class="price-was">${naira(p.was)}</span>` : ''}
      </div>
      <div class="card-deposit">
        <span>Pay 40% now, balance on delivery.</span>
      </div>
    </div>
  `).join('');
}

const BRANDS = ['Apple','Samsung','Tecno','Infinix','Oraimo','Itel'];
let activeBrand = 'All';

function renderBrandChips(){
  const el = document.getElementById('brand-filter');
  const all = ['All', ...BRANDS];
  el.innerHTML = all.map(b => `
    <button class="brand-chip${b === activeBrand ? ' active' : ''}" data-brand="${b}">${b}</button>
  `).join('');
  el.querySelectorAll('.brand-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeBrand = chip.dataset.brand;
      renderBrandChips();
      renderCatalog();
    });
  });
}

function renderCatalog(){
  const categories = [
    {key:'phone', blockId:'phone-block', gridId:'phone-grid'},
    {key:'laptop', blockId:'laptop-block', gridId:'laptop-grid'},
    {key:'gaming', blockId:'gaming-block', gridId:'gaming-grid'},
  ];
  let totalShown = 0;
  categories.forEach(({key, blockId, gridId}) => {
    const filtered = activeBrand === 'All'
      ? products[key]
      : products[key].filter(p => p.brand === activeBrand);
    renderGrid(gridId, filtered);
    document.getElementById(blockId).style.display = filtered.length === 0 ? 'none' : '';
    totalShown += filtered.length;
  });
  document.getElementById('brand-no-results').style.display = totalShown === 0 ? 'block' : 'none';
  attachCardHandlers();
}

// --- COVER FLOW: featured products slider ---
const FEATURED_SKUS = ['PWR-001','PWR-007','LAP-001','LAP-003','GAM-001','PWR-003'];
const cfTrack = document.getElementById('cf-track');
const cfDots = document.getElementById('cf-dots');
let cfIndex = 0;
let cfItems = [];

function getFeaturedProducts(){
  return FEATURED_SKUS.map(sku => allProducts.find(p => p.sku === sku)).filter(Boolean);
}

function renderCoverflow(){
  if(cfItems.length === 0){
    cfTrack.innerHTML = '';
    return;
  }
  cfTrack.innerHTML = cfItems.map((p, i) => `
    <div class="cf-card${i === cfIndex ? ' cf-active' : ''}" data-index="${i}" data-sku="${p.sku}">
      <div class="cf-thumb">${productThumb(p)}</div>
      <div class="cf-name">${p.name}</div>
      <div class="cf-price">${naira(p.price)}</div>
    </div>
  `).join('');

  cfTrack.querySelectorAll('.cf-card').forEach(card => {
    const i = Number(card.dataset.index);
    const offset = i - cfIndex;
    const abs = Math.abs(offset);
    const x = offset * 130;
    const rotate = offset === 0 ? 0 : (offset > 0 ? -35 : 35);
    const scale = offset === 0 ? 1 : 0.78;
    const z = offset === 0 ? 10 : (10 - abs);
    const opacity = abs > 2 ? 0 : 1;
    card.style.transform = `translateX(${x}px) rotateY(${rotate}deg) scale(${scale})`;
    card.style.zIndex = z;
    card.style.opacity = opacity;

    card.addEventListener('click', () => {
      if(i === cfIndex){
        openModal(card.dataset.sku);
      } else {
        cfIndex = i;
        renderCoverflow();
        renderCfDots();
      }
    });
  });
}

function renderCfDots(){
  cfDots.innerHTML = cfItems.map((_, i) => `
    <span class="cf-dot${i === cfIndex ? ' active' : ''}" data-index="${i}"></span>
  `).join('');
  cfDots.querySelectorAll('.cf-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      cfIndex = Number(dot.dataset.index);
      renderCoverflow();
      renderCfDots();
    });
  });
}

document.getElementById('cf-prev').addEventListener('click', () => {
  if(cfItems.length === 0) return;
  cfIndex = (cfIndex - 1 + cfItems.length) % cfItems.length;
  renderCoverflow();
  renderCfDots();
});
document.getElementById('cf-next').addEventListener('click', () => {
  if(cfItems.length === 0) return;
  cfIndex = (cfIndex + 1) % cfItems.length;
  renderCoverflow();
  renderCfDots();
});

// Touch swipe support for mobile
const cfEl = document.getElementById('coverflow');
let cfTouchStartX = 0;
let cfTouchEndX = 0;

cfEl.addEventListener('touchstart', (e) => {
  cfTouchStartX = e.changedTouches[0].screenX;
}, {passive:true});

cfEl.addEventListener('touchend', (e) => {
  if(cfItems.length === 0) return;
  cfTouchEndX = e.changedTouches[0].screenX;
  const delta = cfTouchEndX - cfTouchStartX;
  const SWIPE_THRESHOLD = 40;
  if(delta > SWIPE_THRESHOLD){
    cfIndex = (cfIndex - 1 + cfItems.length) % cfItems.length;
    renderCoverflow();
    renderCfDots();
  } else if(delta < -SWIPE_THRESHOLD){
    cfIndex = (cfIndex + 1) % cfItems.length;
    renderCoverflow();
    renderCfDots();
  }
}, {passive:true});

// Inline search logo: reveal beside the search bar once scrolled past the hero, in either direction
const searchLogoInline = document.getElementById('search-logo-inline');
window.addEventListener('scroll', () => {
  if(window.scrollY > 160){
    searchLogoInline.classList.add('show');
  } else {
    searchLogoInline.classList.remove('show');
  }
}, {passive:true});

const searchInput = document.getElementById('search-input');
const searchDropdown = document.getElementById('search-dropdown');

function renderDropdown(term){
  const q = term.trim().toLowerCase();
  if(!q){
    searchDropdown.classList.remove('open');
    searchDropdown.innerHTML = '';
    return;
  }
  const matches = allProducts.filter(p =>
    p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  ).slice(0, 8);

  if(matches.length === 0){
    searchDropdown.innerHTML = `<div class="sd-empty">No products match "${term}"</div>`;
  } else {
    searchDropdown.innerHTML = matches.map(p => `
      <div class="sd-item" data-sku="${p.sku}">
        <div class="sd-thumb">${productThumb(p)}</div>
        <div class="sd-info">
          <div class="sd-name">${p.name}</div>
          <div class="sd-price">${naira(p.price)}</div>
        </div>
      </div>
    `).join('');
  }
  searchDropdown.classList.add('open');

  searchDropdown.querySelectorAll('.sd-item').forEach(item => {
    item.addEventListener('click', () => {
      openModal(item.dataset.sku);
      searchDropdown.classList.remove('open');
      searchInput.value = '';
    });
  });
}

searchInput.addEventListener('input', (e) => renderDropdown(e.target.value));
searchInput.addEventListener('focus', (e) => { if(e.target.value.trim()) renderDropdown(e.target.value); });
document.addEventListener('click', (e) => {
  if(!e.target.closest('.search-wrap')){
    searchDropdown.classList.remove('open');
  }
});

const overlay = document.getElementById('overlay');
const orderView = document.getElementById('order-view');
const confirmView = document.getElementById('confirm-view');
let current = null;
let qty = 1;

function findProduct(sku){
  return allProducts.find(p => p.sku === sku);
}

function openModal(sku){
  current = findProduct(sku);
  if(!current) return;
  qty = 1;
  orderView.style.display = 'block';
  confirmView.classList.remove('open');
  document.getElementById('m-tag').textContent = current.tagLabel || 'Available now';
  document.getElementById('m-name').textContent = current.name;
  document.getElementById('m-stars').innerHTML = current.inStock ? '✅ In Stock' : '⏳ Out of Stock';
  updateBreakdown();
  overlay.classList.add('open');
}

function updateBreakdown(){
  const total = current.price * qty;
  const deposit = Math.round(total * DEPOSIT_PCT);
  const balance = total - deposit;
  document.getElementById('m-price').textContent = naira(current.price) + ' each';
  document.getElementById('qty-val').textContent = qty;
  document.getElementById('b-total').textContent = naira(total);
  document.getElementById('b-deposit').textContent = naira(deposit);
  document.getElementById('b-balance').textContent = naira(balance);
  document.getElementById('pay-amt').textContent = naira(deposit);
}

function attachCardHandlers(){
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.sku));
    card.addEventListener('keypress', e => { if(e.key === 'Enter') openModal(card.dataset.sku); });
  });
}

document.getElementById('close-btn').addEventListener('click', () => overlay.classList.remove('open'));
overlay.addEventListener('click', e => { if(e.target === overlay) overlay.classList.remove('open'); });

document.getElementById('qty-minus').addEventListener('click', () => { if(qty>1){qty--; updateBreakdown();} });
document.getElementById('qty-plus').addEventListener('click', () => { qty++; updateBreakdown(); });

document.getElementById('pay-btn').addEventListener('click', () => {
  const name = document.getElementById('name-input').value.trim();
  const phone = document.getElementById('phone-input').value.trim();
  if(!name || !phone){
    alert('Please add your name and phone number so we can reach you.');
    return;
  }
  // --- INTEGRATION POINT ---
  // Replace this block with a real Paystack Inline call, e.g.:
  //
  // const handler = PaystackPop.setup({
  //   key: 'pk_live_xxx',
  //   email: `${phone}@placeholder.joyconnectmobile.ng`,
  //   amount: deposit * 100, // kobo
  //   currency: 'NGN',
  //   ref: 'JC-' + Date.now(),
  //   metadata: { sku: current.sku, qty, name, phone, area },
  //   callback: (response) => {
  //     // insert order into Supabase here, mark status 'deposit_paid'
  //   }
  // });
  // handler.openIframe();
  const ref = 'JC-' + Math.floor(Math.random()*900000 + 100000);
  document.getElementById('confirm-ref').textContent = ref;
  orderView.style.display = 'none';
  confirmView.classList.add('open');
});

// --- INIT: load real product data from Supabase, then render everything ---
async function init(){
  ['phone-grid','laptop-grid','gaming-grid'].forEach(id => {
    document.getElementById(id).innerHTML = `<div class="sd-empty">Loading products…</div>`;
  });

  products = await loadProducts();
  allProducts = [...products.phone, ...products.laptop, ...products.gaming];
  cfItems = getFeaturedProducts();

  renderBrandChips();
  renderCatalog();
  renderCoverflow();
  renderCfDots();
}

init();
