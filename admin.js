// --- SUPABASE CONNECTION ---
const SUPABASE_URL = 'https://gkskksiqpnhecbfcgdzq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_V8Uxpe4R_nxPThef25rvOQ_ipEbkdj3';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORY_ICON = {phone:'📱', laptop:'💻', gaming:'🎮'};

function naira(n){ return '₦' + Number(n).toLocaleString('en-NG'); }

// =========================
// AUTH
// =========================
const loginWrap = document.getElementById('login-wrap');
const adminWrap = document.getElementById('admin-wrap');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

async function checkSession(){
  const { data } = await sb.auth.getSession();
  if(data.session){
    showAdmin();
  } else {
    showLogin();
  }
}

function showLogin(){
  loginWrap.style.display = 'flex';
  adminWrap.style.display = 'none';
}

function showAdmin(){
  loginWrap.style.display = 'none';
  adminWrap.style.display = 'block';
  loadProducts();
  loadOrders();
}

loginBtn.addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  loginError.textContent = '';
  if(!email || !password){
    loginError.textContent = 'Please enter your email and password.';
    return;
  }
  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in…';

  const { error } = await sb.auth.signInWithPassword({ email, password });

  loginBtn.disabled = false;
  loginBtn.textContent = 'Log In';

  if(error){
    loginError.textContent = 'Incorrect email or password.';
    return;
  }
  showAdmin();
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await sb.auth.signOut();
  showLogin();
});

// =========================
// TABS
// =========================
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    document.getElementById('tab-products').style.display = target === 'products' ? 'block' : 'none';
    document.getElementById('tab-orders').style.display = target === 'orders' ? 'block' : 'none';
  });
});

// =========================
// STATS
// =========================
function renderStats(products, orders){
  const pendingOrders = orders.filter(o => o.status === 'pending_payment').length;
  const totalRevenue = orders
    .filter(o => o.status !== 'pending_payment')
    .reduce((sum, o) => sum + Number(o.deposit_amount || 0), 0);

  document.getElementById('stats-row').innerHTML = `
    <div class="stat-card"><div class="stat-num">${products.length}</div><div class="stat-label">Total Products</div></div>
    <div class="stat-card"><div class="stat-num">${orders.length}</div><div class="stat-label">Total Orders</div></div>
    <div class="stat-card"><div class="stat-num">${pendingOrders}</div><div class="stat-label">Pending Payment</div></div>
    <div class="stat-card"><div class="stat-num">${naira(totalRevenue)}</div><div class="stat-label">Deposits Collected</div></div>
  `;
}

let allProductsCache = [];
let allOrdersCache = [];

// =========================
// PRODUCTS
// =========================
async function loadProducts(){
  const { data, error } = await sb.from('products').select('*').order('sku');
  if(error){
    console.error('Failed to load products:', error);
    return;
  }
  allProductsCache = data || [];
  renderProductsTable(allProductsCache);
  renderStats(allProductsCache, allOrdersCache);
}

function renderProductsTable(products){
  const tbody = document.getElementById('products-tbody');
  if(products.length === 0){
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--ink-soft);padding:24px;">No products yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td>${p.image_url
        ? `<img src="${p.image_url}" class="row-thumb" alt="${p.name}">`
        : `<div class="row-thumb-icon">${CATEGORY_ICON[p.category] || '📦'}</div>`}</td>
      <td>${p.sku}</td>
      <td>${p.name}</td>
      <td>${p.brand || ''}</td>
      <td>${p.category || ''}</td>
      <td>${naira(p.price)}${p.old_price ? `<br><span style="color:var(--ink-soft);font-size:11.5px;text-decoration:line-through;">${naira(p.old_price)}</span>` : ''}</td>
      <td>${p.stock ?? '—'}</td>
      <td>${p.in_stock === false ? '<span class="badge out">Out of Stock</span>' : '<span class="badge in">In Stock</span>'}</td>
      <td>${p.featured ? '<span class="badge featured">🔥 Featured</span>' : '<span class="badge muted">—</span>'}</td>
      <td><button class="edit-link" data-id="${p.id}">Edit</button></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.edit-link').forEach(btn => {
    btn.addEventListener('click', () => openProductModal(btn.dataset.id));
  });
}

// --- Product modal ---
const productOverlay = document.getElementById('product-overlay');
const productModalTitle = document.getElementById('product-modal-title');
const productModalError = document.getElementById('product-modal-error');
const deleteBtn = document.getElementById('pf-delete-btn');

document.getElementById('add-product-btn').addEventListener('click', () => openProductModal(null));
document.getElementById('product-modal-close').addEventListener('click', closeProductModal);
productOverlay.addEventListener('click', (e) => { if(e.target === productOverlay) closeProductModal(); });

function closeProductModal(){
  productOverlay.classList.remove('open');
}

function openProductModal(id){
  productModalError.textContent = '';
  const product = id ? allProductsCache.find(p => String(p.id) === String(id)) : null;

  document.getElementById('pf-id').value = product ? product.id : '';
  document.getElementById('pf-sku').value = product ? product.sku : '';
  document.getElementById('pf-name').value = product ? product.name : '';
  document.getElementById('pf-brand').value = product ? product.brand : 'Itel';
  document.getElementById('pf-category').value = product ? product.category : 'phone';
  document.getElementById('pf-price').value = product ? product.price : '';
  document.getElementById('pf-old-price').value = product && product.old_price ? product.old_price : '';
  document.getElementById('pf-stock').value = product && product.stock != null ? product.stock : '';
  document.getElementById('pf-image').value = product && product.image_url ? product.image_url : '';
  document.getElementById('pf-in-stock').checked = product ? product.in_stock !== false : true;
  document.getElementById('pf-featured').checked = product ? !!product.featured : false;

  productModalTitle.textContent = product ? 'Edit Product' : 'Add Product';
  deleteBtn.style.display = product ? 'inline-block' : 'none';

  productOverlay.classList.add('open');
}

document.getElementById('pf-save-btn').addEventListener('click', async () => {
  const id = document.getElementById('pf-id').value;
  const sku = document.getElementById('pf-sku').value.trim();
  const name = document.getElementById('pf-name').value.trim();
  const price = Number(document.getElementById('pf-price').value);

  if(!sku || !name || !price){
    productModalError.textContent = 'SKU, name, and price are required.';
    return;
  }

  const payload = {
    sku,
    name,
    brand: document.getElementById('pf-brand').value,
    category: document.getElementById('pf-category').value,
    price,
    old_price: document.getElementById('pf-old-price').value ? Number(document.getElementById('pf-old-price').value) : null,
    stock: document.getElementById('pf-stock').value ? Number(document.getElementById('pf-stock').value) : 0,
    image_url: document.getElementById('pf-image').value.trim() || null,
    in_stock: document.getElementById('pf-in-stock').checked,
    featured: document.getElementById('pf-featured').checked,
  };

  const saveBtn = document.getElementById('pf-save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  let error;
  if(id){
    ({ error } = await sb.from('products').update(payload).eq('id', id));
  } else {
    ({ error } = await sb.from('products').insert(payload));
  }

  saveBtn.disabled = false;
  saveBtn.textContent = 'Save Product';

  if(error){
    console.error('Save failed:', error);
    productModalError.textContent = error.message.includes('duplicate')
      ? 'That SKU already exists — please use a unique one.'
      : "Couldn't save — please check the fields and try again.";
    return;
  }

  closeProductModal();
  loadProducts();
});

deleteBtn.addEventListener('click', async () => {
  const id = document.getElementById('pf-id').value;
  if(!id) return;
  if(!confirm('Delete this product? This cannot be undone.')) return;

  const { error } = await sb.from('products').delete().eq('id', id);
  if(error){
    productModalError.textContent = "Couldn't delete this product.";
    return;
  }
  closeProductModal();
  loadProducts();
});

// =========================
// ORDERS
// =========================
const ORDER_STATUSES = ['pending_payment', 'deposit_paid', 'shipped', 'delivered', 'cancelled'];

async function loadOrders(){
  const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false });
  if(error){
    console.error('Failed to load orders:', error);
    return;
  }
  allOrdersCache = data || [];
  renderOrdersTable(allOrdersCache);
  renderStats(allProductsCache, allOrdersCache);
}

function renderOrdersTable(orders){
  const tbody = document.getElementById('orders-tbody');
  if(orders.length === 0){
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--ink-soft);padding:24px;">No orders yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td>${o.reference}</td>
      <td>${o.customer_name}</td>
      <td>${o.customer_phone}</td>
      <td>${o.product_name}</td>
      <td>${o.quantity}</td>
      <td>${naira(o.deposit_amount)}</td>
      <td>${naira(o.balance_amount)}</td>
      <td>${o.delivery_area || '—'}</td>
      <td>
        <select class="status-select" data-id="${o.id}">
          ${ORDER_STATUSES.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s.replace('_',' ')}</option>`).join('')}
        </select>
      </td>
      <td>${new Date(o.created_at).toLocaleDateString('en-NG', {day:'numeric', month:'short', year:'numeric'})}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', async () => {
      const { error } = await sb.from('orders').update({ status: select.value }).eq('id', select.dataset.id);
      if(error){
        alert("Couldn't update order status.");
        return;
      }
      loadOrders();
    });
  });
}

// =========================
// INIT
// =========================
checkSession();
