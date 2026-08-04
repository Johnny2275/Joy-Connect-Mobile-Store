const DEPOSIT_PCT = 0.4;

// --- APPLY CONTACT & SOCIAL LINKS FROM config.js ---
(function applyContactConfig(){
  const wa = `https://wa.me/${CONTACT_CONFIG.whatsappNumber}`;
  document.getElementById('whatsapp-fab').href = wa;
  document.getElementById('social-whatsapp').href = wa;
  document.getElementById('social-facebook').href = CONTACT_CONFIG.facebookUrl;
  document.getElementById('social-instagram').href = CONTACT_CONFIG.instagramUrl;
  document.getElementById('social-tiktok').href = CONTACT_CONFIG.tiktokUrl;
  document.getElementById('social-email').href = `mailto:${CONTACT_CONFIG.email}`;
})();

// --- SUPABASE CONNECTION ---
const SUPABASE_URL = 'https://gkskksiqpnhecbfcgdzq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_V8Uxpe4R_nxPThef25rvOQ_ipEbkdj3';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORY_ICON = {phone:'📱', laptop:'💻', gaming:'🎮'};

// Fallback data used only if the live Supabase connection can't be reached
// (e.g. a blocked preview environment, or a temporary outage) so the store
// never shows completely empty or stuck loading.
const FALLBACK_PRODUCTS = {
  phone: [
    {sku:'PWR-001', name:'20W Fast-Charge Power Bank (10,000mAh)', price:16500, was:19900, icon:'🔋', tag:'hot', tagLabel:'🔥 Best seller', brand:'Itel', images:[], inStock:true},
    {sku:'PWR-002', name:'PD Fast-Charging USB-C Cable (1m)', price:3200, was:null, icon:'🔌', tag:null, tagLabel:'', brand:'Itel', images:[], inStock:true},
    {sku:'PWR-003', name:'Wireless Earbuds w/ Charging Case', price:14800, was:18000, icon:'🎧', tag:'deal', tagLabel:'💸 Save 18%', brand:'Oraimo', images:[], inStock:true},
    {sku:'PWR-004', name:'MagSafe-Style Wireless Charger', price:9500, was:null, icon:'📱', tag:null, tagLabel:'', brand:'Oraimo', images:[], inStock:true},
    {sku:'PWR-005', name:'Tempered Glass Screen Protector (2-pack)', price:2800, was:null, icon:'🛡️', tag:null, tagLabel:'', brand:'Itel', images:[], inStock:true},
    {sku:'PWR-006', name:'Car Phone Mount, Dashboard Clip', price:5200, was:null, icon:'🚗', tag:null, tagLabel:'', brand:'Oraimo', images:[], inStock:true},
    {sku:'PWR-007', name:'Shockproof Phone Case (clear + solid)', price:4500, was:5900, icon:'📲', tag:'deal', tagLabel:'💸 Save 24%', brand:'Tecno', images:[], inStock:true},
    {sku:'PWR-008', name:'In-Ear Wired Earphones w/ Mic', price:3800, was:null, icon:'🎧', tag:null, tagLabel:'', brand:'Oraimo', images:[], inStock:true},
  ],
  laptop: [
    {sku:'LAP-001', name:'7-in-1 USB-C Docking Hub', price:18500, was:null, icon:'🔗', tag:'hot', tagLabel:'🔥 Best seller', brand:'Itel', images:[], inStock:true},
    {sku:'LAP-002', name:'Wireless Mouse, Silent Click', price:7200, was:null, icon:'🖱️', tag:null, tagLabel:'', brand:'Oraimo', images:[], inStock:true},
    {sku:'LAP-003', name:'Adjustable Laptop Stand (Aluminium)', price:12800, was:15500, icon:'💻', tag:'deal', tagLabel:'💸 Save 17%', brand:'Itel', images:[], inStock:true},
    {sku:'LAP-004', name:'15.6" Padded Laptop Sleeve', price:8900, was:null, icon:'🎒', tag:null, tagLabel:'', brand:'Infinix', images:[], inStock:true},
    {sku:'LAP-005', name:'RGB Cooling Pad, Dual Fan', price:11400, was:null, icon:'❄️', tag:null, tagLabel:'', brand:'Oraimo', images:[], inStock:true},
    {sku:'LAP-006', name:'256GB Portable SSD, USB-C', price:24500, was:null, icon:'💾', tag:null, tagLabel:'', brand:'Samsung', images:[], inStock:true},
    {sku:'LAP-007', name:'Structured Laptop Bag, Water-resistant', price:15800, was:null, icon:'💼', tag:null, tagLabel:'', brand:'Itel', images:[], inStock:true},
  ],
  gaming: [
    {sku:'GAM-001', name:'Bluetooth Gamepad (Mobile + PC)', price:13500, was:16000, icon:'🎮', tag:'hot', tagLabel:'🔥 Best seller', brand:'Apple', images:[], inStock:true},
    {sku:'GAM-002', name:'Wired USB Gamepad (PC/Console-style)', price:9800, was:null, icon:'🕹️', tag:null, tagLabel:'', brand:'Infinix', images:[], inStock:true},
  ]
};

let products = {phone:[], laptop:[], gaming:[]};
let allProducts = [];

async function loadProducts(){
  try {
    const fetchPromise = sb.from('products').select('*');
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase request timed out')), 6000));
    const { data, error } = await Promise.race([fetchPromise, timeout]);

    if(error) throw error;
    if(!data || data.length === 0) throw new Error('No products returned');

    const grouped = {phone:[], laptop:[], gaming:[]};
    data.forEach(row => {
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
        images: [
    row.image_url,
    row.image_url2,
    row.image_url3,
    row.image_url4,
    row.image_url5
].filter(Boolean),
        tag: row.featured ? 'hot' : (hasDiscount ? 'deal' : null),
        tagLabel: row.featured ? '🔥 Best seller' : (hasDiscount ? `💸 Save ${discountPct}%` : ''),
        brand: row.brand,
        inStock: row.in_stock !== false,
      });
    });
    return grouped;

  } catch(err){
    console.warn('Supabase unavailable, showing sample data instead:', err.message || err);
    return FALLBACK_PRODUCTS;
  }
}

function naira(n){ return '₦' + n.toLocaleString('en-NG'); }

function productThumb(p){
    return p.images && p.images.length
        ? `<img src="${p.images[0]}" alt="${p.name}" class="product-thumb">`
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
    p.name.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q) ||
    (p.brand && p.brand.toLowerCase().includes(q))
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
const mainImage = document.getElementById("modal-main-image");
const thumbs = document.getElementById("modal-thumbnails");

thumbs.innerHTML = "";

if(current.images && current.images.length){

    mainImage.src = current.images[0];

    current.images.forEach(img =>{

        const thumb = document.createElement("img");

        thumb.src = img;

        thumb.onclick = ()=>{

            mainImage.src = img;

        };

        thumbs.appendChild(thumb);

    });

}
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

document.getElementById('pay-btn').addEventListener('click', async () => {
  const name = document.getElementById('name-input').value.trim();
  const phone = document.getElementById('phone-input').value.trim();
  const area = document.getElementById('area-input').value.trim();
  if(!name || !phone){
    alert('Please add your name and phone number so we can reach you.');
    return;
  }

  const payBtn = document.getElementById('pay-btn');
  const originalLabel = payBtn.innerHTML;
  payBtn.disabled = true;
  payBtn.innerHTML = 'Saving your order…';

  const total = current.price * qty;
  const deposit = Math.round(total * DEPOSIT_PCT);
  const balance = total - deposit;
  const ref = 'JC-' + Math.floor(Math.random()*900000 + 100000);

  // --- INTEGRATION POINT ---
  // Once you have real Paystack keys, trigger PaystackPop.setup() here instead,
  // and only run the Supabase insert below inside its callback after payment
  // actually succeeds, with status: 'deposit_paid' instead of 'pending_payment'.
  //
  // const handler = PaystackPop.setup({
  //   key: 'pk_live_xxx',
  //   email: `${phone}@placeholder.joyconnectmobile.ng`,
  //   amount: deposit * 100, // kobo
  //   currency: 'NGN',
  //   ref: ref,
  //   metadata: { sku: current.sku, qty, name, phone, area },
  //   callback: (response) => { ...insert below... }
  // });
  // handler.openIframe();

  const { error } = await sb.from('orders').insert({
    sku: current.sku,
    product_name: current.name,
    quantity: qty,
    unit_price: current.price,
    total_amount: total,
    deposit_amount: deposit,
    balance_amount: balance,
    customer_name: name,
    customer_phone: phone,
    delivery_area: area || null,
    reference: ref,
    status: 'pending_payment',
  });

  payBtn.disabled = false;
  payBtn.innerHTML = originalLabel;

  if(error){
    console.error('Order save failed:', error);
    alert("Sorry, we couldn't save your order right now. Please try again or contact us on WhatsApp.");
    return;
  }

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

  renderBrandChips();
  renderCatalog();
}

init();
